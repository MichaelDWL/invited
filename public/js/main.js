import { INVITE } from './config.js';
import { loadEvent, renderEvent, renderEventFallback } from './event.js';
import { startCountdown } from './countdown.js';
import { initRsvp } from './rsvp.js';
import { initAmbient } from './ambient.js';

function applyTexts() {
  for (const element of document.querySelectorAll('[data-text]')) {
    const text = INVITE.texts[element.dataset.text];
    if (text !== undefined) element.textContent = text;
  }
}

function applyCelebrant() {
  const { name, age, photoAlt } = INVITE.celebrant;

  for (const element of document.querySelectorAll('[data-celebrant]')) {
    element.textContent = element.dataset.celebrant === 'age' ? age : name;
  }

  const ageElement = document.querySelector('[data-celebrant="age"]');
  if (ageElement) ageElement.toggleAttribute('data-long', String(age).length > 3);
}

function initPortrait() {
  const photo = document.querySelector('[data-celebrant-photo]');
  if (!photo) return;

  photo.alt = INVITE.celebrant.photoAlt;
  const markLoaded = () => photo.classList.add('is-loaded');
  if (photo.complete && photo.naturalWidth > 0) markLoaded();
  else photo.addEventListener('load', markLoaded, { once: true });
}

function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  const reveal = (element) => element.classList.add('is-visible');

  if (!('IntersectionObserver' in window)) {
    items.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  items.forEach((item) => observer.observe(item));
}

async function initEvent(rsvp) {
  const countdown = document.querySelector('[data-countdown]');

  try {
    const event = await loadEvent();
    renderEvent(event);
    startCountdown(countdown, new Date(event.starts_at));
    rsvp.setMaxGuests(event.max_guests);
  } catch {
    renderEventFallback();
    countdown.hidden = true;
  }
}

applyTexts();
applyCelebrant();
initPortrait();
initReveal();
initAmbient(document.querySelector('[data-ambient-canvas]'));

const rsvp = initRsvp(
  document.querySelector('[data-rsvp-form]'),
  document.querySelector('[data-rsvp-success]'),
);
initEvent(rsvp);
