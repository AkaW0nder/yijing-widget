// In-memory display policy only. No counters or birth details leave this page.
export const PROMOTION_POLICY = Object.freeze({ minimumCalculations: 3, minimumVisitMs: 90000, delayMs: 2500 });

export function createPromotionPolicy(now = Date.now) {
  const started = now();
  const calculations = new Set();
  let suppressed = false;
  return {
    record(key) { if (!suppressed) calculations.add(key); },
    eligible() {
      return !suppressed && calculations.size >= PROMOTION_POLICY.minimumCalculations &&
        now() - started >= PROMOTION_POLICY.minimumVisitMs;
    },
    suppress() { suppressed = true; calculations.clear(); },
  };
}

export function installPromotion({ dialog, links, isResultVisible, now = Date.now,
  schedule = setTimeout, unschedule = clearTimeout }) {
  const policy = createPromotionPolicy(now);
  let timer = null;
  const cancelPending = () => { if (timer !== null) unschedule(timer); timer = null; };
  const suppress = () => { policy.suppress(); cancelPending(); };
  const close = () => { suppress(); if (dialog.open) dialog.close(); };
  dialog.querySelectorAll('[data-promo-dismiss]').forEach((button) => button.addEventListener('click', close));
  dialog.addEventListener('cancel', suppress);
  dialog.addEventListener('close', suppress);
  links.forEach((link) => link.addEventListener('click', close));
  return {
    cancelPending,
    calculationSucceeded(key) {
      cancelPending();
      policy.record(key);
      if (!policy.eligible()) return;
      timer = schedule(() => {
        timer = null;
        if (!policy.eligible() || !isResultVisible() || document.visibilityState !== 'visible' ||
            dialog.open || typeof dialog.showModal !== 'function') return;
        policy.suppress();
        dialog.showModal();
      }, PROMOTION_POLICY.delayMs);
    },
  };
}
