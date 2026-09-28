export const LIVING_CSS = `
.purrpose-living { }

/* =========================================================================
   1. ORGANIC ASYMMETRIC BREATHING & CONTACT SHADOW
   ========================================================================= */

.pcat-body {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Asymmetric natural breathing: rapid soft inhalation (0-38%), gentle slow exhalation (38-85%), rest (85-100%) */
.lc-breathe .pcat-body {
  animation: pcat-breathe-organic 3.8s cubic-bezier(0.42, 0, 0.58, 1) infinite;
}

.lc-breathe-sleeping .pcat-body {
  animation: pcat-breathe-sleep 5.0s cubic-bezier(0.42, 0, 0.58, 1) infinite;
}

.lc-breathe-tense .pcat-body {
  animation: pcat-breathe-alert 2.4s cubic-bezier(0.42, 0, 0.58, 1) infinite;
}

.lc-stretch .pcat-body {
  transform: scale(1.04, 1.09) translateY(-3px);
}

.lc-bob .pcat-body {
  animation: pcat-bob 0.42s steps(2, end) infinite;
}

@keyframes pcat-breathe-organic {
  0% { transform: scale(1, 1) translateY(0); }
  38% { transform: scale(1.025, 1.035) translateY(-1.5px); }
  85% { transform: scale(0.995, 0.995) translateY(0.2px); }
  100% { transform: scale(1, 1) translateY(0); }
}

@keyframes pcat-breathe-sleep {
  0% { transform: scale(1, 1) translateY(0); }
  45% { transform: scale(1.03, 1.045) translateY(-2px); }
  90% { transform: scale(0.99, 0.99) translateY(0); }
  100% { transform: scale(1, 1) translateY(0); }
}

@keyframes pcat-breathe-alert {
  0% { transform: scale(1, 1) translateY(0); }
  35% { transform: scale(1.02, 1.03) translateY(-1px); }
  75% { transform: scale(0.995, 0.995) translateY(0); }
  100% { transform: scale(1, 1) translateY(0); }
}

@keyframes pcat-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3.5px); }
}

/* Contact shadow beneath cat scaling with breathing */
.pcat-contact-shadow {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: pcat-shadow-scale 3.8s cubic-bezier(0.42, 0, 0.58, 1) infinite;
}

@keyframes pcat-shadow-scale {
  0%, 100% { transform: scale(1, 1); opacity: 0.35; }
  38% { transform: scale(0.95, 0.85); opacity: 0.22; }
  85% { transform: scale(1.02, 1.05); opacity: 0.38; }
}

/* =========================================================================
   2. PHYSICS-LIKE MULTI-HARMONIC TAIL SWAY & FLICK
   ========================================================================= */

/* The tail lives inside .pcat-body, so it inherits breathing/posture and stays
   attached. Its pivot is the root point each cat defines in Cat.tsx
   (e.g. .miso-tail { transform-origin: 172px 235px }), in view-box units.
   Keep the swing small: the root must never visibly leave the flank. */
.pcat-tail {
  transform-box: view-box;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lc-sway .pcat-tail {
  animation: pcat-tail-physics 4.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.lc-swayfast .pcat-tail {
  animation: pcat-tail-physics 2.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.lc-tailflicking .pcat-tail {
  animation: pcat-flick 0.75s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes pcat-tail-physics {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(5deg); }
  55% { transform: rotate(-4deg); }
  80% { transform: rotate(2deg); }
  100% { transform: rotate(0deg); }
}

@keyframes pcat-flick {
  0%, 100% { transform: rotate(0deg); }
  30% { transform: rotate(-9deg); }
  65% { transform: rotate(7deg); }
}

/* =========================================================================
   3. ORGANIC EYES & RANDOMIZED BLINKING
   ========================================================================= */

.pcat-eyes {
  transform-box: fill-box;
  transform-origin: 50% 50%;
}

.lc-blinking .pcat-eyes {
  animation: pcat-blink 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.lc-halfblink .pcat-eyes {
  animation: pcat-halfblink 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

.lc-stare .pcat-eyes {
  transform: scale(1.22);
}

@keyframes pcat-blink {
  0%, 100% { transform: scaleY(1); }
  45% { transform: scaleY(0.06); }
}

@keyframes pcat-halfblink {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.45); }
}

/* Subtle eye catchlight shimmer */
.pcat-catchlight {
  animation: pcat-glint-shimmer 6s ease-in-out infinite;
}

@keyframes pcat-glint-shimmer {
  0%, 100% { transform: translate(0, 0); opacity: 0.95; }
  50% { transform: translate(0.3px, -0.3px); opacity: 1; }
}

/* =========================================================================
   4. INDEPENDENT EAR TWITCHING (Left / Right / Dual)
   ========================================================================= */

.pcat-ear-left, .pcat-ear-right {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

.lc-ear-left-twitch .pcat-ear-left {
  animation: pcat-ear-l 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lc-ear-right-twitch .pcat-ear-right {
  animation: pcat-ear-r 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lc-earflicking .pcat-ear-left {
  animation: pcat-ear-l 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.lc-earflicking .pcat-ear-right {
  animation: pcat-ear-r 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s;
}

@keyframes pcat-ear-l {
  0%, 100% { transform: rotate(0deg); }
  40% { transform: rotate(-12deg); }
}

@keyframes pcat-ear-r {
  0%, 100% { transform: rotate(0deg); }
  40% { transform: rotate(12deg); }
}

/* =========================================================================
   5. SILKY HEAD TILTS & ATTENTIVE LISTENING
   ========================================================================= */

.pcat-head {
  transform-box: fill-box;
  transform-origin: 50% 92%;
  transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pcat-head.lc-tilt-up { transform: rotate(-7deg) translateY(-1px); }
.pcat-head.lc-tilt-down { transform: rotate(10deg) translateY(2px); }
.pcat-head.lc-listen-left { transform: rotate(-4.5deg) translateX(-1px); }
.pcat-head.lc-listen-right { transform: rotate(4.5deg) translateX(1px); }

/* Arms / Paws */
.pcat-arms {
  transform-box: fill-box;
  transform-origin: 50% 10%;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pcat-arms.lc-armup {
  transform: translateY(-8px) rotate(-11deg);
}

/* =========================================================================
   6. AMBIENT LIVING & SCENE ANIMATIONS
   ========================================================================= */

.lc-shake {
  animation: pcat-shake 0.45s ease-in-out;
}

@keyframes pcat-shake {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-2px, 0.8px); }
  40% { transform: translate(2px, -0.8px); }
  60% { transform: translate(-1.5px, 0.4px); }
  80% { transform: translate(1.5px, -0.4px); }
}

.lc-door {
  transform-box: fill-box;
  transform-origin: 0% 50%;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.lc-door.lc-open {
  transform: rotate(-22deg);
}

.lc-plant-leaf {
  transform-box: fill-box;
  transform-origin: 10% 10%;
  animation: pcat-leaf-sway 4.8s ease-in-out infinite;
}
.lc-plant-leaf:nth-child(2) { animation-delay: 1.2s; }
.lc-plant-leaf:nth-child(3) { animation-delay: 2.4s; }
@keyframes pcat-leaf-sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(4deg); }
}

.lc-clock-pendulum {
  transform-box: fill-box;
  transform-origin: 50% 0%;
  animation: pcat-pendulum 1.6s ease-in-out infinite;
}
@keyframes pcat-pendulum {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}

.lc-sunbeam {
  animation: pcat-sunbeam 6s ease-in-out infinite;
}
@keyframes pcat-sunbeam {
  0%, 100% { opacity: 0.18; }
  50% { opacity: 0.28; }
}

.lc-zzz {
  animation: pcat-zzz 2.8s ease-in-out infinite;
}
.lc-zzz:nth-of-type(2) { animation-delay: 0.9s; }
.lc-zzz:nth-of-type(3) { animation-delay: 1.8s; }
@keyframes pcat-zzz {
  0% { opacity: 0; transform: translate(0, 6px) scale(0.8); }
  30% { opacity: 0.95; }
  100% { opacity: 0; transform: translate(10px, -20px) scale(1.2); }
}

.lc-bubble {
  animation: pcat-pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-box: fill-box;
  transform-origin: 50% 100%;
  filter: drop-shadow(0 2px 5px rgba(43,35,31,0.14));
}
@keyframes pcat-pop-in {
  from { opacity: 0; transform: scale(0.7) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Moving day: the scene fades in and the cat drops into its new home. */
.lc-scene-enter {
  animation: pcat-scene-enter 0.9s ease-out both;
}
@keyframes pcat-scene-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}
.lc-move-hop {
  animation: pcat-move-hop 1.15s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
@keyframes pcat-move-hop {
  0% { opacity: 0; transform: translateY(-150px) scale(0.9); }
  45% { opacity: 1; transform: translateY(0) scale(1.06, 0.9); }
  65% { transform: translateY(-12px) scale(0.98, 1.03); }
  100% { transform: translateY(0) scale(1); }
}
.lc-moving-banner {
  animation: pcat-banner 3s ease both;
}
@keyframes pcat-banner {
  0% { opacity: 0; transform: translateY(-10px); }
  12%, 80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}
.lc-twinkle {
  animation: pcat-twinkle 3.2s ease-in-out infinite;
}
.lc-twinkle:nth-of-type(2n) { animation-delay: 1.4s; }
@keyframes pcat-twinkle {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .purrpose-living *, .purrpose-scene * {
    animation: none !important;
    transition: none !important;
  }
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
