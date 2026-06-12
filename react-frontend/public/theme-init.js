(function () {
  try {
    var cookieMatch = document.cookie.match(/(?:^|;\s*)starlex-theme=([^;]+)/);
    var storedTheme = localStorage.getItem('starlex-theme');
    var rawTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : storedTheme;
    var theme = rawTheme === 'light' || rawTheme === 'solarized' ? 'light' : 'ultra-dark';

    var root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'ultra-dark');
  } catch (error) {
    document.documentElement.dataset.theme = 'ultra-dark';
    document.documentElement.classList.add('dark');
  }
})();
