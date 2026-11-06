(() => {
  document.documentElement.classList.add('lp-enhanced');
  const menuButton = document.querySelector('.lp-menu-toggle');
  const navigation = document.getElementById('lp-navigation');

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('is-open');
    document.body.classList.remove('lp-menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation?.classList.toggle('is-open', open);
    document.body.classList.toggle('lp-menu-open', open);
  });

  navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (navigation && menuButton && !navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  let wordObserver;
  const buildWordReveal = () => {
    const heading = document.querySelector('.lp-tagline h2');
    if (!heading) return;
    if (wordObserver) wordObserver.disconnect();
    heading.classList.add('lp-word-reveal');
    const phrase = heading.textContent.trim().split(/\s+/);
    heading.textContent = '';
    phrase.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'lp-word';
      span.textContent = word;
      span.style.transitionDelay = String(Math.min(index * 35, 420)) + 'ms';
      heading.append(span);
      if (index < phrase.length - 1) heading.append(document.createTextNode(' '));
    });
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wordObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-lit');
            wordObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.55 });
      heading.querySelectorAll('.lp-word').forEach(word => wordObserver.observe(word));
    } else {
      heading.querySelectorAll('.lp-word').forEach(word => word.classList.add('is-lit'));
    }
  };

  if (window.BUSHO_I18N && window.BUSHO_I18N.onLanguageChange) {
    window.BUSHO_I18N.onLanguageChange(() => {
      buildWordReveal();
      closeMenu();
    });
  }
  document.addEventListener('DOMContentLoaded', buildWordReveal);
  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 851px)').matches) closeMenu();
  });
})();