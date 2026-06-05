# Atmos — Application Flows

> Functional flows only. Tech stack, schema, and conventions are already set up
> elsewhere. Each flow lists the **actor**, required **permission**, the **happy
> path**, the **states** it moves through, and **edge cases** to handle. Implement
> features so each flow's happy path and every edge case behave as described.

Legend — booking states: `HELD → CONFIRMED → COMPLETED`, plus `CANCELLED`,
`EXPIRED`. Booking sources: `CUSTOMER`, `BLOCK`, `COMPETITION`. Roles:
`SUPER_ADMIN`, `OWNER`, `STAFF`.

---

## A. Access & tenancy

### A1. Resolve tenant (every request)

- **Trigger**: any incoming request.
- **Flow**:
  1. If multi-tenant disabled → tenant = default tenant.
  2. Else resolve by host: custom domain → subdomain → header → default.
  3. Bind resolved tenant to the request context for the whole lifecycle.
- **Edge cases**: unknown host/slug → 404; multiple tenants but no default in
  single mode → startup/config error, not a silent pick.

### A2. Login

- **Actor**: User (owner/staff/super admin).
- **Flow**:
  1. Submit email + password.
  2. Verify credentials; issue JWT (carries userId).
  3. Load the user's membership **for the active tenant** → role + allowed venueIds.
  4. Return session: user, role, permission list, venue scope.
- **Edge cases**: valid user but **no membership in this tenant** → 403 (exists
  elsewhere, not here); inactive user/tenant → 403.

### A3. Permission check (every protected action)

- **Flow**: action requires a permission → check role's permission set; for STAFF,
  also check the target resource's venue is in the user's venue scope.
- **Edge cases**: has permission but wrong venue → 403; SUPER_ADMIN bypasses tenant
  - venue scoping.

---

## B. Booking — customer self-service (public site)

### B1. View schedule / availability

- **Actor**: public visitor (no auth).
- **Flow**:
  1. Open a venue's public page → choose a field + date.
  2. System derives slots from the venue's open/close hours + slot length, then
     marks each slot available/taken by overlaying active bookings.
  3. Past slots and taken slots render as unavailable.
- **Edge cases**: venue/field inactive → not listed; date before today → no slots;
  respect venue timezone for "today" and slot boundaries.

### B2. Create a booking (hold)

- **Actor**: public visitor.
- **Flow**:
  1. Pick an available slot, enter name + phone (+ optional notes).
  2. System upserts the customer (by tenant + phone), computes total price and DP,
     and creates a booking as `CUSTOMER` / `HELD` with `holdExpiresAt = now + hold
minutes`.
  3. Return confirmation: slot, total, DP amount, payment instructions, countdown
     to hold expiry.
- **States**: → `HELD`.
- **Edge cases**: slot taken between viewing and submitting (race) → the database
  rejects the overlap → return 409 "slot just taken", do not create; end before
  start, or outside open hours → reject.

### B3. Pay the DP

- **Actor**: public visitor.
- **Flow**:
  1. On the hold confirmation, upload proof of transfer / show QRIS reference.
  2. Booking stays `HELD`, payment marked pending review.
  3. Customer sees "awaiting verification".
- **Edge cases**: hold already expired before proof submitted → block submission,
  inform slot was released.

### B4. Hold expiry (automatic)

- **Trigger**: scheduled job, every minute.
- **Flow**: any `HELD` booking past `holdExpiresAt` → `EXPIRED`, freeing the slot.
- **Edge cases**: never expire a booking already moved to `CONFIRMED`.

---

## C. Booking — admin operations

### C1. Manual booking (walk-in / phone)

- **Actor**: STAFF/OWNER — `booking.create`.
- **Flow**:
  1. Admin selects field + slot, enters customer (existing or new).
  2. System creates a `CUSTOMER` booking; admin may set it straight to `CONFIRMED`
     (e.g. cash on site) or leave `HELD`.
  3. Optionally record DP/full payment immediately.
- **Edge cases**: same overlap protection as B2 (DB rejects) → show conflict;
  STAFF limited to their venue.

### C2. Verify payment

- **Actor**: STAFF/OWNER — `payment.confirm`.
- **Flow**:
  1. Open a booking awaiting verification, review proof.
  2. Confirm → booking `CONFIRMED`, payment `DP_PAID` or `PAID`; clear hold expiry.
  3. Reject → keep `HELD` (let it expire) or cancel with reason.
- **Edge cases**: confirming an already `EXPIRED`/`CANCELLED` booking → must
  re-check slot is still free (DB enforces); if taken, refuse.

### C3. Block a slot (maintenance / private)

- **Actor**: STAFF/OWNER — `slot.block`.
- **Flow**: choose field + time range + reason → create a `BLOCK` booking
  (`CONFIRMED`, no customer). It occupies the slot exactly like a real booking.
- **Edge cases**: cannot block over an existing active booking (DB rejects); unblock
  = cancel the BLOCK booking.

### C4. Cancel

- **Actor**: STAFF/OWNER — `booking.cancel`.
- **Flow**: cancel a booking with optional reason → `CANCELLED`, slot freed.
- **Edge cases**: DP-refund decision is a payment concern (C6), separate from
  freeing the slot; cancelling a COMPETITION booking must also detach the match
  schedule (see E5).

### C5. Reschedule

- **Actor**: STAFF/OWNER — `booking.update`.
- **Flow**: pick a new slot → system validates the new slot is free, moves the
  booking (atomic: new slot must succeed before old is released).
- **Edge cases**: new slot taken → 409, original unchanged.

### C6. Refund (record-keeping)

- **Actor**: OWNER — `payment.refund`.
- **Flow**: mark a confirmed booking's payment `REFUNDED` with note. Money movement
  is manual/offline; system only records status.

### C7. Recurring / member booking

- **Actor**: STAFF/OWNER — `booking.create`.
- **Flow**:
  1. Define a recurring rule (e.g. every Tue 20:00–21:00 for N weeks) for a
     customer.
  2. System attempts to create each occurrence; reports which succeeded and which
     hit conflicts.
- **Edge cases**: partial success — clearly list conflicting dates rather than
  failing the whole series; let admin resolve conflicts individually.

---

## D. Pricing, config & staff (owner area)

### D1. Manage pricing

- **Actor**: OWNER — `pricing.manage`.
- **Flow**: set per-field price per hour (and, if implemented, weekday/weekend and
  prime-time overrides). New bookings price from current rules.
- **Edge cases**: changing price never alters already-created bookings' totals.

### D2. Manage tenant config

- **Actor**: OWNER — `config.manage`.
- **Flow**: edit open/close hours, slot length, DP percent, hold minutes per venue.
  Takes effect immediately (cached config invalidated on save).
- **Edge cases**: shortening open hours doesn't delete existing bookings outside the
  new window — flag them instead.

### D3. Manage staff

- **Actor**: OWNER — `staff.manage`.
- **Flow**:
  1. Invite/create a STAFF user, assign to one or more venues.
  2. Staff can only act within assigned venues.
  3. Owner can revoke or re-scope.
- **Edge cases**: cannot grant a role above one's own; removing a staff's last venue
  = effectively no access.

---

## E. Competition / bracket

### E1. Create competition

- **Actor**: OWNER — `competition.manage`.
- **Flow**: create with name, venue, format (single/double elim, round robin,
  group-KO), public slug → state `DRAFT`.

### E2. Register teams

- **Actor**: OWNER/STAFF — `competition.manage`.
- **Flow**: add teams (optional seed) while in `DRAFT`/`REGISTRATION`.
- **Edge cases**: lock team list before bracket generation.

### E3. Generate bracket

- **Actor**: OWNER — `competition.manage`.
- **Flow**:
  1. Generate matches from team count + format. Single-elim with non-power-of-2
     teams inserts byes; round robin generates all pairings.
  2. Each match gets round + position; elimination winners point to the next match.
  3. Competition → `ONGOING` (or after registration closes).
- **Edge cases**: regenerating wipes prior unplayed schedule; refuse if matches
  already have results.

### E4. Schedule a match

- **Actor**: OWNER/STAFF — `competition.manage`.
- **Flow**: assign a field + time to a match → system creates a `COMPETITION`
  booking for that slot (same overlap protection), links it to the match, match →
  `SCHEDULED`.
- **Edge cases**: chosen slot conflicts with any active booking → 409; rescheduling
  moves the linked booking.

### E5. Record result & advance

- **Actor**: OWNER/STAFF — `competition.manage`.
- **Flow**: enter scores → set winner → match `PLAYED`; winner propagates into the
  linked next match's open slot (home/away by bracket position).
- **Edge cases**: editing a result after advancement must re-propagate downstream;
  walkover sets winner without scores.

### E6. Public bracket view

- **Actor**: public visitor.
- **Flow**: competition's public page renders the bracket/standings from match
  data, server-rendered for SEO. Updates as results are entered.

---

## F. Content (articles / SEO)

### F1. Author article

- **Actor**: OWNER/STAFF — `article.manage`.
- **Flow**: create/edit title, slug, body (markdown), excerpt, cover, tags, SEO
  title/description → state `DRAFT`.

### F2. Publish

- **Actor**: OWNER — `article.manage`.
- **Flow**: publish → `PUBLISHED` with `publishedAt`; appears on the public site.
  Unpublish reverts to `DRAFT` and removes it from public listing.
- **Edge cases**: slug must be unique per tenant; changing a published slug should
  preserve discoverability (consider redirect — note for later).

### F3. Public read

- **Actor**: public visitor.
- **Flow**: published articles render server-side with correct meta/OG tags and are
  included in the sitemap.

---

## G. Dashboard & reports

### G1. Today / occupancy dashboard

- **Actor**: STAFF/OWNER — booking read.
- **Flow**: show today's bookings across the user's venue scope, current/next
  slots, and occupancy rate. STAFF sees only assigned venues.

### G2. Reports

- **Actor**: OWNER — `report.view`.
- **Flow**: revenue (confirmed/paid), occupancy over a date range, most-booked
  slots/fields. Excludes `CANCELLED`/`EXPIRED` from revenue.
- **Edge cases**: STAFF has no access to financial reports.

---

## Cross-cutting rules

- **Overlap is always rejected by the data layer**, never only pre-checked — every
  create/reschedule that touches a slot must treat a conflict as an expected 409.
- **Tenant + venue scope apply to every read and write.** A list never shows
  another tenant's data; STAFF never sees beyond assigned venues.
- **Timezone-correct** slot math everywhere (venue timezone).
- **Money is recorded, not moved** — the system tracks payment status; actual
  transfers/refunds happen offline (until a gateway is added later).
