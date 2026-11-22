(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduced || !('IntersectionObserver' in window)) {
    for (const el of reveals) el.classList.add('is-visible');
  } else {
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
  }

  const terminal = document.getElementById('terminal');
  const lines = terminal ? [...terminal.querySelectorAll('.terminal-line')] : [];
  if (!terminal || lines.length === 0 || reduced) return;

  const html = lines.map((line) => line.innerHTML);
  const texts = lines.map((line) => line.dataset.text ?? '');
  const cursor = terminal.querySelector('.terminal-cursor');
  let started = false;

  const finish = () => {
    lines.forEach((line, index) => {
      line.innerHTML = html[index] ?? texts[index] ?? '';
    });
    if (cursor) cursor.hidden = false;
  };

  const type = () => {
    if (started) return;
    started = true;
    lines.forEach((line) => {
      line.textContent = '';
    });
    if (cursor) cursor.hidden = false;

    let lineIndex = 0;
    let charIndex = 0;

    const step = () => {
      const line = lines[lineIndex];
      const text = texts[lineIndex] ?? '';
      if (!line) {
        finish();
        return;
      }
      if (charIndex < text.length) {
        line.textContent = text.slice(0, charIndex + 1);
        charIndex += 1;
        window.setTimeout(step, 18 + Math.random() * 10);
        return;
      }
      lineIndex += 1;
      charIndex = 0;
      if (lineIndex >= lines.length) {
        finish();
        return;
      }
      window.setTimeout(step, 130);
    };

    step();
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        type();
      },
      { threshold: 0.35 },
    );
    observer.observe(terminal);
    window.setTimeout(() => {
      observer.disconnect();
      type();
    }, 1600);
  } else {
    type();
  }
})();
