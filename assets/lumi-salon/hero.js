(() => {
  const menu = document.querySelector('.lumi-menu-button');
  const navigation = document.querySelector('.lumi-navigation');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); navigation.classList.remove('lumi-open'); }
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); navigation.classList.toggle('lumi-open', open); });
  navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const hero = document.querySelector('.lumi-hero');
  const video = document.querySelector('.lumi-hero-video');
  const toggle = document.querySelector('.lumi-motion-toggle');
  const label = document.querySelector('.lumi-motion-label');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  // Times are measured from the actual generated footage, not inferred from the prompt.
  const poses = {
    horizontal: { min: 1.75, center: 3.458333, max: 5.125 },
    vertical: { min: 7.625, center: 9.75, max: 10.25 }
  };
  let enabled = !reduced.matches, visible = true, following = false, failed = false;
  let target = poses.horizontal.center, frame = 0, lastStep = 0, lastSeek = 0, lastPointer = 0, settledAt = 0;
  let axis = 'horizontal', activeAxis = 'horizontal';
  const idleDelay = 1600;
  video.muted = true;
  video.loop = true;
  video.playbackRate = .9;

  function labels() {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Остановить анимацию' : 'Включить анимацию');
    toggle.querySelector('.lumi-motion-icon').textContent = enabled ? 'Ⅱ' : '▷';
    label.textContent = enabled ? (following ? 'Любопытный взгляд' : 'Живой момент') : 'Тихий момент';
    hero.dataset.motion = following ? 'following-' + axis : enabled ? 'idle' : 'paused';
  }
  function play() {
    if (enabled && visible && !following && !failed && !document.hidden && video.readyState >= 2) {
      video.play().catch(() => {});
    }
  }
  function endFollow(resume = true) {
    following = false;
    cancelAnimationFrame(frame);
    frame = 0;
    lastStep = 0;
    labels();
    if (resume) play();
  }
  function ready() {
    if (failed || video.readyState < 2) return;
    video.classList.add('lumi-ready');
    play();
  }
  video.addEventListener('loadeddata', ready);
  video.addEventListener('canplay', ready);
  video.addEventListener('error', () => {
    failed = true;
    endFollow(false);
    video.classList.remove('lumi-ready');
    toggle.hidden = true;
  });
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    endFollow(false);
    if (enabled) play(); else video.pause();
  });

  function follow(now) {
    frame = 0;
    if (!following || !enabled || !visible || document.hidden) return;
    // Change axes through matching front-facing poses, never through unrelated footage.
    let destination = axis === activeAxis ? target : poses[activeAxis].center;
    if (axis !== activeAxis && !video.seeking && Math.abs(destination - video.currentTime) < .06) {
      activeAxis = axis;
      video.currentTime = poses[activeAxis].center;
      destination = target;
      lastSeek = now;
      lastStep = now;
    }
    const distance = Math.abs(destination - video.currentTime);
    if (axis === activeAxis && !video.seeking && distance < .07) { if (!settledAt) settledAt = now; } else settledAt = 0;
    if (now - lastPointer > idleDelay && ((settledAt && now - settledAt > 750) || now - lastPointer > 6000)) {
      endFollow();
      return;
    }
    const dt = lastStep ? Math.min((now - lastStep) / 1000, .06) : 1 / 30;
    if (!video.seeking && now - lastSeek >= 1000 / 30) {
      const delta = destination - video.currentTime;
      const step = Math.max(-3.2 * dt, Math.min(3.2 * dt, delta * (1 - Math.exp(-dt / .20))));
      if (Math.abs(delta) > .025) {
        video.currentTime = Math.max(0, Math.min(video.duration - .05, video.currentTime + step));
        lastSeek = now;
      }
      lastStep = now;
    }
    frame = requestAnimationFrame(follow);
  }
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches || !enabled || failed || video.readyState < 2) return;
    if (event.target.closest('button,a')) { endFollow(); return; }
    const rect = hero.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .69) * 2.8));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .37) * 2.5));
    // Small hysteresis prevents repeatedly switching axes near the diagonal.
    if (axis === 'horizontal' && Math.abs(y) > .43 && Math.abs(y) > Math.abs(x) + .16) axis = 'vertical';
    else if (axis === 'vertical' && (Math.abs(x) > Math.abs(y) + .12 || Math.abs(y) < .24)) axis = 'horizontal';
    const amount = axis === 'vertical' ? y : x;
    const pose = poses[axis];
    target = pose.center + Math.abs(amount) * ((amount < 0 ? pose.min : pose.max) - pose.center);
    if (!following) {
      following = true;
      video.pause();
      activeAxis = video.currentTime < 6.5 ? 'horizontal' : 'vertical';
      lastStep = 0;
    }
    labels();
    lastPointer = performance.now();
    settledAt = 0;
    if (!frame) frame = requestAnimationFrame(follow);
  });
  hero.addEventListener('pointerleave', () => endFollow());
  hero.addEventListener('pointercancel', () => endFollow());
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) play(); else { endFollow(false); video.pause(); }
  }, { threshold: .12 }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { endFollow(false); video.pause(); } else play();
  });
  window.addEventListener('blur', () => { endFollow(false); video.pause(); });
  window.addEventListener('focus', play);
  window.addEventListener('pageshow', ready);
  reduced.addEventListener('change', () => {
    enabled = !reduced.matches;
    endFollow(false);
    if (enabled) play(); else video.pause();
  });
  finePointer.addEventListener('change', () => endFollow());
  labels();
  // A cached video may finish loading before this deferred controller is evaluated.
  ready();
})();
