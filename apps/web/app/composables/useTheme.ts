/**
 * Light/dark theme state.
 *
 * IDDS resolves its --ina-* tokens under [data-theme='light'|'dark'] on <html>,
 * so that attribute is the source of truth. The legacy `.dark` class is kept in
 * sync because `dark:` utilities and any third-party CSS may still key off it
 * (the `dark` custom variant in main.css matches either).
 *
 * The attribute is applied pre-paint by an inline script in nuxt.config
 * (anti-FOUC); this composable keeps a reactive mirror and persists the choice.
 */
type Theme = 'light' | 'dark';

export function useTheme() {
  // SSR-safe shared state. Default 'light'; the client reconciles on mount.
  const theme = useState<Theme>('theme', () => 'light');

  function apply(next: Theme) {
    theme.value = next;
    if (import.meta.client) {
      const root = document.documentElement;
      root.setAttribute('data-theme', next);
      root.classList.toggle('dark', next === 'dark');
      localStorage.setItem('theme', next);
    }
  }

  // Reconcile reactive state with whatever the anti-FOUC script already applied.
  onMounted(() => {
    theme.value = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  });

  const isDark = computed(() => theme.value === 'dark');

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark');
  }

  return { theme, isDark, toggle, setTheme: apply };
}
