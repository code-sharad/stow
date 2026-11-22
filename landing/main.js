(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector('.status');
  const links = [...document.querySelectorAll('.status-link')];
  const sections = [...document.querySelectorAll('main section[id]')];

  if (header) {
    let ticking = false;

    const sync = () => {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 4);

      const line = window.scrollY + 140;
      let active = '';
      for (const section of sections) {
        if (section.getBoundingClientRect().top + window.scrollY <= line) active = section.id;
      }

      for (const link of links) {
        if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(sync);
      },
      { passive: true },
    );

    sync();
  }

  const menuButton = document.querySelector('.status-menu');
  const panel = document.getElementById('nav-panel');
  const wide = window.matchMedia('(min-width: 768px)');

  if (menuButton && panel) {
    const setOpen = (open) => {
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? 'close' : 'menu';
      panel.hidden = !open;
      document.documentElement.classList.toggle('menu-open', open);
      for (const el of document.querySelectorAll('main, footer')) el.inert = open;
    };

    menuButton.addEventListener('click', () => setOpen(panel.hidden));
    panel.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    header?.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || panel.hidden) return;
      setOpen(false);
      menuButton.focus();
    });

    document.addEventListener('click', (event) => {
      if (panel.hidden) return;
      if (panel.contains(event.target) || menuButton.contains(event.target)) return;
      setOpen(false);
    });

    wide.addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduced || !('IntersectionObserver' in window)) {
    for (const el of reveals) el.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
  );
  for (const el of reveals) observer.observe(el);
  window.setTimeout(() => {
    for (const el of reveals) el.classList.add('is-visible');
    observer.disconnect();
  }, 2500);
})();
