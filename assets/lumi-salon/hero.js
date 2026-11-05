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
  let enabled = !reduced.matches, visible = true, following = false, target = poses.center, frame = 0, lastSeek = 0, lastFrame = 0, position = poses.center, velocity = 0;
  video.loop = true;
  video.playbackRate = .68;
  function labels() { toggle.setAttribute('aria-pressed', String(enabled)); toggle.setAttribute('aria-label', enabled ? 'Остановить анимацию' : 'Включить анимацию'); toggle.querySelector('.lumi-motion-icon').textContent = enabled ? 'Ⅱ' : '▷'; label.textContent = enabled ? (following ? 'Любопытный взгляд' : 'Живой момент') : 'Тихий момент'; }
  function play() { if (enabled && visible && !following && !document.hidden) video.play().catch(() => {}); }
  function endFollow() { following = false; cancelAnimationFrame(frame); frame = 0; lastFrame = 0; velocity = 0; labels(); }
  video.addEventListener('loadedmetadata', () => { video.currentTime = poses.center; });
  video.addEventListener('loadeddata', () => { video.classList.add('lumi-ready'); play(); });
  video.addEventListener('error', () => { video.classList.remove('lumi-ready'); toggle.hidden = true; endFollow(); });
  toggle.addEventListener('click', () => { enabled = !enabled; endFollow(); if (enabled) play(); else video.pause(); labels(); });
  function follow(now) {
    if (!following || !enabled || !visible || document.hidden) { frame = 0; return; }
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0;
    lastFrame = now;
    const delta = target - position;
    // Bound speed in source-video seconds per real second, independent of refresh rate.
    const desiredVelocity = Math.max(-1.35, Math.min(1.35, delta * 3.2));
    velocity += (desiredVelocity - velocity) * (1 - Math.exp(-dt / .16));
    let step = velocity * dt;
    if (Math.sign(step) === Math.sign(delta) && Math.abs(step) > Math.abs(delta)) {
      step = delta;
      velocity = 0;
    }
    position = Math.max(0, Math.min(video.duration / 2, position + step));
    if (!video.seeking && now - lastSeek >= 1000 / 30 && Math.abs(position - video.currentTime) > .018) {
      video.currentTime = position;
      lastSeek = now;
    }
    if (Math.abs(delta) < .018 && Math.abs(velocity) < .025 && !video.seeking) {
      frame = 0;
      lastFrame = 0;
      return;
    }
    frame = requestAnimationFrame(follow);
  }
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !enabled || video.readyState < 2 || e.target.closest('button,a')) return;
    const rect = hero.getBoundingClientRect();
    // Keep the gaze centered on the visible dog, including the cover crop.
    const scale = Math.max(rect.width / video.videoWidth, rect.height / video.videoHeight);
    const dogX = video.videoWidth * scale * .70 - (video.videoWidth * scale - rect.width) * .67;
    const horizontal = Math.max(-1, Math.min(1, (e.clientX - rect.left - dogX) / (rect.width * .43)));
    const gaze = Math.abs(horizontal) < .055 ? 0 : Math.sign(horizontal) * (Math.abs(horizontal) - .055) / .945;
    target = gaze < 0 ? poses.center - gaze * (poses.left - poses.center) : poses.center + gaze * (poses.right - poses.center);
    if (!following) {
      following = true;
      video.pause();
      // Both halves contain the same poses; choose the matching forward frame.
      position = video.currentTime > video.duration / 2 ? video.duration - video.currentTime : video.currentTime;
      video.currentTime = position;
      velocity = 0;
      labels();
    }
    if (!frame) frame = requestAnimationFrame(follow);
  });
  hero.addEventListener('pointerleave', () => { endFollow(); play(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) play(); else { video.pause(); endFollow(); } }, { threshold: .12 }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { video.pause(); endFollow(); } else play(); });
  reduced.addEventListener('change', () => { enabled = !reduced.matches; endFollow(); if (enabled) play(); else video.pause(); labels(); });
  labels();
})();
