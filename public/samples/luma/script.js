/* LUMA Skin & Aesthetics — portfolio demo (no data is sent anywhere) */
(() => {
  /* ---------- mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    links.classList.toggle('open', !open);
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    }
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- before / after slider ---------- */
  const ba = document.getElementById('ba');
  const range = ba.querySelector('.ba-range');
  const setPos = v => ba.style.setProperty('--pos', v + '%');
  range.addEventListener('input', () => setPos(range.value));
  setPos(range.value);

  /* ---------- treatment data (shared by quiz + booking) ---------- */
  const T = {
    facial: {
      name: 'Luminous Hydrating Facial', img: 'images/service-facial.jpg',
      price: '₱2,500 – ₱4,500 per session',
      why: 'Your skin is asking for water and calm, not intensity. A hydrating facial restores comfort and glow with zero downtime — the gentlest place to start.'
    },
    laser: {
      name: 'Pico Laser Brightening', img: 'images/service-laser.jpg',
      price: '₱6,000 – ₱15,000 per session',
      why: 'Dark spots and uneven tone respond best to targeted light energy. Pico laser breaks up pigment with low heat, so it suits Filipino skin tones well.'
    },
    acne: {
      name: 'Clear Skin Acne Program', img: 'images/service-acne.jpg',
      price: '₱1,800 – ₱5,500 per session',
      why: 'Breakouts need a plan, not a single fix. Our doctor-led program treats active acne and its triggers, then fades the marks it leaves behind.'
    },
    glow: {
      name: 'Skin Booster Glow', img: 'images/service-glow.jpg',
      price: '₱8,000 – ₱25,000 per session',
      why: 'When skin loses bounce, hydration has to come from within. Skin boosters soften fine lines and restore that rested, dewy look over a few sessions.'
    }
  };

  /* ---------- quiz ---------- */
  const Q = [
    {
      q: 'What would you most like to change?',
      opts: [
        { t: 'Dullness and dehydration', s: 'Skin looks tired or feels tight', w: { facial: 3, glow: 1 } },
        { t: 'Dark spots and uneven tone', s: 'Sun spots, marks, patchiness', w: { laser: 3 } },
        { t: 'Breakouts and acne', s: 'Active pimples or frequent flare-ups', w: { acne: 3 } },
        { t: 'Fine lines and lost bounce', s: 'Skin feels thinner or less plump', w: { glow: 3, facial: 1 } }
      ]
    },
    {
      q: 'How does your skin usually feel by mid-afternoon?',
      opts: [
        { t: 'Tight or flaky', s: 'Dry, especially in aircon', w: { facial: 1, glow: 1 } },
        { t: 'Shiny and oily', s: 'Especially the T-zone', w: { acne: 2 } },
        { t: 'A bit of both', s: 'Oily centre, dry cheeks', w: { laser: 1, acne: 1 } },
        { t: 'Easily irritated', s: 'Redness, stinging, reactions', w: { facial: 2 } }
      ]
    },
    {
      q: 'How much downtime can you work with?',
      opts: [
        { t: 'None — back to work the same day', s: '', w: { facial: 2 } },
        { t: 'A day or two of redness is fine', s: '', w: { laser: 2, glow: 1 } },
        { t: "I'm ready for a multi-week program", s: '', w: { acne: 2, laser: 1, glow: 1 } }
      ]
    }
  ];

  const body = document.getElementById('quiz-body');
  const bar = document.getElementById('quiz-bar');
  const stepLabel = document.getElementById('quiz-step');
  let answers = [];

  function renderQuestion(i) {
    const item = Q[i];
    bar.style.width = ((i + 1) / Q.length * 100) + '%';
    stepLabel.textContent = `Question ${i + 1} of ${Q.length}`;
    body.innerHTML = `
      <div class="fade-in">
        <h3 class="q-title">${item.q}</h3>
        <div class="q-options">
          ${item.opts.map((o, k) => `
            <button type="button" class="q-opt" data-k="${k}">
              <i>${String.fromCharCode(65 + k)}</i>
              <span>${o.t}${o.s ? `<small>${o.s}</small>` : ''}</span>
            </button>`).join('')}
        </div>
        ${i > 0 ? '<button type="button" class="q-back">← Back</button>' : ''}
      </div>`;
    body.querySelectorAll('.q-opt').forEach(btn => btn.addEventListener('click', () => {
      answers[i] = Number(btn.dataset.k);
      if (i + 1 < Q.length) renderQuestion(i + 1); else renderResult();
    }));
    const back = body.querySelector('.q-back');
    if (back) back.addEventListener('click', () => renderQuestion(i - 1));
  }

  function renderResult() {
    const score = { facial: 0, laser: 0, acne: 0, glow: 0 };
    answers.forEach((k, i) => {
      const w = Q[i].opts[k].w;
      for (const key in w) score[key] += w[key];
    });
    // ties go to the treatment that matches question 1 (the main concern)
    const primary = Object.keys(Q[0].opts[answers[0]].w)[0];
    const best = Object.keys(score).sort((a, b) => (score[b] - score[a]) || (b === primary) - (a === primary))[0];
    const r = T[best];
    const sensitive = answers[1] === 3 && best !== 'facial';

    bar.style.width = '100%';
    stepLabel.textContent = 'Your starting point';
    body.innerHTML = `
      <div class="result fade-in">
        <div class="result-img"><img src="${r.img}" alt=""></div>
        <div>
          <span class="match">Recommended for you</span>
          <h3>${r.name}</h3>
          <p class="why">${r.why}${sensitive ? ' Because your skin reacts easily, your doctor will start with a patch test and a gentler setting.' : ''}</p>
          <p class="r-price">${r.price}</p>
          <div class="result-actions">
            <button type="button" class="btn btn-plum" id="book-this">Book this</button>
            <button type="button" class="btn btn-ghost" id="retake">Retake quiz</button>
          </div>
        </div>
      </div>`;
    document.getElementById('book-this').addEventListener('click', () => {
      const sel = document.getElementById('treatment-select');
      sel.value = best;
      sel.classList.remove('invalid');
      document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => document.querySelector('#booking-form input[name="name"]').focus({ preventScroll: true }), 700);
    });
    document.getElementById('retake').addEventListener('click', () => { answers = []; renderQuestion(0); });
  }

  renderQuestion(0);

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- booking form (demo only — nothing is sent) ---------- */
  const form = document.getElementById('booking-form');
  const done = document.getElementById('form-done');
  const err = document.getElementById('form-error');
  const dateInput = document.getElementById('date-input');
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);

  form.addEventListener('input', e => e.target.classList.remove('invalid'));

  form.addEventListener('submit', e => {
    e.preventDefault();
    let firstBad = null;
    form.querySelectorAll('input[required], select[required]').forEach(el => {
      const bad = !el.checkValidity();
      if (el.type !== 'checkbox') el.classList.toggle('invalid', bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      err.textContent = firstBad.name === 'consent'
        ? 'Please tick the consent box to continue.'
        : firstBad.name === 'phone'
          ? 'Please enter a PH mobile number, e.g. 0917 123 4567.'
          : 'Please complete the highlighted fields.';
      firstBad.focus();
      return;
    }
    err.textContent = '';
    // Intentionally NOT sending data anywhere — portfolio demo.
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  document.getElementById('form-reset').addEventListener('click', () => {
    form.reset();
    done.hidden = true;
    form.hidden = false;
    form.querySelector('input').focus();
  });
})();
