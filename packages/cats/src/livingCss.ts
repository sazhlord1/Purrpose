export const LIVING_CSS = `
.purrpose-living { }
.pcat-tail { transform-box: fill-box; transform-origin: 94% 94%; }
.lc-sway .pcat-tail { animation: pcat-sway 4.2s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite; }
.lc-swayfast .pcat-tail { animation: pcat-sway 2.4s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite; }
.lc-tailflicking .pcat-tail { animation: pcat-flick .75s cubic-bezier(0.25, 1, 0.5, 1); }
@keyframes pcat-sway { 0%,100% { transform: rotate(0deg); } 30% { transform: rotate(8deg); } 70% { transform: rotate(-6deg); } }
@keyframes pcat-flick { 0%,100% { transform: rotate(0deg); } 35% { transform: rotate(-18deg); } 65% { transform: rotate(12deg); } }

.pcat-body { transform-box: fill-box; transform-origin: 50% 100%; }
.lc-breathe .pcat-body { animation: pcat-breathe 3.6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
.lc-bob .pcat-body { animation: pcat-bob .45s steps(2, end) infinite; }
.lc-stretch .pcat-body { transform: scale(1.05, 1.08) translateY(-2px); }
@keyframes pcat-breathe { 0%,100% { transform: scale(1, 1); } 50% { transform: scale(1.02, 1.032) translateY(-1px); } }
@keyframes pcat-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3.5px); } }

.pcat-eyes { transform-box: fill-box; transform-origin: 50% 50%; }
.lc-blinking .pcat-eyes { animation: pcat-blink .18s cubic-bezier(0.4, 0, 0.2, 1); }
.lc-stare .pcat-eyes { transform: scale(1.22); }
@keyframes pcat-blink { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.08); } }

.pcat-ears { transform-box: fill-box; transform-origin: 50% 100%; }
.lc-earflicking .pcat-ears { animation: pcat-ear .36s ease-in-out; }
@keyframes pcat-ear { 0%,100% { transform: rotate(0deg); } 40% { transform: rotate(-10deg); } }

.pcat-head { transform-box: fill-box; transform-origin: 50% 92%; transition: transform .36s cubic-bezier(.34, 1.56, .64, 1); }
.pcat-head.lc-tilt-up { transform: rotate(-8deg) translateY(-1px); }
.pcat-head.lc-tilt-down { transform: rotate(12deg) translateY(2px); }

.pcat-arms { transform-box: fill-box; transform-origin: 50% 10%; transition: transform .22s cubic-bezier(.34, 1.56, .64, 1); }
.pcat-arms.lc-armup { transform: translateY(-8px) rotate(-11deg); }

.lc-shake { animation: pcat-shake .45s ease-in-out; }
@keyframes pcat-shake { 0%,100% { transform: translate(0, 0); } 20% { transform: translate(-2px, .8px); } 40% { transform: translate(2px, -.8px); } 60% { transform: translate(-1.5px, .4px); } 80% { transform: translate(1.5px, -.4px); } }

.lc-door { transform-box: fill-box; transform-origin: 0% 50%; transition: transform .6s cubic-bezier(.34, 1.56, .64, 1); }
.lc-door.lc-open { transform: rotate(-22deg); }

.lc-plant-leaf { transform-box: fill-box; transform-origin: 10% 10%; animation: pcat-leaf-sway 4.8s ease-in-out infinite; }
.lc-plant-leaf:nth-child(2) { animation-delay: 1.2s; }
.lc-plant-leaf:nth-child(3) { animation-delay: 2.4s; }
@keyframes pcat-leaf-sway { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }

.lc-clock-pendulum { transform-box: fill-box; transform-origin: 50% 0%; animation: pcat-pendulum 1.6s ease-in-out infinite; }
@keyframes pcat-pendulum { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }

.lc-sunbeam { animation: pcat-sunbeam 6s ease-in-out infinite; }
@keyframes pcat-sunbeam { 0%,100% { opacity: 0.18; } 50% { opacity: 0.28; } }

.lc-zzz { animation: pcat-zzz 2.8s ease-in-out infinite; }
.lc-zzz:nth-of-type(2) { animation-delay: .9s; }
.lc-zzz:nth-of-type(3) { animation-delay: 1.8s; }
@keyframes pcat-zzz { 0% { opacity: 0; transform: translate(0, 6px) scale(0.8); } 30% { opacity: .95; } 100% { opacity: 0; transform: translate(10px, -20px) scale(1.2); } }

.lc-bubble { animation: pcat-pop-in .35s cubic-bezier(.34, 1.56, .64, 1); transform-box: fill-box; transform-origin: 50% 100%; filter: drop-shadow(0 2px 4px rgba(43,35,31,0.12)); }
@keyframes pcat-pop-in { from { opacity: 0; transform: scale(.7) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .purrpose-living *, .purrpose-scene * { animation: none !important; transition: none !important; }
}
`;

let injected = false;

export function injectLivingStyle(): void {
  if (injected || typeof document === 'undefined') return;
  if (document.getElementById('purrpose-living-css')) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = 'purrpose-living-css';
  style.textContent = LIVING_CSS;
  document.head.appendChild(style);
  injected = true;
}
