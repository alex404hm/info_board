/**
 * Runs inline in <head> before first paint to prevent admin theme flash.
 * Sets data-admin-theme on <html> which AdminThemeProvider reads during SSR.
 */
export const adminThemeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('admin-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || 'system';
    var resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    document.documentElement.setAttribute('data-admin-theme', resolved);
  } catch (e) {}
})()
`
