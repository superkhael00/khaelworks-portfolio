// Pure quote-form validation. Classic script (ES modules are blocked on file://), also loadable by Node tests.
(function () {
  const SERVICES = ['residential', 'office', 'deep', 'move-out'];

  function validateQuote({ name = '', email = '', phone = '', service = '', message = '' }) {
    const errors = {};
    const n = name.trim();
    if (n.length < 2 || n.length > 80) errors.name = 'Please enter your name (2-80 characters).';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = 'Please enter a valid email address, like name@example.com.';

    const p = phone.trim();
    const digits = p.replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(p) || digits.length < 10 || digits.length > 15) errors.phone = 'Please enter a phone number with 10-15 digits.';

    if (!SERVICES.includes(service)) errors.service = 'Please choose a service.';

    if (message.trim().length > 1000) errors.message = 'Please keep your message under 1000 characters.';

    return { valid: Object.keys(errors).length === 0, errors };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { validateQuote, SERVICES };
  else window.EvergreenValidate = { validateQuote, SERVICES };
})();
