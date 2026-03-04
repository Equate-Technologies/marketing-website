// Commit #67
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));


// ── Waitlist Modal ──
const modal        = document.getElementById('waitlist-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');
const waitlistForm = document.getElementById('waitlist-form');
const emailInput   = document.getElementById('waitlist-email');
const submitBtn    = document.getElementById('waitlist-submit');
const formDefault  = document.getElementById('form-default');
const formSuccess  = document.getElementById('form-success');
const formError    = document.getElementById('form-error');
const errorMsg     = document.getElementById('error-message');

// TODO: Replace with your API Gateway endpoint once backend is deployed
const API_ENDPOINT = 'YOUR_API_GATEWAY_URL';

function openModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => emailInput.focus(), 100);
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  // Reset form state after animation completes
  setTimeout(resetForm, 300);
}

function resetForm() {
  waitlistForm.reset();
  setFormState('default');
}

function setFormState(state) {
  formDefault.hidden = state !== 'default';
  formSuccess.hidden = state !== 'success';
  formError.hidden   = state !== 'error';
}

function setLoading(loading) {
  submitBtn.disabled    = loading;
  submitBtn.textContent = loading ? 'Submitting...' : 'Join the waitlist';
}

// Open modal from any waitlist trigger button
document.querySelectorAll('[data-waitlist]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
});

// Close on overlay click or close button
modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

// Form submission
waitlistForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  if (!email) return;

  setLoading(true);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Something went wrong.');
    }

    setFormState('success');
  } catch (err) {
    errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
    setFormState('error');
  } finally {
    setLoading(false);
  }
});
