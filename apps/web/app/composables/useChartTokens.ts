/**
 * Resolved design tokens for ApexCharts.
 *
 * Charts take colors as JS config, so they can't consume Tailwind classes and
 * would otherwise drift from the design system (they kept TailAdmin's indigo
 * long after the IDDS re-skin). Reading the *computed* custom properties off
 * <html> instead means charts follow both [data-theme] and [data-brand] with no
 * per-chart palette to maintain.
 *
 * Fallbacks are the IDDS light-mode values, used during SSR where there is no
 * computed style to read; the client re-evaluates on mount and on theme change.
 */
export function useChartTokens() {
  const { theme, isDark } = useTheme();

  function read(name: string, fallback: string): string {
    if (!import.meta.client) return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  const tokens = computed(() => {
    // Depend on theme so the same var name is re-read after a light/dark flip.
    void theme.value;
    return {
      brand: read('--primary', '#0956c3'),
      grid: read('--border', '#e5e5e5'),
      label: read('--muted-foreground', '#525252'),
      strong: read('--foreground', '#1f1f1f'),
      track: read('--muted', '#f2f2f2'),
      font: read('--font-sans', 'Inter, sans-serif'),
    };
  });

  return { tokens, isDark };
}
