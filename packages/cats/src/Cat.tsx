import type { CatId } from '@purrpose/shared';
import { DEFAULT_EXPRESSION, type CatState, type Expression } from './poses.js';
import { catName, resolveCatConfig } from './config.js';

export interface CatProps {
  catId: CatId;
  state?: CatState;
  expression?: Expression;
  size?: number;
  showGround?: boolean;
  className?: string;
  title?: string;
  headTilt?: -1 | 0 | 1;
  armUp?: boolean;
}

export function Cat({
  catId,
  state = 'WAITING',
  expression,
  size = 240,
  showGround = true,
  className,
  title,
  headTilt = 0,
  armUp = false,
}: CatProps) {
  // Safe config resolution with fallback
  let config;
  try {
    config = resolveCatConfig(catId);
  } catch {
    config = resolveCatConfig('orange');
  }

  const expr = expression ?? DEFAULT_EXPRESSION[state];
  const isSleeping = state === 'SLEEPING' || expr === 'sleep';
  const isHappy = state === 'SATISFIED' || state === 'SUCCESS' || expr === 'happyShut';
  const isSad = state === 'FAILURE' || expr === 'sad';

  const tiltClass = headTilt === -1 ? 'lc-tilt-up' : headTilt === 1 ? 'lc-tilt-down' : '';
  const headTransform = headTilt === -1 ? 'rotate(-6 120 145)' : headTilt === 1 ? 'rotate(6 120 145)' : undefined;
  const armTransform = armUp ? 'translate(0, -8)' : undefined;

  return (
    <svg
      viewBox="0 0 240 280"
      width={size}
      height={(size * 280) / 240}
      role="img"
      aria-label={title ?? `${catName(catId)} the ${catId} cat, state ${state.toLowerCase()}`}
      data-cat={catId}
      data-state={state}
      data-expression={expr}
      className={`pcat-root ${className ?? ''}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{`
          @keyframes mochiBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.02, 1.025); } }
          @keyframes mochiBlink { 0%, 88%, 94%, 100% { transform: scaleY(1); } 91% { transform: scaleY(0.08); } }
          @keyframes mochiTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(-7deg); } 75% { transform: rotate(5deg); } }
          @keyframes mochiEarL { 0%, 90%, 96%, 100% { transform: rotate(0deg); } 93% { transform: rotate(-7deg); } }
          .mochi-body { transform-box: fill-box; transform-origin: 50% 100%; animation: mochiBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .mochi-eyes { transform-box: fill-box; transform-origin: 50% 50%; animation: mochiBlink 3.8s step-end infinite; }
          .mochi-tail { transform-origin: 52px 225px; animation: mochiTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
          .mochi-ear-l { transform-origin: 70px 78px; animation: mochiEarL 5.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }

          @keyframes misoBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.025, 1.03) translateY(-1.5px); } }
          @keyframes misoTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(7deg); } 75% { transform: rotate(-5deg); } }
          @keyframes misoEarR { 0%, 93%, 98%, 100% { transform: rotate(0deg); } 95% { transform: rotate(6deg); } }
          .miso-body { transform-box: fill-box; transform-origin: 50% 100%; animation: misoBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .miso-tail { transform-origin: 172px 235px; animation: misoTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
          .miso-ear-r { transform-origin: 174px 76px; animation: misoEarR 6.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }

          @keyframes oreoBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.02, 1.025); } }
          @keyframes oreoBlink { 0%, 88%, 94%, 100% { transform: scaleY(1); } 91% { transform: scaleY(0.08); } }
          @keyframes oreoTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(6deg); } 75% { transform: rotate(-5deg); } }
          .oreo-body { transform-box: fill-box; transform-origin: 50% 100%; animation: oreoBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .oreo-eyes { transform-box: fill-box; transform-origin: 50% 50%; animation: oreoBlink 3.8s step-end infinite; }
          .oreo-tail { transform-origin: 176px 225px; animation: oreoTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }

          @keyframes pepperBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.02, 1.025); } }
          @keyframes pepperBlink { 0%, 88%, 94%, 100% { transform: scaleY(1); } 91% { transform: scaleY(0.08); } }
          @keyframes pepperTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(6deg); } 75% { transform: rotate(-5deg); } }
          .pepper-body { transform-box: fill-box; transform-origin: 50% 100%; animation: pepperBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .pepper-eyes { transform-box: fill-box; transform-origin: 50% 50%; animation: pepperBlink 3.8s step-end infinite; }
          .pepper-tail { transform-origin: 172px 232px; animation: pepperTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }

          @keyframes yukiBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.02, 1.025); } }
          @keyframes yukiBlink { 0%, 88%, 94%, 100% { transform: scaleY(1); } 91% { transform: scaleY(0.08); } }
          @keyframes yukiTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(8deg); } 75% { transform: rotate(-5deg); } }
          .yuki-body { transform-box: fill-box; transform-origin: 50% 100%; animation: yukiBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .yuki-eyes { transform-box: fill-box; transform-origin: 50% 50%; animation: yukiBlink 3.8s step-end infinite; }
          .yuki-tail { transform-origin: 176px 238px; animation: yukiTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }

          @keyframes nyxBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.02, 1.025); } }
          @keyframes nyxBlink { 0%, 88%, 94%, 100% { transform: scaleY(1); } 91% { transform: scaleY(0.08); } }
          @keyframes nyxTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(7deg); } 75% { transform: rotate(-5deg); } }
          .nyx-body { transform-box: fill-box; transform-origin: 50% 100%; animation: nyxBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .nyx-eyes { transform-box: fill-box; transform-origin: 50% 50%; animation: nyxBlink 3.8s step-end infinite; }
          .nyx-tail { transform-origin: 158px 230px; animation: nyxTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }

          @keyframes bobaBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.025, 1.03) translateY(-1.5px); } }
          @keyframes bobaBlink { 0%, 88%, 94%, 100% { transform: scaleY(1); } 91% { transform: scaleY(0.08); } }
          @keyframes bobaTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(4deg); } 75% { transform: rotate(-3deg); } }
          .boba-body { transform-box: fill-box; transform-origin: 50% 100%; animation: bobaBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .boba-eyes { transform-box: fill-box; transform-origin: 50% 50%; animation: bobaBlink 3.8s step-end infinite; }
          .boba-tail { transform-origin: 172px 248px; animation: bobaTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }

          @keyframes winstonBreathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.025, 1.03) translateY(-1.5px); } }
          @keyframes winstonBlink { 0%, 88%, 94%, 100% { transform: scaleY(1); } 91% { transform: scaleY(0.08); } }
          @keyframes winstonTail { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(-8deg); } 75% { transform: rotate(5deg); } }
          @keyframes winstonEarL { 0%, 90%, 96%, 100% { transform: rotate(0deg); } 93% { transform: rotate(-7deg); } }
          .winston-body { transform-box: fill-box; transform-origin: 50% 100%; animation: winstonBreathe ${isSleeping ? '5.2s' : '3.6s'} cubic-bezier(0.42, 0, 0.58, 1) infinite; }
          .winston-eyes { transform-box: fill-box; transform-origin: 50% 50%; animation: winstonBlink 3.8s step-end infinite; }
          .winston-tail { transform-origin: 75px 235px; animation: winstonTail ${isSleeping ? '6.0s' : '4.2s'} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
          .winston-ear-l { transform-origin: 78px 86px; animation: winstonEarL 5.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }

          @media (prefers-reduced-motion: reduce) {
            .mochi-body, .mochi-eyes, .mochi-tail, .mochi-ear-l,
            .miso-body, .miso-tail, .miso-ear-r,
            .oreo-body, .oreo-eyes, .oreo-tail,
            .pepper-body, .pepper-eyes, .pepper-tail,
            .yuki-body, .yuki-eyes, .yuki-tail,
            .nyx-body, .nyx-eyes, .nyx-tail,
            .boba-body, .boba-eyes, .boba-tail,
            .winston-body, .winston-eyes, .winston-tail, .winston-ear-l {
              animation: none !important;
            }
          }
        `}</style>
      </defs>

      {/* =========================================================================
          CAT 1: MOCHI (Snow White with Black Ear & Tail Hook)
          ========================================================================= */}
      {catId === 'mochi' && (
        <g id="cat-mochi">
          {showGround && <ellipse cx="120" cy="254" rx="65" ry="8" fill="rgba(38,32,29,0.18)" />}

          {/* Tail: Rooted seamlessly into left flank at X:52, Y:225 */}
          <g className="mochi-tail" data-part="tail" data-tail="hookLeft">
            <path
              d="M52,225 C36,220 22,204 22,185 C22,168 34,166 38,174 C42,182 34,196 46,204 C50,207 54,208 58,210"
              fill="none"
              stroke="#26201D"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Body Group */}
          <g className="mochi-body" data-part="body" transform={armTransform}>
            {/* White Pear Body */}
            <path
              d="M78,130 C64,155 50,185 52,220 C54,245 70,252 120,252 C170,252 186,245 188,220 C190,185 176,155 162,130 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Fur Hatch Dashes on chest */}
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
              <line x1="82" y1="165" x2="80" y2="175" />
              <line x1="90" y1="160" x2="88" y2="170" />
              <line x1="86" y1="178" x2="84" y2="188" />
              <line x1="150" y1="160" x2="152" y2="170" />
              <line x1="158" y1="165" x2="160" y2="175" />
              <line x1="154" y1="178" x2="156" y2="188" />
            </g>

            {/* Front Legs "JJ" style */}
            <path d="M106,185 L106,238 C106,244 98,244 98,238" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
            <path d="M134,185 L134,238 C134,244 126,244 126,238" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
            <circle cx="106" cy="242" r="1.5" fill="#26201D" />
            <circle cx="134" cy="242" r="1.5" fill="#26201D" />
          </g>

          {/* Head Group */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            {/* Left Black Ear with white comb lines */}
            <g className="mochi-ear-l" data-part="ears" data-ears="blackLeftComb">
              <path d="M60,90 L66,46 L86,82 Z" fill="#26201D" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
              <path d="M68,58 L68,76" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" />
              <path d="M74,64 L74,77" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Right Black Ear */}
            <g>
              <path d="M180,90 L174,46 L154,82 Z" fill="#26201D" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
            </g>

            {/* Round White Face */}
            <path
              d="M68,102 C60,62 180,62 172,102 C174,134 154,146 120,146 C86,146 66,134 68,102 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Forehead hatch dashes */}
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
              <line x1="105" y1="80" x2="105" y2="88" />
              <line x1="113" y1="78" x2="113" y2="86" />
              <line x1="121" y1="77" x2="121" y2="85" />
              <line x1="129" y1="78" x2="129" y2="86" />
            </g>

            {/* Eyes */}
            <g className="mochi-eyes" data-part="eyes" data-eyes="minimalDot">
              {isSleeping ? (
                <>
                  <path d="M92 112 C96 108 104 108 108 112" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M132 112 C136 108 144 108 148 112" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isHappy ? (
                <>
                  <path d="M92 114 C96 108 104 108 108 114" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                  <path d="M132 114 C136 108 144 108 148 114" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : isSad ? (
                <>
                  <path d="M92 110 C96 114 104 114 108 110" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M132 110 C136 114 144 114 148 110" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="98" cy="112" r="5.2" fill="#26201D" />
                  <circle cx="142" cy="112" r="5.2" fill="#26201D" />
                </>
              )}
            </g>

            {/* Nose, Mouth, and Whiskers */}
            <path d="M116,122 L124,122 L120,128 Z" fill="#26201D" />
            <path d="M120,128 v3 M114,133 c2,4 6,3 6,0 c0,3 4,4 6,0" fill="none" stroke="#26201D" strokeWidth="2" strokeLinecap="round" />
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round">
              <line x1="82" y1="120" x2="52" y2="117" />
              <line x1="80" y1="127" x2="48" y2="128" />
              <line x1="82" y1="134" x2="54" y2="138" />
              <line x1="158" y1="120" x2="188" y2="117" />
              <line x1="160" y1="127" x2="192" y2="128" />
              <line x1="158" y1="134" x2="186" y2="138" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          CAT 2: MISO (Golden Yellow Tabby with Joyful Smile — orange)
          ========================================================================= */}
      {catId === 'orange' && (
        <g id="cat-miso">
          {showGround && <ellipse cx="120" cy="254" rx="65" ry="8" fill="rgba(38,32,29,0.18)" />}

          {/* Spiral Tail: Rooted seamlessly into right flank at X: 172, Y: 235 */}
          <g className="miso-tail" data-part="tail" data-tail="spiralCurl">
            <path
              d="M172,235 C198,234 212,216 212,188 C212,158 198,142 184,146 C174,149 170,160 174,168 C178,176 190,172 189,164 C188,158 182,159 182,162"
              fill="none"
              stroke="#26201D"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M172,235 C198,234 212,216 212,188 C212,158 198,142 184,146 C174,149 170,160 174,168 C178,176 190,172 189,164 C188,158 182,159 182,162"
              fill="none"
              stroke="#EEB038"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g stroke="#26201D" strokeWidth="2" strokeLinecap="round">
              <line x1="202" y1="220" x2="212" y2="218" />
              <line x1="203" y1="200" x2="213" y2="196" />
              <line x1="199" y1="178" x2="210" y2="172" />
              <line x1="186" y1="160" x2="195" y2="154" />
            </g>
          </g>

          {/* Golden Body */}
          <g className="miso-body" data-part="body" transform={armTransform}>
            <path
              d="M84,136 C70,160 56,190 58,225 C60,250 74,254 120,254 C166,254 180,250 182,225 C184,190 170,160 156,136 Z"
              fill="#EEB038"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <path d="M50,175 C48,185 48,195 52,205" fill="none" stroke="#26201D" strokeWidth="2" strokeLinecap="round" />
            <path d="M46,185 C44,192 44,198 47,204" fill="none" stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M190,175 C192,185 192,195 188,205" fill="none" stroke="#26201D" strokeWidth="2" strokeLinecap="round" />

            {/* Center Leg lines & Paws */}
            <path d="M102,195 L102,246 C102,254 94,254 94,246" fill="none" stroke="#26201D" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M112,195 L112,252" stroke="#26201D" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M128,195 L128,252" stroke="#26201D" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M138,195 L138,246 C138,254 146,254 146,246" fill="none" stroke="#26201D" strokeWidth="2.6" strokeLinecap="round" />

            {/* Hind paw side curves */}
            <path d="M72,245 C78,255 86,255 90,250" fill="none" stroke="#26201D" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M168,250 C172,255 180,255 186,245" fill="none" stroke="#26201D" strokeWidth="2.4" strokeLinecap="round" />
          </g>

          {/* Head Group */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            <path d="M66,96 L74,48 L94,88 Z" fill="#EEB038" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" data-part="ears" data-ears="pointy" />
            <g className="miso-ear-r">
              <path d="M174,96 L166,48 L146,88 Z" fill="#EEB038" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" />
            </g>

            {/* Head Circle */}
            <path
              d="M68,106 C60,65 180,65 172,106 C176,142 154,152 120,152 C86,152 64,142 68,106 Z"
              fill="#EEB038"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Forehead hatch dashes */}
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
              <line x1="112" y1="82" x2="110" y2="90" />
              <line x1="120" y1="80" x2="120" y2="88" />
              <line x1="128" y1="82" x2="130" y2="90" />
            </g>

            {/* Happy Closed Eyes */}
            <g data-part="eyes" data-eyes="joyfulArch">
              {isSad ? (
                <>
                  <path d="M90,112 C96,118 106,118 112,112" fill="none" stroke="#26201D" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M128,112 C134,118 144,118 150,112" fill="none" stroke="#26201D" strokeWidth="3.2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M90,108 C96,116 106,116 112,108" fill="none" stroke="#26201D" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M128,108 C134,116 144,116 150,108" fill="none" stroke="#26201D" strokeWidth="3.2" strokeLinecap="round" />
                </>
              )}
            </g>

            {/* Cute Nose & Mouth */}
            <path d="M116,122 L124,122 L120,128 Z" fill="#26201D" />
            <path d="M120,128 v4 M114,134 c2,4 6,3 6,0 c0,3 4,4 6,0" fill="none" stroke="#26201D" strokeWidth="2.2" strokeLinecap="round" />

            {/* Whiskers */}
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round">
              <line x1="78" y1="116" x2="44" y2="112" />
              <line x1="76" y1="125" x2="38" y2="126" />
              <line x1="78" y1="134" x2="44" y2="140" />
              <line x1="162" y1="116" x2="196" y2="112" />
              <line x1="164" y1="125" x2="202" y2="126" />
              <line x1="162" y1="134" x2="196" y2="140" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          CAT 3: OREO (Masked Tuxedo with Big Eyes on Ledge — oreo)
          ========================================================================= */}
      {catId === 'oreo' && (
        <g id="cat-oreo">
          {/* Upright Tail: Rooted into right flank at X:176, Y:225 */}
          <g className="oreo-tail" data-part="tail" data-tail="uprightLedge">
            <path
              d="M176,225 C192,215 198,185 194,155 C192,142 186,144 182,150 C178,160 182,185 170,218"
              fill="#26201D"
              stroke="#26201D"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Body Group */}
          <g className="oreo-body" data-part="body" transform={armTransform}>
            <path
              d="M72,125 C62,150 56,180 56,220 C56,242 66,245 120,245 C174,245 184,242 184,220 C184,180 178,150 168,125 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Dense vertical hatch marks */}
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
              <line x1="74" y1="150" x2="74" y2="160" />
              <line x1="102" y1="155" x2="102" y2="165" />
              <line x1="138" y1="155" x2="138" y2="165" />
              <line x1="166" y1="150" x2="166" y2="160" />
              <line x1="84" y1="175" x2="84" y2="185" />
              <line x1="156" y1="175" x2="156" y2="185" />
              <line x1="72" y1="200" x2="72" y2="210" />
              <line x1="94" y1="205" x2="94" y2="215" />
              <line x1="146" y1="205" x2="146" y2="215" />
              <line x1="168" y1="200" x2="168" y2="210" />
            </g>

            {/* Front Legs & Paws hanging over ledge */}
            <path d="M96,190 L96,242" fill="none" stroke="#26201D" strokeWidth="2.6" />
            <path d="M88,242 L88,236 C88,232 94,232 94,236 L94,242" fill="none" stroke="#26201D" strokeWidth="2.2" />
            <path d="M94,242 L94,235 C94,231 100,231 100,235 L100,242" fill="none" stroke="#26201D" strokeWidth="2.2" />
            <path d="M100,242 L100,236 C100,232 106,232 106,236 L106,242" fill="none" stroke="#26201D" strokeWidth="2.2" />

            <path d="M144,190 L144,242" fill="none" stroke="#26201D" strokeWidth="2.6" />
            <path d="M136,242 L136,236 C136,232 142,232 142,236 L142,242" fill="none" stroke="#26201D" strokeWidth="2.2" />
            <path d="M142,242 L142,235 C142,231 148,231 148,235 L148,242" fill="none" stroke="#26201D" strokeWidth="2.2" />
            <path d="M148,242 L148,236 C148,232 154,232 154,236 L154,242" fill="none" stroke="#26201D" strokeWidth="2.2" />

            {/* Ledge line and support brackets */}
            <line x1="40" y1="245" x2="200" y2="245" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
            <path d="M85,245 v12 h8 v-12 M148,245 v12 h8 v-12" fill="none" stroke="#26201D" strokeWidth="2" />
          </g>

          {/* Head Group with Mask */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            <path
              d="M62,100 C56,60 184,60 178,100 C180,132 160,146 120,146 C80,146 60,132 62,100 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Black Mask / Cap covering top half */}
            <path
              d="M62,98 C56,60 184,60 178,98 C160,94 140,92 120,92 C100,92 80,94 62,98 Z"
              fill="#26201D"
              stroke="#26201D"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />

            {/* Ears */}
            <g data-part="ears" data-ears="maskedPointy">
              <path d="M66,88 L74,44 L90,80 Z" fill="#26201D" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" />
              <path d="M74,56 L74,74" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" />
              <path d="M174,88 L166,44 L150,80 Z" fill="#26201D" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" />
              <path d="M166,56 L166,74" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Big Curious Round Eyes */}
            <g className="oreo-eyes" data-part="eyes" data-eyes="bigRoundStare">
              {isSleeping ? (
                <>
                  <path d="M86 94 C90 90 98 90 102 94" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M138 94 C142 90 150 90 154 94" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isHappy ? (
                <>
                  <path d="M86 96 C90 90 98 90 102 96" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                  <path d="M138 96 C142 90 150 90 154 96" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="92" cy="94" r="8.5" fill="#FFFDF9" stroke="#26201D" strokeWidth="2.4" />
                  <circle cx="92" cy="94" r="4.5" fill="#26201D" />
                  <circle cx="94" cy="92" r="1.5" fill="#FFFDF9" />

                  <circle cx="148" cy="94" r="8.5" fill="#FFFDF9" stroke="#26201D" strokeWidth="2.4" />
                  <circle cx="148" cy="94" r="4.5" fill="#26201D" />
                  <circle cx="150" cy="92" r="1.5" fill="#FFFDF9" />
                </>
              )}
            </g>

            {/* Snout, Freckle Dots & Smile */}
            <circle cx="120" cy="115" r="3.2" fill="#26201D" />
            <path d="M112,122 c2,4 8,3 8,0 c0,3 6,4 8,0" fill="none" stroke="#26201D" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="98" cy="118" r="1.2" fill="#26201D" />
            <circle cx="103" cy="116" r="1.2" fill="#26201D" />
            <circle cx="103" cy="122" r="1.2" fill="#26201D" />
            <circle cx="142" cy="118" r="1.2" fill="#26201D" />
            <circle cx="137" cy="116" r="1.2" fill="#26201D" />
            <circle cx="137" cy="122" r="1.2" fill="#26201D" />

            {/* Whiskers */}
            <g stroke="#26201D" strokeWidth="2" strokeLinecap="round">
              <line x1="78" y1="108" x2="42" y2="104" />
              <line x1="74" y1="116" x2="36" y2="116" />
              <line x1="76" y1="124" x2="40" y2="128" />
              <line x1="162" y1="108" x2="198" y2="104" />
              <line x1="166" y1="116" x2="204" y2="116" />
              <line x1="164" y1="124" x2="200" y2="128" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          CAT 4: PEPPER (Dalmatian Polka-Dot Cat with Ring Tail — pepper)
          ========================================================================= */}
      {catId === 'pepper' && (
        <g id="cat-pepper">
          {showGround && <ellipse cx="120" cy="254" rx="60" ry="8" fill="rgba(38,32,29,0.18)" />}

          {/* Ring-hook Tail: Rooted into right flank at X:172, Y:232 */}
          <g className="pepper-tail" data-part="tail" data-tail="ringLoop">
            <path
              d="M172,232 C192,232 208,222 208,202 C208,184 190,178 180,188 C174,194 178,206 190,204 C198,202 202,192 196,186"
              fill="none"
              stroke="#26201D"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Body Group */}
          <g className="pepper-body" data-part="body" transform={armTransform}>
            <path
              d="M78,135 C64,158 56,190 58,225 C60,250 74,254 120,254 C166,254 180,250 182,225 C184,190 176,158 162,135 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Charming Polka Dots Pattern */}
            <g fill="#26201D">
              <circle cx="84" cy="165" r="3" />
              <circle cx="102" cy="158" r="3.5" />
              <circle cx="122" cy="168" r="4" />
              <circle cx="140" cy="158" r="3.5" />
              <circle cx="156" cy="168" r="3" />
              <circle cx="74" cy="188" r="3.5" />
              <circle cx="94" cy="180" r="4" />
              <circle cx="112" cy="192" r="3" />
              <circle cx="132" cy="182" r="4" />
              <circle cx="150" cy="190" r="3.5" />
              <circle cx="168" cy="185" r="3" />
              <circle cx="80" cy="210" r="4" />
              <circle cx="100" cy="218" r="3" />
              <circle cx="140" cy="218" r="3" />
              <circle cx="162" cy="210" r="4" />
              <circle cx="74" cy="232" r="3.5" />
              <circle cx="90" cy="240" r="3" />
              <circle cx="152" cy="240" r="3" />
              <circle cx="168" cy="232" r="3.5" />
            </g>

            {/* Center Legs & Toes */}
            <path d="M106,195 L106,248" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M134,195 L134,248" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
            <ellipse cx="104" cy="250" rx="6" ry="4" fill="#26201D" />
            <ellipse cx="136" cy="250" rx="6" ry="4" fill="#26201D" />
          </g>

          {/* Head Group */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            <g data-part="ears" data-ears="blackEarPair">
              <path d="M66,94 L74,48 L90,82 Z" fill="#26201D" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" />
              <path d="M174,94 L166,48 L150,82 Z" fill="#26201D" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" />
            </g>

            {/* Head Base */}
            <path
              d="M68,106 C60,65 180,65 172,106 C176,142 154,152 120,152 C86,152 64,142 68,106 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Black side patches with white middle forehead comb */}
            <path d="M68,106 C62,80 88,72 104,74 L104,95 C92,98 78,102 68,106 Z" fill="#26201D" />
            <path d="M172,106 C178,80 152,72 136,74 L136,95 C148,98 162,102 172,106 Z" fill="#26201D" />
            <g stroke="#26201D" strokeWidth="2" strokeLinecap="round">
              <line x1="110" y1="74" x2="110" y2="82" />
              <line x1="115" y1="73" x2="115" y2="82" />
              <line x1="120" y1="72" x2="120" y2="82" />
              <line x1="125" y1="73" x2="125" y2="82" />
              <line x1="130" y1="74" x2="130" y2="82" />
            </g>

            {/* Rosy Pink Blush Cheeks */}
            <circle cx="86" cy="122" r="7.5" fill="#F4978E" opacity="0.9" />
            <circle cx="154" cy="122" r="7.5" fill="#F4978E" opacity="0.9" />

            {/* Eyes */}
            <g className="pepper-eyes" data-part="eyes" data-eyes="blushGlint">
              {isSleeping ? (
                <>
                  <path d="M96 112 C100 108 108 108 112 112" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M128 112 C132 108 140 108 144 112" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isHappy ? (
                <>
                  <path d="M96 114 C100 108 108 108 112 114" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                  <path d="M128 114 C132 108 140 108 144 114" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="102" cy="112" r="5.5" fill="#26201D" />
                  <circle cx="103.5" cy="110.5" r="1.8" fill="#FFFDF9" />
                  <circle cx="138" cy="112" r="5.5" fill="#26201D" />
                  <circle cx="139.5" cy="110.5" r="1.8" fill="#FFFDF9" />
                </>
              )}
            </g>

            {/* Nose, Mouth, Whiskers */}
            <path d="M116,122 L124,122 L120,127 Z" fill="#26201D" />
            <path d="M120,127 v3 M114,133 c2,3 6,3 6,0 c0,3 4,3 6,0" fill="none" stroke="#26201D" strokeWidth="2" strokeLinecap="round" />
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round">
              <line x1="78" y1="118" x2="48" y2="115" />
              <line x1="76" y1="125" x2="44" y2="125" />
              <line x1="78" y1="132" x2="48" y2="135" />
              <line x1="162" y1="118" x2="192" y2="115" />
              <line x1="164" y1="125" x2="196" y2="125" />
              <line x1="162" y1="132" x2="192" y2="135" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          CAT 5: YUKI (Expressive White Sketch Cat with Alert Lines — yuki)
          ========================================================================= */}
      {catId === 'yuki' && (
        <g id="cat-yuki">
          {showGround && <ellipse cx="120" cy="254" rx="65" ry="8" fill="rgba(38,32,29,0.18)" />}

          {/* Hook Tail: Rooted into right flank at X:176, Y:238 */}
          <g className="yuki-tail" data-part="tail" data-tail="hookRight">
            <path
              d="M176,238 C198,236 210,218 206,192 C202,176 192,174 188,182 C184,190 194,210 180,228"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* White Body Group */}
          <g className="yuki-body" data-part="body" transform={armTransform}>
            <path
              d="M82,130 C66,155 52,185 54,220 C56,245 70,252 120,252 C170,252 184,245 186,220 C188,185 174,155 158,130 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Minimal sketch fur hatches */}
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
              <line x1="68" y1="180" x2="66" y2="192" />
              <line x1="78" y1="175" x2="76" y2="185" />
              <line x1="138" y1="170" x2="138" y2="178" />
              <line x1="148" y1="188" x2="148" y2="198" />
              <line x1="62" y1="218" x2="62" y2="228" />
            </g>

            {/* Front Leg line & Paw Arches */}
            <path d="M112,190 L112,246" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
            <g transform="translate(98, 238)">
              <path d="M4,10 C4,2 10,2 10,10 C10,2 16,2 16,10 C16,2 22,2 22,10" fill="none" stroke="#26201D" strokeWidth="2.4" strokeLinejoin="round" />
            </g>
          </g>

          {/* Head Group with Alert Lines */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            <g stroke="#26201D" strokeWidth="2.2" strokeLinecap="round">
              <line x1="48" y1="80" x2="62" y2="90" />
              <line x1="42" y1="92" x2="58" y2="100" />
              <line x1="42" y1="106" x2="56" y2="110" />
            </g>

            {/* White Ears */}
            <g data-part="ears" data-ears="whiteSketch">
              <path d="M66,94 L74,48 L92,84 Z" fill="#FFFDF9" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" />
              <path d="M174,94 L166,48 L148,84 Z" fill="#FFFDF9" stroke="#26201D" strokeWidth="3.2" strokeLinejoin="round" />
            </g>

            {/* Head Shape */}
            <path
              d="M68,106 C60,65 180,65 172,106 C176,142 154,150 120,150 C86,150 64,142 68,106 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Eyes */}
            <g className="yuki-eyes" data-part="eyes" data-eyes="alertDot">
              {isSleeping ? (
                <>
                  <path d="M92 114 C96 110 104 110 108 114" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M132 114 C136 110 144 110 148 114" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isHappy ? (
                <>
                  <path d="M92 116 C96 110 104 110 108 116" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                  <path d="M132 116 C136 110 144 110 148 116" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="98" cy="114" r="4.8" fill="#26201D" />
                  <circle cx="142" cy="114" r="4.8" fill="#26201D" />
                </>
              )}
            </g>

            {/* Nose, Mouth, Whiskers */}
            <path d="M116,122 L124,122 L120,127 Z" fill="#26201D" />
            <path d="M120,127 v3 M114,133 c2,3 6,3 6,0 c0,3 4,3 6,0" fill="none" stroke="#26201D" strokeWidth="2" strokeLinecap="round" />
            <g stroke="#26201D" strokeWidth="2" strokeLinecap="round">
              <line x1="80" y1="124" x2="50" y2="124" />
              <line x1="160" y1="116" x2="194" y2="112" />
              <line x1="162" y1="125" x2="200" y2="125" />
              <line x1="160" y1="134" x2="194" y2="138" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          CAT 6: NYX (Midnight Velvet Black with Pink Inner Ears — black)
          ========================================================================= */}
      {catId === 'black' && (
        <g id="cat-nyx">
          {showGround && <ellipse cx="120" cy="254" rx="55" ry="8" fill="rgba(38,32,29,0.22)" />}

          {/* Upright Sleek Black Tail: Rooted into right flank at X:158, Y:230 */}
          <g className="nyx-tail" data-part="tail" data-tail="sleekUpright">
            <path
              d="M158,230 C172,222 176,198 174,175 C173,164 168,162 164,168 C161,175 163,192 154,220"
              fill="#1E1B18"
              stroke="#1E1B18"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Slender Seated Black Body */}
          <g className="nyx-body" data-part="body" transform={armTransform}>
            <path
              d="M92,142 C78,165 66,195 68,225 C70,250 82,254 120,254 C158,254 170,250 172,225 C174,195 162,142 148,142 Z"
              fill="#1E1B18"
              stroke="#1E1B18"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* White contour lines on black paws & chest */}
            <path d="M106,200 L106,248 C106,252 100,252 100,248" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
            <path d="M134,200 L134,248 C134,252 140,252 140,248" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
            <line x1="114" y1="244" x2="114" y2="252" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
            <line x1="126" y1="244" x2="126" y2="252" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          </g>

          {/* Head Group with Pointed Ears and Pink Interior */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            <g data-part="ears" data-ears="pinkInner">
              <path d="M68,100 L76,52 L94,90 Z" fill="#1E1B18" stroke="#1E1B18" strokeWidth="3" strokeLinejoin="round" />
              <path d="M74,92 L78,62 L86,86 Z" fill="#E05368" />
              <path d="M172,100 L164,52 L146,90 Z" fill="#1E1B18" stroke="#1E1B18" strokeWidth="3" strokeLinejoin="round" />
              <path d="M166,92 L162,62 L154,86 Z" fill="#E05368" />
            </g>

            {/* Black Head Shape */}
            <path
              d="M72,110 C62,70 178,70 168,110 C172,142 152,150 120,150 C88,150 68,142 72,110 Z"
              fill="#1E1B18"
              stroke="#1E1B18"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Big Luminous Glowing White Eyes looking upward */}
            <g className="nyx-eyes" data-part="eyes" data-eyes="luminousOval">
              {isSleeping ? (
                <>
                  <path d="M92 116 C96 112 104 112 108 116" fill="none" stroke="#FFFDF9" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M132 116 C136 112 144 112 148 116" fill="none" stroke="#FFFDF9" strokeWidth="2.6" strokeLinecap="round" />
                </>
              ) : isHappy ? (
                <>
                  <path d="M92 118 C96 112 104 112 108 118" fill="none" stroke="#FFFDF9" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M132 118 C136 112 144 112 148 118" fill="none" stroke="#FFFDF9" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <ellipse cx="98" cy="116" rx="9" ry="8" fill="#FFFDF9" />
                  <circle cx="100" cy="114" r="5" fill="#1E1B18" />
                  <circle cx="102" cy="112" r="1.8" fill="#FFFDF9" />

                  <ellipse cx="142" cy="116" rx="9" ry="8" fill="#FFFDF9" />
                  <circle cx="144" cy="114" r="5" fill="#1E1B18" />
                  <circle cx="146" cy="112" r="1.8" fill="#FFFDF9" />
                </>
              )}
            </g>

            {/* Pink Nose and Smile */}
            <path d="M116,126 L124,126 L120,131 Z" fill="#E05368" />
            <path d="M120,131 v2 M115,135 c2,3 5,3 5,0 c0,3 3,3 5,0" stroke="#E05368" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Fine White Whiskers */}
            <g stroke="#FFFDF9" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
              <line x1="84" y1="124" x2="52" y2="120" />
              <line x1="82" y1="131" x2="48" y2="132" />
              <line x1="84" y1="138" x2="54" y2="144" />
              <line x1="156" y1="124" x2="188" y2="120" />
              <line x1="158" y1="131" x2="192" y2="132" />
              <line x1="156" y1="138" x2="186" y2="144" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          CAT 7: BOBA (Calico Patch with Playful Side-Glance Eyes — boba)
          ========================================================================= */}
      {catId === 'boba' && (
        <g id="cat-boba">
          {showGround && <ellipse cx="120" cy="254" rx="65" ry="8" fill="rgba(38,32,29,0.18)" />}

          {/* Tail extending along ground: Rooted into right flank at X:172, Y:248 */}
          <g className="boba-tail" data-part="tail" data-tail="groundTail">
            <path
              d="M172,248 C195,248 215,242 220,248 C222,252 216,256 195,254 L172,254"
              fill="#26201D"
              stroke="#26201D"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Calico Body Group */}
          <g className="boba-body" data-part="body" transform={armTransform}>
            <path
              d="M86,136 C72,160 58,190 60,225 C62,250 76,254 120,254 C164,254 178,250 180,225 C182,190 168,160 154,136 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Terracotta Peach Calico Patches on Shoulder and Lower Flank */}
            <path d="M78,168 C68,172 62,185 64,198 C66,208 76,212 86,208 C96,204 96,188 92,176 Z" fill="#E07A5F" stroke="#E07A5F" strokeWidth="1.5" />
            <path d="M60,222 C56,238 68,252 85,252 C98,252 100,242 98,232 C96,220 82,216 68,218 Z" fill="#E07A5F" stroke="#E07A5F" strokeWidth="1.5" />
            <path d="M172,215 C176,228 174,242 165,248 C158,245 158,232 162,222 Z" fill="#E07A5F" stroke="#E07A5F" strokeWidth="1.5" />

            {/* Front Leg lines */}
            <path d="M106,192 L106,252" fill="none" stroke="#26201D" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M134,192 L134,252" fill="none" stroke="#26201D" strokeWidth="2.6" strokeLinecap="round" />

            {/* Texture speckles on patches */}
            <g fill="#26201D">
              <circle cx="74" cy="186" r="1.4" />
              <circle cx="82" cy="195" r="1.4" />
              <circle cx="72" cy="235" r="1.4" />
              <circle cx="82" cy="242" r="1.4" />
            </g>
          </g>

          {/* Calico Head Group */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            <g data-part="ears" data-ears="splitCalico">
              <path d="M66,96 L74,48 L92,84 Z" fill="#E07A5F" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
              <path d="M174,96 L166,48 L148,84 Z" fill="#26201D" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
            </g>

            {/* Head Base Shape */}
            <path
              d="M68,106 C60,65 180,65 172,106 C176,142 154,152 120,152 C86,152 64,142 68,106 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Terracotta Left Face Mask Patch */}
            <path d="M68,106 C62,80 88,74 116,74 L116,118 C96,122 78,118 68,106 Z" fill="#E07A5F" stroke="#E07A5F" strokeWidth="1.5" />

            {/* Big Curious Round Eyes looking up-right (Side-Glance) */}
            <g className="boba-eyes" data-part="eyes" data-eyes="sideGlance">
              {isSleeping ? (
                <>
                  <path d="M88 108 C92 104 100 104 104 108" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M136 108 C140 104 148 104 152 108" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isHappy ? (
                <>
                  <path d="M88 110 C92 104 100 104 104 110" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                  <path d="M136 110 C140 104 148 104 152 110" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="94" cy="108" r="8.5" fill="#FFFDF9" stroke="#26201D" strokeWidth="2.6" />
                  <circle cx="98" cy="105" r="4.5" fill="#26201D" />
                  <circle cx="99" cy="103" r="1.5" fill="#FFFDF9" />

                  <circle cx="146" cy="108" r="8.5" fill="#FFFDF9" stroke="#26201D" strokeWidth="2.6" />
                  <circle cx="150" cy="105" r="4.5" fill="#26201D" />
                  <circle cx="151" cy="103" r="1.5" fill="#FFFDF9" />
                </>
              )}
            </g>

            {/* Nose, Mouth, Whiskers */}
            <path d="M116,122 L124,122 L120,127 Z" fill="#26201D" />
            <path d="M120,127 v3 M114,133 c2,3 6,3 6,0 c0,3 4,3 6,0" fill="none" stroke="#26201D" strokeWidth="2.2" strokeLinecap="round" />
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round">
              <line x1="78" y1="116" x2="42" y2="114" />
              <line x1="76" y1="125" x2="38" y2="126" />
              <line x1="162" y1="116" x2="198" y2="114" />
              <line x1="164" y1="125" x2="202" y2="126" />
            </g>
          </g>
        </g>
      )}

      {/* =========================================================================
          CAT 8: WINSTON (Striped Cap & Flanks Tuxedo — tuxedo)
          ========================================================================= */}
      {catId === 'tuxedo' && (
        <g id="cat-winston">
          {showGround && <ellipse cx="120" cy="254" rx="65" ry="8" fill="rgba(38,32,29,0.18)" />}

          {/* Striped Curl Tail: Rooted seamlessly into left flank at X: 75, Y: 235 */}
          <g className="winston-tail" data-part="tail" data-tail="rootedStripedCurl">
            <path
              d="M75,235 C52,230 34,212 32,185 C30,155 48,125 74,125 C88,125 98,136 96,150 C94,162 80,170 68,162 C58,154 58,142 62,137 C64,135 68,135 68,140"
              fill="none"
              stroke="#26201D"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Tail horizontal white stripes */}
            <g stroke="#FFFDF9" strokeWidth="2.8" strokeLinecap="round">
              <line x1="45" y1="216" x2="60" y2="222" />
              <line x1="36" y1="198" x2="51" y2="202" />
              <line x1="34" y1="180" x2="49" y2="182" />
              <line x1="38" y1="162" x2="52" y2="158" />
              <line x1="46" y1="146" x2="58" y2="140" />
              <line x1="62" y1="134" x2="74" y2="128" />
              <line x1="82" y1="140" x2="90" y2="148" />
            </g>
          </g>

          {/* Body Group */}
          <g className="winston-body" data-part="body" transform={armTransform}>
            {/* Left flank with horizontal white stripes */}
            <path
              d="M82,148 C66,168 54,200 56,238 C57,252 66,254 85,254 C94,254 98,245 98,230 L98,165 Z"
              fill="#26201D"
              stroke="#26201D"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <g stroke="#FFFDF9" strokeWidth="2.6" strokeLinecap="round">
              <line x1="58" y1="200" x2="94" y2="202" />
              <line x1="57" y1="214" x2="94" y2="216" />
              <line x1="58" y1="228" x2="94" y2="230" />
              <line x1="60" y1="242" x2="92" y2="244" />
            </g>

            {/* Right flank with horizontal white stripes */}
            <path
              d="M158,148 C174,168 186,200 184,238 C183,252 174,254 155,254 C146,254 142,245 142,230 L142,165 Z"
              fill="#26201D"
              stroke="#26201D"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <g stroke="#FFFDF9" strokeWidth="2.6" strokeLinecap="round">
              <line x1="146" y1="202" x2="182" y2="200" />
              <line x1="146" y1="216" x2="183" y2="214" />
              <line x1="146" y1="230" x2="182" y2="228" />
              <line x1="148" y1="244" x2="180" y2="242" />
            </g>

            {/* Center White Chest & Belly */}
            <path
              d="M86,142 C86,142 80,175 82,210 C84,242 90,254 120,254 C150,254 156,242 158,210 C160,175 154,142 154,142 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Fur hatching in belly */}
            <g stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
              <line x1="104" y1="182" x2="104" y2="190" />
              <line x1="120" y1="180" x2="120" y2="188" />
              <line x1="136" y1="182" x2="136" y2="190" />
              <line x1="112" y1="202" x2="112" y2="210" />
              <line x1="128" y1="202" x2="128" y2="210" />
              <line x1="120" y1="222" x2="120" y2="230" />
            </g>

            {/* Front Legs & Paws */}
            <line x1="108" y1="200" x2="108" y2="248" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="132" y1="200" x2="132" y2="248" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
            <g transform="translate(96, 240)">
              <path d="M2,14 C2,6 8,6 8,14 C8,6 14,6 14,14 C14,6 20,6 20,14" fill="#FFFDF9" stroke="#26201D" strokeWidth="2.4" strokeLinejoin="round" />
            </g>
            <g transform="translate(124, 240)">
              <path d="M2,14 C2,6 8,6 8,14 C8,6 14,6 14,14 C14,6 20,6 20,14" fill="#FFFDF9" stroke="#26201D" strokeWidth="2.4" strokeLinejoin="round" />
            </g>
          </g>

          {/* Head Group */}
          <g id="head" data-part="head" className={tiltClass} transform={headTransform}>
            <g data-part="ears" data-ears="tallStriped">
              <g className="winston-ear-l">
                <path d="M70,96 L78,50 L94,88 Z" fill="#26201D" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
                <path d="M78,64 L78,82" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" />
              </g>
              <g>
                <path d="M170,96 L162,50 L146,88 Z" fill="#26201D" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
                <path d="M162,64 L162,82" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>

            {/* Head White Base */}
            <path
              d="M68,106 C60,65 180,65 172,106 C176,142 154,152 120,152 C86,152 64,142 68,106 Z"
              fill="#FFFDF9"
              stroke="#26201D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Black Striped Tuxedo Cap */}
            <path
              d="M68,104 C62,70 178,70 172,104 C152,98 136,96 120,96 C104,96 88,98 68,104 Z"
              fill="#26201D"
              stroke="#26201D"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <g stroke="#FFFDF9" strokeWidth="2.5" strokeLinecap="round">
              <line x1="88" y1="84" x2="152" y2="84" />
              <line x1="96" y1="92" x2="144" y2="92" />
            </g>

            {/* Rosy Pink Blush Cheeks */}
            <circle cx="86" cy="122" r="7.5" fill="#F4978E" opacity="0.9" />
            <circle cx="154" cy="122" r="7.5" fill="#F4978E" opacity="0.9" />

            {/* Eyes */}
            <g className="winston-eyes" data-part="eyes" data-eyes="dotWide">
              {isSleeping ? (
                <>
                  <path d="M96 112 C100 108 108 108 112 112" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M128 112 C132 108 140 108 144 112" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isHappy ? (
                <>
                  <path d="M96 114 C100 108 108 108 112 114" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                  <path d="M128 114 C132 108 140 108 144 114" fill="none" stroke="#26201D" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : isSad ? (
                <>
                  <path d="M96 110 C100 114 108 114 112 110" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M128 110 C132 114 140 114 144 110" fill="none" stroke="#26201D" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="102" cy="112" r="5.5" fill="#26201D" />
                  <circle cx="103.5" cy="110.5" r="1.8" fill="#FFFDF9" />
                  <circle cx="138" cy="112" r="5.5" fill="#26201D" />
                  <circle cx="139.5" cy="110.5" r="1.8" fill="#FFFDF9" />
                </>
              )}
            </g>

            {/* Nose, Mouth, and Chin Tick */}
            <path d="M116,122 L124,122 L120,127 Z" fill="#26201D" />
            <path d="M120,127 v3 M114,133 c2,3 6,3 6,0 c0,3 4,3 6,0" fill="none" stroke="#26201D" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="120" y1="139" x2="120" y2="143" stroke="#26201D" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />

            {/* Whiskers */}
            <g stroke="#26201D" strokeWidth="2" strokeLinecap="round">
              <line x1="78" y1="116" x2="48" y2="114" />
              <line x1="76" y1="124" x2="44" y2="124" />
              <line x1="78" y1="132" x2="48" y2="135" />
              <line x1="162" y1="116" x2="192" y2="114" />
              <line x1="164" y1="124" x2="196" y2="124" />
              <line x1="162" y1="132" x2="192" y2="135" />
            </g>
          </g>
        </g>
      )}
    </svg>
  );
}

export { resolveCatConfig, catName };
export { CAT_STATES } from './poses.js';
