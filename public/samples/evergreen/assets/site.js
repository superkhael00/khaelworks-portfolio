// Evergreen Home Cleaning demo site: nav, scroll reveal, before/after slider, quote form.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Mobile navigation
  const toggle = $('[data-nav-toggle]');
  const nav = $('#site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
  }

  // Scroll reveal (content is visible by default; only animated when JS and IntersectionObserver exist)
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Before / after slider: a native range input drives --pos (mouse, touch and arrow keys all work)
  $$('[data-compare]').forEach((el) => {
    const input = $('input[type="range"]', el);
    const sync = () => el.style.setProperty('--pos', Math.min(100, Math.max(0, Number(input.value))) + '%');
    input.addEventListener('input', sync);
    sync();
    // Touch browsers only move a range thumb when it is grabbed, so also follow the pointer across the whole image
    let dragging = false;
    const setFromX = (x) => {
      const r = el.getBoundingClientRect();
      input.value = String(Math.round(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100))));
      sync();
    };
    el.addEventListener('pointerdown', (e) => { dragging = true; el.setPointerCapture(e.pointerId); setFromX(e.clientX); });
    el.addEventListener('pointermove', (e) => { if (dragging) setFromX(e.clientX); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => el.addEventListener(t, () => { dragging = false; }));
  });

  // 3D tilt: mouse and pen only (touch keeps normal scrolling); skipped under reduced motion
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const MAX = 12; // degrees of lean at the edges
    $$('[data-tilt]').forEach((el) => {
      const reset = () => {
        el.classList.remove('is-tilting');
        ['--rx', '--ry'].forEach((v) => el.style.setProperty(v, '0deg'));
        ['--mx', '--my'].forEach((v) => el.style.setProperty(v, '50%'));
      };
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const r = el.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        el.classList.add('is-tilting');
        el.style.setProperty('--rx', ((0.5 - py) * 2 * MAX).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * 2 * MAX).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', reset);
      el.addEventListener('pointercancel', reset);
    });
  }

  // Quote form
  const form = $('[data-quote-form]');
  if (form) {
    const success = $('#quote-success');
    const fields = ['name', 'email', 'phone', 'service', 'message'];
    const showErrors = (errors) => {
      fields.forEach((f) => {
        const input = form.elements[f];
        const out = $('#err-' + f);
        out.textContent = errors[f] || '';
        if (errors[f]) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      });
    };
    const read = () => Object.fromEntries(fields.map((f) => [f, form.elements[f].value]));

    const preset = new URLSearchParams(location.search).get('service');
    if (preset && Array.from(form.elements.service.options).some((o) => o.value === preset)) form.elements.service.value = preset;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { valid, errors } = window.EvergreenValidate.validateQuote(read());
      showErrors(errors);
      if (!valid) { form.elements[fields.find((f) => errors[f])].focus(); return; }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
    // Clear a field's error as soon as the user fixes it
    form.addEventListener('input', () => {
      const { errors } = window.EvergreenValidate.validateQuote(read());
      fields.forEach((f) => { if (!errors[f] && form.elements[f].getAttribute('aria-invalid')) showErrors({ ...currentErrors(), [f]: '' }); });
    });
    const currentErrors = () => Object.fromEntries(fields.map((f) => [f, $('#err-' + f).textContent]));
    $('[data-form-reset]').addEventListener('click', () => {
      form.reset(); showErrors({}); success.hidden = true; form.hidden = false; form.elements.name.focus();
    });
  }
})();
