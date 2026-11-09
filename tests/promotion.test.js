import test from 'node:test';
import assert from 'node:assert/strict';
import { createPromotionPolicy, installPromotion, PROMOTION_POLICY } from '../promotion.js';

test('invitation requires three distinct calculations AND ninety seconds', () => {
  let clock = 1000;
  const policy = createPromotionPolicy(() => clock);
  policy.record('a'); policy.record('a'); policy.record('b');
  clock += 100000;
  assert.equal(policy.eligible(), false, 'repeated calculations are not extra activity');
  policy.record('c');
  assert.equal(policy.eligible(), true);
  policy.suppress();
  policy.record('d');
  clock += 9999999;
  assert.equal(policy.eligible(), false, 'never repeat during this page visit');
  const quick = createPromotionPolicy(() => clock);
  for (const key of ['a', 'b', 'c']) quick.record(key);
  clock += PROMOTION_POLICY.minimumVisitMs - 1;
  assert.equal(quick.eligible(), false);
  clock++;
  assert.equal(quick.eligible(), true);
});

function setup(t) {
  let clock = 0;
  let visible = true;
  let callback;
  const original = globalThis.document;
  globalThis.document = { visibilityState: 'visible' };
  t.after(() => { globalThis.document = original; });
  const dismiss = new EventTarget();
  const link = new EventTarget();
  const dialog = new EventTarget();
  dialog.open = false;
  dialog.opens = 0;
  dialog.querySelectorAll = () => [dismiss];
  dialog.showModal = () => { dialog.open = true; dialog.opens++; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event('close')); };
  const controller = installPromotion({ dialog, links: [link], now: () => clock,
    isResultVisible: () => visible,
    schedule: (fn, delay) => { assert.equal(delay, 2500); callback = fn; return 1; },
    unschedule: () => { callback = null; },
  });
  return { dialog, dismiss, link, controller,
    advance: () => { clock = 90000; }, hide: () => { visible = false; },
    fire: () => { const fn = callback; callback = null; fn?.(); },
    prepare: () => { clock = 90000; for (const key of ['a', 'b', 'c']) controller.calculationSucceeded(key); },
  };
}

test('successful activity schedules a delayed modal that cannot reappear', (t) => {
  const s = setup(t);
  s.prepare();
  assert.equal(s.dialog.opens, 0);
  s.fire();
  assert.equal(s.dialog.opens, 1);
  s.dismiss.dispatchEvent(new Event('click'));
  assert.equal(s.dialog.open, false);
  s.controller.calculationSucceeded('d'); s.fire();
  assert.equal(s.dialog.opens, 1);
});

test('edits cancel a pending invitation; invisible results never show a modal', (t) => {
  const s = setup(t);
  s.prepare();
  s.controller.cancelPending(); s.fire();
  assert.equal(s.dialog.opens, 0);
  s.controller.calculationSucceeded('d');
  s.hide(); s.fire();
  assert.equal(s.dialog.opens, 0);
});

test('store clicks, Escape and background tabs suppress unwanted reminders', (t) => {
  const s = setup(t);
  s.prepare();
  document.visibilityState = 'hidden'; s.fire();
  assert.equal(s.dialog.opens, 0);
  document.visibilityState = 'visible';
  s.controller.calculationSucceeded('d'); s.fire();
  assert.equal(s.dialog.opens, 1);
  s.dialog.dispatchEvent(new Event('cancel'));
  s.dialog.close();
  s.controller.calculationSucceeded('e'); s.fire();
  assert.equal(s.dialog.opens, 1);
  const other = createPromotionPolicy(() => 0);
  other.suppress();
  assert.equal(other.eligible(), false);
});

test('a banner store click before eligibility prevents the automatic invitation', (t) => {
  const s = setup(t);
  s.link.dispatchEvent(new Event('click'));
  s.prepare(); s.fire();
  assert.equal(s.dialog.opens, 0);
});
