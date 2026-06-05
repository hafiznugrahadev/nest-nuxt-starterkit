/**
 * Light/dark theme state. The class is applied pre-paint by an inline script in
 * nuxt.config (anti-FOUC); this composable keeps a reactive mirror, persists the
 * choice to localStorage, and toggles the `.dark` class on <html>.
 */
type Theme = 'light' | 'dark';

export function useTheme() {
  // SSR-safe shared state. Default 'light'; the client reconciles on mount.
  const theme = useState<Theme>('theme', () => 'light');

  function apply(next: Theme) {
    theme.value = next;
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('theme', next);
    }
  }

  // Reconcile reactive state with whatever the anti-FOUC script already applied.
  onMounted(() => {
    theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const isDark = computed(() => theme.value === 'dark');

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark');
  }

  return { theme, isDark, toggle, setTheme: apply };
}
