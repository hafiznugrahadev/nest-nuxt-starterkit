<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, Pencil, Trash2, Search } from 'lucide-vue-next';
import { UserRole, type User } from '@starterkit/shared-types';
import { useAuthStore } from '~/stores/auth';
import { useUsers, useDeleteUser } from '../composables/useUsers';
import UserFormModal from './UserFormModal.vue';
import type { UserListParams } from '../types';

const { t } = useI18n();

const auth = useAuthStore();
const canManage = computed(() => auth.isSuperAdmin);

const search = ref('');
const selectedRoles = ref<string[]>([]);
const page = ref(1);
const params = computed<UserListParams>(() => ({
  page: page.value,
  limit: 10,
  search: search.value || undefined,
  // Server-side filter: the API is the source of truth (no client-side filtering).
  roles: selectedRoles.value.length ? [...selectedRoles.value] : undefined,
}));

// Role filter as multi-select tags — the API returns users holding ANY selected role.
const roleOptions = computed(() => [
  { label: t('users.roles.superAdmin'), value: UserRole.SUPER_ADMIN },
  { label: t('users.roles.admin'), value: UserRole.ADMIN },
  { label: t('users.roles.user'), value: UserRole.USER },
]);
function toggleRole(value: string) {
  const next = new Set(selectedRoles.value);
  next.has(value) ? next.delete(value) : next.add(value);
  selectedRoles.value = [...next];
  page.value = 1;
}
function clearRoles() {
  selectedRoles.value = [];
  page.value = 1;
}

const { data, isLoading, isError, error, refetch } = useUsers(params);
const rows = computed(() => data.value?.data ?? []);
const meta = computed(() => data.value?.meta);

// Create / edit modal
const formOpen = ref(false);
const editing = ref<User | null>(null);
function openCreate() {
  editing.value = null;
  formOpen.value = true;
}
function openEdit(user: User) {
  editing.value = user;
  formOpen.value = true;
}

// Delete confirm
const remove = useDeleteUser();
const deleteTarget = ref<User | null>(null);
const confirmOpen = ref(false);
function askDelete(user: User) {
  deleteTarget.value = user;
  confirmOpen.value = true;
}
async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await remove.mutateAsync(deleteTarget.value.id);
    confirmOpen.value = false;
  } catch {
    /* toast handled by useApiMutation */
  }
}

const roleVariant: Record<string, string> = {
  SUPER_ADMIN: 'default',
  ADMIN: 'secondary',
  USER: 'muted',
};
const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
const joined = (iso: string) => new Date(iso).toLocaleDateString('id-ID');
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative max-w-xs">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="search"
            :placeholder="$t('users.search')"
            class="h-10 w-full rounded-lg border border-border bg-transparent pl-9 pr-3 text-sm text-foreground shadow-theme-xs placeholder:text-muted-foreground focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
          />
        </div>
        <!-- Role filter as multi-select tags (server-side; API is source of truth) -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            :class="[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              selectedRoles.length === 0
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
            ]"
            @click="clearRoles"
          >
            {{ $t('users.roles.all') }}
          </button>
          <button
            v-for="opt in roleOptions"
            :key="opt.value"
            type="button"
            :class="[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              selectedRoles.includes(opt.value)
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
            ]"
            @click="toggleRole(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <Button v-if="canManage" size="sm" @click="openCreate">
        <Plus class="h-4 w-4" />
        {{ $t('users.addUser') }}
      </Button>
    </div>

    <ErrorState v-if="isError" :message="(error as Error)?.message" @retry="refetch()" />
    <LoadingState v-else-if="isLoading" />
    <EmptyState
      v-else-if="rows.length === 0"
      :title="$t('users.noResults')"
      :description="$t('users.noResultsHint')"
    />

    <!-- TailAdmin-style table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="border-y border-border">
            <th
              class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {{ $t('users.columns.user') }}
            </th>
            <th
              class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {{ $t('users.columns.roles') }}
            </th>
            <th
              class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {{ $t('users.columns.joined') }}
            </th>
            <th
              v-if="canManage"
              class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {{ $t('users.columns.action') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="u in rows" :key="u.id" class="transition-colors hover:bg-muted/40">
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600"
                >
                  {{ initials(u.name) }}
                </div>
                <div class="min-w-0">
                  <span class="block truncate text-sm font-medium text-foreground">{{
                    u.name
                  }}</span>
                  <span class="block truncate text-xs text-muted-foreground">{{ u.email }}</span>
                </div>
              </div>
            </td>
            <td class="px-5 py-4">
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="role in u.roles"
                  :key="role"
                  :variant="(roleVariant[role] ?? 'outline') as never"
                >
                  {{ role }}
                </Badge>
              </div>
            </td>
            <td class="px-5 py-4 text-sm text-muted-foreground">{{ joined(u.createdAt) }}</td>
            <td v-if="canManage" class="px-5 py-4">
              <div class="flex items-center justify-end gap-1">
                <button
                  class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  :title="$t('profile.personalInfo.edit')"
                  @click="openEdit(u)"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button
                  class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-error-50 hover:text-error-500"
                  :title="$t('users.deleteModal.title')"
                  @click="askDelete(u)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.totalPages > 1" class="flex items-center justify-between">
      <span class="text-sm text-muted-foreground">{{
        $t('users.pagination.total', { n: meta.total })
      }}</span>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">{{
          $t('users.pagination.prev')
        }}</Button>
        <span class="text-sm"
          >{{ $t('users.pagination.page') }} {{ meta.page }} {{ $t('users.pagination.of') }}
          {{ meta.totalPages }}</span
        >
        <Button variant="outline" size="sm" :disabled="page >= meta.totalPages" @click="page++">
          {{ $t('users.pagination.next') }}
        </Button>
      </div>
    </div>

    <!-- Create / edit -->
    <UserFormModal v-model:open="formOpen" :user="editing" @saved="refetch()" />

    <!-- Delete confirm -->
    <Modal v-model:open="confirmOpen" :title="$t('users.deleteModal.title')">
      <p class="text-sm text-muted-foreground">
        {{ $t('users.deleteModal.body', { name: deleteTarget?.name }) }}
      </p>
      <div class="mt-6 flex justify-end gap-3">
        <Button variant="outline" @click="confirmOpen = false">{{
          $t('users.deleteModal.cancel')
        }}</Button>
        <Button variant="destructive" :disabled="remove.isPending.value" @click="confirmDelete">
          {{
            remove.isPending.value
              ? $t('users.deleteModal.deleting')
              : $t('users.deleteModal.confirm')
          }}
        </Button>
      </div>
    </Modal>
  </div>
</template>
