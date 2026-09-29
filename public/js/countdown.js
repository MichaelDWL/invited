const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const UNITS = [
  { key: 'days', size: DAY, singular: 'dia', plural: 'dias' },
  { key: 'hours', size: HOUR, singular: 'hora', plural: 'horas' },
  { key: 'minutes', size: MINUTE, singular: 'minuto', plural: 'minutos' },
  { key: 'seconds', size: SECOND, singular: 'segundo', plural: 'segundos' },
];

function splitDuration(milliseconds) {
  let rest = milliseconds;
  return UNITS.map((unit) => {
    const value = Math.floor(rest / unit.size);
    rest -= value * unit.size;
    return value;
  });
}

function bindUnits(root) {
  return UNITS.map((unit) => ({
    ...unit,
    valueEl: root.querySelector(`[data-unit="${unit.key}"]`),
    labelEl: root.querySelector(`[data-unit-label="${unit.key}"]`),
    current: null,
  }));
}

function renderUnit(unit, value) {
  if (unit.current === value) return;

  const isFirstRender = unit.current === null;
  unit.current = value;
  unit.valueEl.textContent = String(value).padStart(2, '0');
  unit.labelEl.textContent = value === 1 ? unit.singular : unit.plural;

  if (isFirstRender) return;
  unit.valueEl.classList.remove('is-ticking');
  void unit.valueEl.offsetWidth;
  unit.valueEl.classList.add('is-ticking');
}

function showFinished(root) {
  root.classList.add('is-done');
  root.querySelector('[data-countdown-done]').hidden = false;
}

/** Contagem regressiva até `target` (Date). Nunca exibe valores negativos. */
export function startCountdown(root, target) {
  const targetTime = target.getTime();
  if (Number.isNaN(targetTime)) {
    root.hidden = true;
    return;
  }

  const units = bindUnits(root);

  function tick() {
    const remaining = targetTime - Date.now();
    if (remaining <= 0) {
      showFinished(root);
      return;
    }

    splitDuration(remaining).forEach((value, index) => renderUnit(units[index], value));
    setTimeout(tick, (remaining % SECOND) + 20);
  }

  tick();
}
