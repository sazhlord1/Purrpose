import type { CatId } from '@purrpose/shared';
import { DEFAULT_EXPRESSION, POSE_BY_STATE, type CatState, type Expression } from './poses.js';
import { Ears, Eyes, Mouth, NoseAndWhiskers, HeadMarkings, BodyMarkings, INK, faceInk, mouthFor, tailFor } from './parts.js';
import { catName, resolveCatConfig } from './config.js';
import type { CatSeedConfig } from '@purrpose/shared';

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

function Head({
  config,
  expression,
}: {
  config: CatSeedConfig;
  expression: Expression;
}) {
  const hs = config.structure.headSize;
  const ink = config.palette.ink ?? INK;
  return (
    <g data-part="head">
      <Ears config={config} />
      {/* 3D Volumetric Head Base */}
      <ellipse
        cx={0}
        cy={0}
        rx={20 * hs}
        ry={18.5 * hs}
        fill={config.palette.body}
        stroke={ink}
        strokeWidth={3}
      />
      {/* Soft Forehead Highlight Dome for 3D Volume */}
      <ellipse
        cx={-2 * hs}
        cy={-4 * hs}
        rx={14 * hs}
        ry={11 * hs}
        fill="#FFFFFF"
        opacity={0.09}
        pointerEvents="none"
      />
      {/* Soft Cheek / Chin Shading */}
      <ellipse
        cx={0}
        cy={10 * hs}
        rx={11 * hs}
        ry={5 * hs}
        fill="rgba(43,35,31,0.06)"
        pointerEvents="none"
      />
      <HeadMarkings config={config} hs={hs} />
      <Eyes config={config} expression={expression} />
      <NoseAndWhiskers config={config} />
      <Mouth kind={mouthFor(expression)} ink={ink} />
    </g>
  );
}

export function Cat({
  catId,
  state = 'WAITING',
  expression,
  size = 180,
  showGround = false,
  className,
  title,
  headTilt = 0,
  armUp = false,
}: CatProps) {
  const config = resolveCatConfig(catId);
  const pose = POSE_BY_STATE[state];
  const expr = expression ?? DEFAULT_EXPRESSION[state];
  const bodyLength = config.structure.bodyLength;
  const tiltClass = headTilt === -1 ? 'lc-tilt-up' : headTilt === 1 ? 'lc-tilt-down' : '';
  const ink = config.palette.ink ?? INK;
  const sockColor = config.palette.socks ?? config.palette.body;

  return (
    <svg
      viewBox="0 0 220 170"
      width={size}
      height={(size * 170) / 220}
      role="img"
      aria-label={title ?? `${catName(catId)} the ${catId} cat, state ${state.toLowerCase()}`}
      data-cat={catId}
      data-state={state}
      data-expression={expr}
      className={className}
    >
      {/* Dynamic Ground Shading / Contact Shadow */}
      <ellipse
        className="pcat-contact-shadow"
        cx={110}
        cy={171}
        rx={46}
        ry={7.5}
        fill="rgba(43,35,31,0.22)"
      />

      {showGround && (
        <path
          d="M30 151.5 C80 149.5 140 149.5 190 151.5"
          stroke={ink}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeDasharray="2 7"
          opacity={0.35}
        />
      )}
      <g transform={`translate(110 0) scale(${bodyLength} 1) translate(-110 0)`}>
        {pose.tail && (
          <g transform={`translate(${pose.tail.x} ${pose.tail.y})`}>
            <g className="pcat-tail" data-part="tail" data-tail={config.structure.tailPath}>
              <path
                d={tailFor(config.structure.tailPath, pose.tail.hint).d}
                fill="none"
                stroke={config.palette.mask ?? config.palette.body}
                strokeWidth={tailFor(config.structure.tailPath, pose.tail.hint).width}
                strokeLinecap="round"
              />
            </g>
          </g>
        )}

        {pose.legLines?.map((d, i) => (
          <path key={`leg-${i}`} d={d} fill="none" stroke={ink} strokeWidth={5.5} strokeLinecap="round" />
        ))}

        {pose.raisedArmLines && pose.raisedArmLines.length > 0 && (
          <g className={`pcat-arms${armUp ? ' lc-armup' : ''}`} data-part="arms">
            {pose.raisedArmLines.map((d, i) => (
              <path key={`arm-${i}`} d={d} fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
            ))}
          </g>
        )}

        {/* 3D Volumetric Body */}
        <path
          data-part="body"
          className="pcat-body"
          d={pose.bodyD}
          fill={config.palette.body}
          stroke={ink}
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/* Soft Shoulder / Flank Volume Highlight */}
        <path
          d="M110 92 C88 98 76 122 76 148 C86 142 98 126 108 114 Z"
          fill="#FFFFFF"
          opacity={0.08}
          pointerEvents="none"
        />

        <BodyMarkings config={config} poseName={state} />

        {pose.detailLines?.map((d, i) => (
          <path key={`detail-${i}`} d={d} fill="none" stroke={ink} strokeWidth={2} opacity={0.4} />
        ))}

        {pose.integratedTail && (
          <path
            data-part="tail"
            data-tail={`${config.structure.tailPath}-wrap`}
            className="pcat-tail"
            d={pose.integratedTail}
            fill="none"
            stroke={config.palette.mask ?? config.palette.body}
            strokeWidth={8}
            strokeLinecap="round"
          />
        )}

        {pose.hindPawsFlat?.map(([x, y], i) => (
          <ellipse
            key={`hind-${i}`}
            cx={x}
            cy={y}
            rx={5.6}
            ry={3}
            fill={sockColor}
            stroke={ink}
            strokeWidth={2.4}
          />
        ))}

        {pose.pawPoints?.map(([x, y], i) => (
          <ellipse
            key={`paw-${i}`}
            cx={x}
            cy={y}
            rx={4.6}
            ry={3.2}
            fill={sockColor}
            stroke={ink}
            strokeWidth={2.4}
          />
        ))}

        <g transform={`translate(${pose.head.x} ${pose.head.y}) rotate(${pose.head.rot ?? 0})`}>
          <g className={`pcat-head ${tiltClass}`.trim()}>
            <Head config={config} expression={expr} />
          </g>
        </g>
      </g>
    </svg>
  );
}

export { resolveCatConfig, catName };
export { CAT_STATES } from './poses.js';
