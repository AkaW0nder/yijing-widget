// Load on the parent page with `defer`. Same-origin embedding only.
const frames = [...document.querySelectorAll('iframe[data-yijing-widget]')];
function hello(frame) {
  if (new URL(frame.src, location.href).origin === location.origin) {
    frame.contentWindow?.postMessage({ type: 'yijing:hello' }, location.origin);
  }
}
for (const frame of frames) {
  frame.addEventListener('load', () => hello(frame));
  hello(frame);
}
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.data?.type !== 'yijing:height') return;
  const frame = frames.find((candidate) => candidate.contentWindow === event.source &&
    new URL(candidate.src, location.href).origin === event.origin);
  const height = event.data.height;
  if (frame && Number.isFinite(height) && height >= 300 && height <= 10000) {
    frame.style.height = `${Math.ceil(height)}px`;
  }
});
