/* Gaze UI helpers, shared by every eye-gaze app.
   GazeUI.theme('dark'|'light')  GazeUI.toast(text)  GazeUI.click()
   GazeUI.dwell(ms)  — 0 = off (when Windows Eye Control / Tobii already clicks). */
(function () {
  var dwellMs = 0, target = null, timer = 0, grace = 0, ring = null, lastFired = null;
  var SEL = '.g-btn, [data-dwell]';

  function theme(t) { document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark'; }

  var actx = null, soundOn = true;
  function click() {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(520, t + .08);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.14, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .12);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + .14);
    } catch (e) {}
  }

  var toastEl = null, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'g-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3800);
  }

  function showRing(t) {
    hideRing();
    ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ring.setAttribute('class', 'ring');
    var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    var rad = parseFloat(getComputedStyle(t).borderTopLeftRadius) || 20;
    r.setAttribute('rx', Math.max(0, rad - 2)); r.setAttribute('pathLength', '100');
    ring.appendChild(r); ring.style.setProperty('--dwell', dwellMs + 'ms');
    if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
    t.appendChild(ring);
    requestAnimationFrame(function () { if (ring) ring.classList.add('run'); });
  }
  function hideRing(done) {
    if (!ring) return;
    var r = ring; ring = null;
    if (done) { r.classList.add('done'); setTimeout(function () { r.remove(); }, 340); } else r.remove();
  }
  function cancel() { clearTimeout(timer); timer = 0; if (target) target.classList.remove('gz-hot'); target = null; hideRing(); }
  function fire() {
    var t = target; timer = 0;
    if (!t || !t.isConnected) { cancel(); return; }
    hideRing(true); t.classList.remove('gz-hot'); target = null; lastFired = t;
    t.click();
  }
  document.addEventListener('pointerover', function (e) {
    var t = e.target.closest && e.target.closest(SEL);
    if (t === target) { clearTimeout(grace); grace = 0; return; }
    if (!t) { if (target && !grace) grace = setTimeout(function () { grace = 0; cancel(); }, 140); return; }
    clearTimeout(grace); grace = 0; cancel();
    if (!dwellMs || t === lastFired || t.disabled) return;
    target = t; t.classList.add('gz-hot'); showRing(t);
    timer = setTimeout(fire, dwellMs);
  });
  document.addEventListener('pointerout', function (e) {
    var t = e.target.closest && e.target.closest(SEL);
    if (t && t === lastFired && !t.contains(e.relatedTarget)) lastFired = null; /* look away, then it can fire again */
  });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest(SEL)) click(); }, true);

  window.GazeUI = {
    theme: theme, toast: toast, click: click,
    dwell: function (ms) { dwellMs = Number(ms) || 0; if (!dwellMs) cancel(); },
    sound: function (on) { soundOn = !!on; }
  };
})();
