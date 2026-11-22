(function () {
  try {
    var theme = localStorage.getItem('stow.theme');
    var density = localStorage.getItem('stow.density');
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (density === 'comfortable' || density === 'compact') {
      document.documentElement.setAttribute('data-density', density);
    }
  } catch (error) {
    /* first paint falls back to the system theme */
  }
})();
