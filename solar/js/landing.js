document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('landing-overlay');
  if (!overlay) return;

  const enterBtn = document.getElementById('landing-enter-btn');
  const cursorEl = document.getElementById('landing-cursor');
  const cursorRing = cursorEl ? cursorEl.querySelector('.cursor-ring') : null;
  const cursorDot  = cursorEl ? cursorEl.querySelector('.cursor-dot')  : null;
  const starsCanvas = document.getElementById('landing-stars');

  // ── Starfield ──────────────────────────────
  if (starsCanvas) {
    const ctx = starsCanvas.getContext('2d');
    let W = starsCanvas.width = window.innerWidth;
    let H = starsCanvas.height = window.innerHeight;
    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.0006 + 0.0002,
      phase: Math.random() * Math.PI * 2
    }));
    let frame = 0;
    function drawStars() {
      if (!overlay.isConnected) return;
      ctx.clearRect(0, 0, W, H);
      frame++;
      stars.forEach(s => {
        const a = s.alpha * (0.7 + 0.3 * Math.sin(frame * s.speed * 60 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });
      requestAnimationFrame(drawStars);
    }
    drawStars();
    window.addEventListener('resize', () => {
      W = starsCanvas.width = window.innerWidth;
      H = starsCanvas.height = window.innerHeight;
    });
  }

  // ── Shooting Stars ─────────────────────────
  function spawnShootingStar() {
    const el = document.createElement('div');
    el.className = 'shooting-star';
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight * 0.5;
    const angle = Math.random() * 30 + 20;
    const len = Math.random() * 300 + 150;
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * len;
    const dy = Math.sin(rad) * len;
    const dur = Math.random() * 700 + 500;
    el.style.cssText = `left:${startX}px;top:${startY}px;--dx:${dx}px;--dy:${dy}px;animation-duration:${dur}ms;`;
    el.style.boxShadow = `0 0 2px #fff, -${len*0.3}px -${len*0.15}px ${len*0.2}px rgba(255,255,255,0.15)`;
    overlay.appendChild(el);
    setTimeout(() => el.remove(), dur + 100);
  }
  function scheduleShootingStar() {
    if (!overlay.isConnected) return;
    spawnShootingStar();
    setTimeout(scheduleShootingStar, Math.random() * 4000 + 1500);
  }
  setTimeout(scheduleShootingStar, 2500);

  // ── Custom Cursor ──────────────────────────
  if (cursorRing && cursorDot) {
    let mx = -200, my = -200, rx = -200, ry = -200;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top = my + 'px';
    });
    (function lerpCursor() {
      if (!overlay.isConnected) return;
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(lerpCursor);
    })();
    if (enterBtn) {
      enterBtn.addEventListener('mouseenter', () => {
        cursorRing.style.width = '64px'; cursorRing.style.height = '64px';
        cursorRing.style.borderColor = 'rgba(120,220,255,0.9)';
      });
      enterBtn.addEventListener('mouseleave', () => {
        cursorRing.style.width = '36px'; cursorRing.style.height = '36px';
        cursorRing.style.borderColor = 'rgba(255,255,255,0.5)';
      });
    }
  }

  // ── Parallax on mouse ──────────────────────
  const content = document.getElementById('landing-content');
  if (content) {
    document.addEventListener('mousemove', e => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      content.style.transform = `translate(${cx * 8}px, ${cy * 5}px)`;
    });
  }

  // ── Enter app ─────────────────────────────
  function enterApp() {
    overlay.classList.add('exit');
    setTimeout(() => { overlay.remove(); }, 1300);
  }

  if (enterBtn) enterBtn.addEventListener('click', e => { e.stopPropagation(); enterApp(); });
  overlay.addEventListener('click', enterApp);
  document.addEventListener('keydown', e => {
    if ((e.code === 'Space' || e.code === 'Enter') && overlay.isConnected) enterApp();
  });
});
