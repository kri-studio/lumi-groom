(() => {
  const menu = document.querySelector('.lumi-menu-button');
  const navigation = document.querySelector('.lumi-navigation');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); navigation.classList.remove('lumi-open'); }
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); navigation.classList.toggle('lumi-open', open); });
  navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const hero = document.querySelector('.lumi-hero'), video = document.querySelector('.lumi-hero-video');
  const toggle = document.querySelector('.lumi-motion-toggle'), label = document.querySelector('.lumi-motion-label');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const poses = { right: .75, center: 2.35, left: 4.05 };
  let enabled = !reduced.matches, visible = true, following = false, target = poses.center, frame = 0, lastSeek = 0;
  video.loop = true;
  function labels() { toggle.setAttribute('aria-pressed', String(enabled)); toggle.setAttribute('aria-label', enabled ? 'Остановить анимацию' : 'Включить анимацию'); toggle.querySelector('.lumi-motion-icon').textContent = enabled ? 'Ⅱ' : '▷'; label.textContent = enabled ? (following ? 'Любопытный взгляд' : 'Живой момент') : 'Тихий момент'; }
  function play() { if (enabled && visible && !following && !document.hidden) video.play().catch(() => {}); }
  function endFollow() { following = false; cancelAnimationFrame(frame); frame = 0; labels(); }
  video.addEventListener('loadedmetadata', () => { video.currentTime = poses.center; });
  video.addEventListener('loadeddata', () => { video.classList.add('lumi-ready'); play(); });
  video.addEventListener('error', () => { video.classList.remove('lumi-ready'); toggle.hidden = true; endFollow(); });
  toggle.addEventListener('click', () => { enabled = !enabled; endFollow(); if (enabled) play(); else video.pause(); labels(); });
  function follow(now) {
    if (!following || !enabled || !visible || document.hidden) { frame = 0; return; }
    const delta = target - video.currentTime;
    if (!video.seeking && now - lastSeek > 33 && Math.abs(delta) > .025) { video.currentTime = Math.max(0, Math.min(video.duration - .04, video.currentTime + Math.max(-.22, Math.min(.22, delta * .24)))); lastSeek = now; }
    frame = requestAnimationFrame(follow);
  }
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !enabled || video.readyState < 2 || e.target.closest('button,a')) return;
    const rect = hero.getBoundingClientRect();
    const horizontal = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - .70) / .30));
    target = horizontal < 0 ? poses.center + -horizontal * (poses.left - poses.center) : poses.center + horizontal * (poses.right - poses.center);
    if (!following) { following = true; video.pause(); if (video.currentTime > video.duration / 2) video.currentTime = video.duration - video.currentTime; labels(); }
    if (!frame) frame = requestAnimationFrame(follow);
  });
  hero.addEventListener('pointerleave', () => { endFollow(); play(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) play(); else { video.pause(); endFollow(); } }, { threshold: .12 }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { video.pause(); endFollow(); } else play(); });
  reduced.addEventListener('change', () => { enabled = !reduced.matches; endFollow(); if (enabled) play(); else video.pause(); labels(); });
  labels();
})();
