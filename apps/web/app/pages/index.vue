<script setup lang="ts">
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-vue-next';
import { APP_NAME } from '~/lib/constants';

definePageMeta({ layout: 'dashboard' });
useHead({ title: `Dashboard — ${APP_NAME}` });

// Demo metrics (static, like the TailAdmin template's eCommerce dashboard).
const metrics = [
  { label: 'Customers', value: '3,782', icon: Users, change: 11.01 },
  { label: 'Orders', value: '5,359', icon: ShoppingCart, change: -9.05 },
  { label: 'Revenue', value: '$45.2K', icon: DollarSign, change: 4.3 },
  { label: 'Growth', value: '8.21%', icon: TrendingUp, change: 1.05 },
];
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <p class="text-sm text-muted-foreground">Welcome back — here's what's happening today.</p>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        v-for="m in metrics"
        :key="m.label"
        :label="m.label"
        :value="m.value"
        :icon="m.icon"
        :change="m.change"
      />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <MonthlySalesChart />
      </div>
      <MonthlyTarget />
    </div>
  </div>
</template>
