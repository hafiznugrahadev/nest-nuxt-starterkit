<script setup lang="ts">
import { Goal } from 'lucide-vue-next';
</script>

<template>
  <section class="mx-auto max-w-2xl space-y-6 text-center">
    <div class="flex justify-center">
      <Goal class="h-14 w-14 text-primary" />
    </div>
    <h1 class="text-3xl font-bold tracking-tight">Mini Soccer Booking</h1>
    <p class="text-muted-foreground">
      Book a mini soccer field in seconds. Browse availability, pick a slot, and play.
    </p>
    <div class="flex justify-center gap-3">
      <Button as="a" href="/fields">Browse fields</Button>
      <Button as="a" variant="outline" href="/bookings">My bookings</Button>
    </div>
  </section>
</template>
