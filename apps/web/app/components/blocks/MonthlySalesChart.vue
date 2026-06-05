<script setup lang="ts">
import { computed } from 'vue';
import type { ApexOptions } from 'apexcharts';

/** Monthly sales bar chart (ApexCharts), matching TailAdmin's eCommerce card. */
const { isDark } = useTheme();

const series = [
  {
    name: 'Sales',
    data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
  },
];

const options = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'Outfit, sans-serif',
    toolbar: { show: false },
    background: 'transparent',
  },
  colors: ['#465fff'],
  plotOptions: {
    bar: { horizontal: false, columnWidth: '39%', borderRadius: 5, borderRadiusApplication: 'end' },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 4, colors: ['transparent'] },
  grid: {
    borderColor: isDark.value ? '#2a3441' : '#e4e7ec',
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    categories: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: isDark.value ? '#98a2b3' : '#667085', fontSize: '12px' } },
  },
  yaxis: {
    labels: { style: { colors: isDark.value ? '#98a2b3' : '#667085', fontSize: '12px' } },
  },
  legend: { show: false },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    y: { formatter: (val: number) => `${val}` },
  },
  fill: { opacity: 1 },
}));
</script>

<template>
  <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-foreground">Monthly Sales</h3>
    </div>
    <ClientOnly>
      <apexchart type="bar" height="320" :options="options" :series="series" />
      <template #fallback>
        <div class="h-[320px] animate-pulse rounded-xl bg-muted" />
      </template>
    </ClientOnly>
  </div>
</template>
