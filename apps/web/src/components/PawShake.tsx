import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { ambient } from '../lib/ambient.js';

interface PawShakeProps {
  open: boolean;
  catId: CatId;
  catName?: string;
  onComplete: () => void;
}

const INK = '#26201D';

function CatHighFiveFigure({ catId }: { catId: CatId }) {
  return (
    <g id={`pact-cat-${catId}`}>
      {/* 1. MOCHI */}
      {catId === 'mochi' && (
        <g>
          <path d="M38,165 C24,160 14,145 14,130 C14,116 24,115 28,121 C32,127 26,138 36,145 C40,148 44,149 48,150"
                fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56,110 C46,130 38,155 40,180 C42,198 54,204 92,204 C130,204 142,198 144,180 C145,155 136,130 126,110 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <g stroke={INK} strokeWidth={1.6} strokeLinecap="round" opacity={0.75}>
            <line x1="64" y1="140" x2="62" y2="148" /><line x1="70" y1="136" x2="68" y2="144" />
          </g>
          <path d="M78,150 L78,192 C78,197 72,197 72,192" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <g>
            <path d="M46,80 L50,44 L66,72 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <line x1="52" y1="54" x2="52" y2="68" stroke="#FFFDF9" strokeWidth={1.6} strokeLinecap="round" />
            <line x1="57" y1="58" x2="57" y2="69" stroke="#FFFDF9" strokeWidth={1.6} strokeLinecap="round" />
            <path d="M138,80 L134,44 L118,72 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M52,88 C46,56 142,56 136,88 C138,112 122,122 94,122 C66,122 50,112 52,88 Z"
                  fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <circle cx="76" cy="95" r="4.2" fill={INK} />
            <circle cx="112" cy="95" r="4.2" fill={INK} />
            <path d="M91,103 L97,103 L94,107 Z" fill={INK} />
            <path d="M94,107 v2 M89,111 c2,3 5,2 5,0 c0,2 3,3 5,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="64" y1="101" x2="40" y2="99" /><line x1="62" y1="107" x2="36" y2="108" />
              <line x1="124" y1="101" x2="148" y2="99" /><line x1="126" y1="107" x2="152" y2="108" />
            </g>
          </g>
        </g>
      )}

      {/* 2. MISO (orange) */}
      {catId === 'orange' && (
        <g>
          <path d="M38,175 C20,174 12,160 12,140 C12,118 22,106 32,109 C40,111 42,119 39,125"
                fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M38,175 C20,174 12,160 12,140 C12,118 22,106 32,109 C40,111 42,119 39,125"
                fill="none" stroke="#EEB038" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="18" y1="162" x2="26" y2="160" stroke={INK} strokeWidth={1.8} />
          <path d="M60,115 C50,135 40,160 42,185 C44,202 56,205 92,205 C128,205 140,202 142,185 C143,160 132,135 122,115 Z"
                fill="#EEB038" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <path d="M36,150 C34,158 34,166 38,174" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M76,155 L76,196 C76,202 70,202 70,196" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill="#EEB038" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <line x1="120" y1="124" x2="128" y2="132" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <line x1="134" y1="112" x2="142" y2="120" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <g>
            <path d="M50,82 L56,44 L72,76 Z" fill="#EEB038" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M134,82 L128,44 L112,76 Z" fill="#EEB038" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M52,90 C46,58 142,58 136,90 C139,116 122,124 94,124 C66,124 49,116 52,90 Z"
                  fill="#EEB038" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <path d="M70,92 C75,98 83,98 88,92" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
            <path d="M100,92 C105,98 113,98 118,92" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
            <path d="M91,103 L97,103 L94,107 Z" fill={INK} />
            <path d="M94,107 v3 M89,112 c2,3 5,2 5,0 c0,2 3,3 5,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="62" y1="98" x2="36" y2="95" /><line x1="60" y1="105" x2="32" y2="106" />
              <line x1="126" y1="98" x2="152" y2="95" /><line x1="128" y1="105" x2="156" y2="106" />
            </g>
          </g>
        </g>
      )}

      {/* 3. OREO */}
      {catId === 'oreo' && (
        <g>
          <path d="M40,175 C26,165 20,145 24,125 C26,115 32,116 34,122 C37,130 34,148 44,170"
                fill={INK} stroke={INK} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M54,110 C44,130 40,155 40,180 C40,198 48,202 92,202 C136,202 144,198 144,180 C144,155 140,130 130,110 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <path d="M72,150 L72,195" stroke={INK} strokeWidth={2.4} />
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <ellipse cx="157" cy="89" rx="3.5" ry="4.5" fill={INK} transform="rotate(-30 157 89)" />
          <g>
            <path d="M46,82 C42,50 144,50 140,82 C142,108 126,120 94,120 C62,120 46,108 46,82 Z"
                  fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <path d="M46,80 C42,50 144,50 140,80 C126,76 110,75 94,75 C78,75 62,76 46,80 Z"
                  fill={INK} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
            <path d="M50,72 L56,36 L70,66 Z" fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M136,72 L130,36 L116,66 Z" fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <circle cx="71" cy="76" r="7" fill="#FFFDF9" stroke={INK} strokeWidth={2} />
            <circle cx="71" cy="76" r="3.6" fill={INK} />
            <circle cx="73" cy="74" r="1.2" fill="#FFFDF9" />
            <circle cx="117" cy="76" r="7" fill="#FFFDF9" stroke={INK} strokeWidth={2} />
            <circle cx="117" cy="76" r="3.6" fill={INK} />
            <circle cx="119" cy="74" r="1.2" fill="#FFFDF9" />
            <circle cx="94" cy="94" r="2.6" fill={INK} />
            <path d="M88,100 c2,3 6,2 6,0 c0,2 4,3 6,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <circle cx="78" cy="96" r="1" fill={INK} /><circle cx="82" cy="94" r="1" fill={INK} />
            <circle cx="110" cy="96" r="1" fill={INK} /><circle cx="106" cy="94" r="1" fill={INK} />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="60" y1="88" x2="34" y2="85" /><line x1="56" y1="95" x2="30" y2="95" />
              <line x1="128" y1="88" x2="154" y2="85" /><line x1="132" y1="95" x2="158" y2="95" />
            </g>
          </g>
        </g>
      )}

      {/* 4. PEPPER */}
      {catId === 'pepper' && (
        <g>
          <path d="M38,175 C20,175 10,166 10,150 C10,136 24,131 32,138 C36,144 34,154 24,152"
                fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M58,112 C48,132 40,158 42,182 C44,202 56,205 92,205 C128,205 140,202 142,182 C144,158 136,132 126,112 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <g fill={INK}>
            <circle cx="64" cy="138" r="2.5" /><circle cx="78" cy="132" r="3" /><circle cx="94" cy="140" r="3.2" />
            <circle cx="56" cy="155" r="3" /><circle cx="72" cy="150" r="3.2" />
            <circle cx="61" cy="172" r="3.2" />
          </g>
          <path d="M80,155 L80,196" stroke={INK} strokeWidth={2.4} />
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <circle cx="126" cy="120" r="2.2" fill={INK} />
          <circle cx="142" cy="106" r="2.2" fill={INK} />
          <g>
            <path d="M50,80 L56,42 L70,70 Z" fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M136,80 L130,42 L116,70 Z" fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M52,88 C46,56 142,56 136,88 C139,116 122,124 94,124 C66,124 49,116 52,88 Z"
                  fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <path d="M52,88 C47,68 68,62 81,63 L81,80 C71,82 60,85 52,88 Z" fill={INK} />
            <path d="M136,88 C141,68 120,62 107,63 L107,80 C117,82 128,85 136,88 Z" fill={INK} />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="86" y1="63" x2="86" y2="70" /><line x1="90" y1="62" x2="90" y2="70" /><line x1="94" y1="62" x2="94" y2="70" /><line x1="98" y1="62" x2="98" y2="70" />
            </g>
            <circle cx="66" cy="101" r="6" fill="#F4978E" opacity="0.9" />
            <circle cx="122" cy="101" r="6" fill="#F4978E" opacity="0.9" />
            <circle cx="78" cy="94" r="4.5" fill={INK} /><circle cx="79.5" cy="92.5" r="1.5" fill="#FFFDF9" />
            <circle cx="110" cy="94" r="4.5" fill={INK} /><circle cx="111.5" cy="92.5" r="1.5" fill="#FFFDF9" />
            <path d="M91,103 L97,103 L94,107 Z" fill={INK} />
            <path d="M94,107 v2 M89,111 c2,3 5,2 5,0 c0,2 3,3 5,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="60" y1="98" x2="36" y2="95" /><line x1="58" y1="104" x2="32" y2="104" />
              <line x1="128" y1="98" x2="152" y2="95" /><line x1="130" y1="104" x2="156" y2="104" />
            </g>
          </g>
        </g>
      )}

      {/* 5. YUKI */}
      {catId === 'yuki' && (
        <g>
          <path d="M40,185 C22,183 12,170 16,150 C19,138 27,136 30,142 C33,148 25,165 36,178"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M60,110 C50,130 40,155 42,180 C44,198 56,204 92,204 C132,204 142,198 144,180 C146,155 136,130 124,110 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <path d="M84,150 L84,198" stroke={INK} strokeWidth={2.4} />
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <g>
            <g stroke={INK} strokeWidth={1.8} strokeLinecap="round">
              <line x1="36" y1="68" x2="46" y2="74" /><line x1="32" y1="76" x2="44" y2="81" /><line x1="32" y1="86" x2="42" y2="89" />
            </g>
            <path d="M50,76 L56,40 L72,68 Z" fill="#FFFDF9" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M136,76 L130,40 L114,68 Z" fill="#FFFDF9" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M52,88 C46,56 142,56 136,88 C139,116 122,124 94,124 C66,124 49,116 52,88 Z"
                  fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <circle cx="76" cy="96" r="4" fill={INK} />
            <circle cx="112" cy="96" r="4" fill={INK} />
            <path d="M91,103 L97,103 L94,107 Z" fill={INK} />
            <path d="M94,107 v2 M89,111 c2,3 5,2 5,0 c0,2 3,3 5,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="64" y1="104" x2="40" y2="104" />
              <line x1="124" y1="98" x2="150" y2="95" /><line x1="126" y1="104" x2="154" y2="104" />
            </g>
          </g>
        </g>
      )}

      {/* 6. NYX */}
      {catId === 'black' && (
        <g>
          <path d="M40,175 C28,168 24,150 26,132 C27,123 31,122 34,126 C36,132 34,145 42,168"
                fill="#1E1B18" stroke="#1E1B18" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M68,118 C56,138 48,162 50,185 C51,202 62,205 92,205 C124,205 134,202 136,185 C137,162 128,118 116,118 Z"
                fill="#1E1B18" stroke="#1E1B18" strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M80,160 L80,198 C80,202 74,202 74,198" stroke="#FFFDF9" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill="#1E1B18" stroke="#1E1B18" strokeWidth={2.4} strokeLinejoin="round" />
          <g>
            <path d="M50,82 L56,44 L70,74 Z" fill="#1E1B18" stroke="#1E1B18" strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M54,76 L58,52 L64,71 Z" fill="#E05368" />
            <path d="M134,82 L128,44 L114,74 Z" fill="#1E1B18" stroke="#1E1B18" strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M130,76 L126,52 L120,71 Z" fill="#E05368" />
            <path d="M54,90 C46,58 140,58 132,90 C136,116 120,122 92,122 C64,122 48,116 54,90 Z"
                  fill="#1E1B18" stroke="#1E1B18" strokeWidth={2.8} strokeLinejoin="round" />
            <ellipse cx="74" cy="95" rx="7.5" ry="6.5" fill="#FFFDF9" />
            <circle cx="76" cy="94" r="4.2" fill="#1E1B18" />
            <circle cx="77.5" cy="92.5" r="1.5" fill="#FFFDF9" />
            <ellipse cx="110" cy="95" rx="7.5" ry="6.5" fill="#FFFDF9" />
            <circle cx="112" cy="94" r="4.2" fill="#1E1B18" />
            <circle cx="113.5" cy="92.5" r="1.5" fill="#FFFDF9" />
            <path d="M91,103 L97,103 L94,107 Z" fill="#E05368" />
            <path d="M94,107 v2 M90,110 c1,2 4,2 4,0 c0,2 2,2 4,0" stroke="#E05368" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <g stroke="#FFFDF9" strokeWidth={1.4} strokeLinecap="round" opacity="0.85">
              <line x1="64" y1="101" x2="40" y2="98" /><line x1="62" y1="107" x2="36" y2="108" />
              <line x1="122" y1="101" x2="146" y2="98" /><line x1="124" y1="107" x2="150" y2="108" />
            </g>
          </g>
        </g>
      )}

      {/* 7. BOBA */}
      {catId === 'boba' && (
        <g>
          <path d="M40,198 C24,198 12,192 8,175 C6,165 16,165 18,175 C20,185 30,188 40,188"
                fill={INK} stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M62,115 C50,135 40,160 42,185 C44,202 56,205 92,205 C128,205 140,202 142,185 C143,160 132,135 121,115 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <path d="M54,140 C46,144 42,155 44,165 C46,172 54,175 62,172 C70,168 70,155 66,146 Z" fill="#E07A5F" />
          <path d="M42,182 C38,192 46,203 60,203 C70,203 72,195 70,188 C68,180 58,178 48,180 Z" fill="#E07A5F" />
          <path d="M80,155 L80,204" stroke={INK} strokeWidth={2.2} />
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <g>
            <path d="M50,80 L56,42 L72,70 Z" fill="#E07A5F" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M134,80 L128,42 L112,70 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M52,88 C46,56 142,56 136,88 C139,116 122,124 94,124 C66,124 49,116 52,88 Z"
                  fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <path d="M52,88 C47,68 68,62 90,62 L90,98 C74,101 60,98 52,88 Z" fill="#E07A5F" />
            <circle cx="72" cy="90" r="7" fill="#FFFDF9" stroke={INK} strokeWidth={2} />
            <circle cx="75" cy="88" r="3.6" fill={INK} />
            <circle cx="76" cy="86" r="1.2" fill="#FFFDF9" />
            <circle cx="114" cy="90" r="7" fill="#FFFDF9" stroke={INK} strokeWidth={2} />
            <circle cx="117" cy="88" r="3.6" fill={INK} />
            <circle cx="118" cy="86" r="1.2" fill="#FFFDF9" />
            <path d="M91,103 L97,103 L94,107 Z" fill={INK} />
            <path d="M94,107 v2 M89,111 c2,3 5,2 5,0 c0,2 3,3 5,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="60" y1="98" x2="34" y2="96" /><line x1="58" y1="105" x2="30" y2="106" />
              <line x1="126" y1="98" x2="152" y2="96" /><line x1="128" y1="105" x2="156" y2="106" />
            </g>
          </g>
        </g>
      )}

      {/* 8. WINSTON (tuxedo) */}
      {catId === 'tuxedo' && (
        <g>
          <path d="M38,175 C20,170 8,152 6,130 C4,105 20,80 40,80 C52,80 60,90 58,100 C56,110 46,116 36,110"
                fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          <g stroke="#FFFDF9" strokeWidth={2.2} strokeLinecap="round">
            <line x1="14" y1="158" x2="24" y2="162" /><line x1="8" y1="142" x2="18" y2="145" />
            <line x1="6" y1="126" x2="16" y2="128" /><line x1="10" y1="112" x2="20" y2="108" />
          </g>
          <path d="M56,120 C42,138 34,162 36,192 C37,202 44,205 60,205 C66,205 70,198 70,185 L70,130 Z"
                fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
          <g stroke="#FFFDF9" strokeWidth={2} strokeLinecap="round">
            <line x1="38" y1="162" x2="66" y2="163" /><line x1="37" y1="174" x2="66" y2="175" /><line x1="38" y1="186" x2="66" y2="187" />
          </g>
          <path d="M60,115 C60,115 56,140 58,170 C60,196 64,205 88,205 C112,205 116,196 118,170 C120,140 116,115 116,115 Z"
                fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <line x1="80" y1="162" x2="80" y2="200" stroke={INK} strokeWidth={2.4} />
          <path d="M116,120 C130,138 138,162 136,192 C135,202 128,205 112,205 L112,130 Z"
                fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
          <g stroke="#FFFDF9" strokeWidth={2} strokeLinecap="round">
            <line x1="116" y1="162" x2="134" y2="160" /><line x1="116" y1="174" x2="135" y2="172" />
          </g>
          <path d="M96,140 C110,130 135,110 156,88 C160,84 164,86 162,93 C144,116 120,136 102,152 Z"
                fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <g stroke="#FFFDF9" strokeWidth={1.8} strokeLinecap="round">
            <line x1="120" y1="126" x2="128" y2="134" /><line x1="134" y1="114" x2="142" y2="122" />
          </g>
          <path d="M148,100 C152,92 161,88 164,92 C166,96 162,104 154,110 Z" fill="#FFFDF9" stroke={INK} strokeWidth={1.8} />
          <g>
            <path d="M50,80 L56,42 L70,70 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <line x1="56" y1="52" x2="56" y2="66" stroke="#FFFDF9" strokeWidth={1.6} strokeLinecap="round" />
            <path d="M136,80 L130,42 L116,70 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <line x1="130" y1="52" x2="130" y2="66" stroke="#FFFDF9" strokeWidth={1.6} strokeLinecap="round" />
            <path d="M52,88 C46,56 142,56 136,88 C139,116 122,124 94,124 C66,124 49,116 52,88 Z"
                  fill="#FFFDF9" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <path d="M52,86 C47,60 141,60 136,86 C120,82 108,80 94,80 C80,80 68,82 52,86 Z"
                  fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
            <g stroke="#FFFDF9" strokeWidth={2} strokeLinecap="round">
              <line x1="68" y1="70" x2="120" y2="70" /><line x1="74" y1="76" x2="114" y2="76" />
            </g>
            <circle cx="66" cy="101" r="6" fill="#F4978E" opacity="0.9" />
            <circle cx="122" cy="101" r="6" fill="#F4978E" opacity="0.9" />
            <circle cx="78" cy="94" r="4.5" fill={INK} /><circle cx="79.5" cy="92.5" r="1.5" fill="#FFFDF9" />
            <circle cx="110" cy="94" r="4.5" fill={INK} /><circle cx="111.5" cy="92.5" r="1.5" fill="#FFFDF9" />
            <path d="M91,103 L97,103 L94,107 Z" fill={INK} />
            <path d="M94,107 v2 M89,111 c2,3 5,2 5,0 c0,2 3,3 5,0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <line x1="94" y1="116" x2="94" y2="119" stroke={INK} strokeWidth={1.5} strokeLinecap="round" opacity="0.75" />
            <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
              <line x1="60" y1="98" x2="36" y2="96" /><line x1="58" y1="104" x2="32" y2="104" />
              <line x1="128" y1="98" x2="152" y2="96" /><line x1="130" y1="104" x2="156" y2="104" />
            </g>
          </g>
        </g>
      )}
    </g>
  );
}

export function PawShake({ open, catId, catName = 'Your Cat', onComplete }: PawShakeProps) {
  const [clasped, setClasped] = useState(false);

  useEffect(() => {
    if (!open) {
      setClasped(false);
      return;
    }

    const claspTimer = setTimeout(() => {
      setClasped(true);
      ambient.playRandomMeow(0.75);
    }, 450);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(claspTimer);
      clearTimeout(finishTimer);
    };
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="pawshake-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Commitment sealed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(38, 30, 26, 0.82)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 16,
          overflow: 'hidden',
        }}
      >
        {/* The High-Five Stage Card */}
        <div
          style={{
            background: '#FAF6EE',
            border: '3.5px solid var(--ink)',
            borderRadius: 24,
            padding: '20px 16px 18px',
            boxShadow: '7px 7px 0 var(--ink)',
            maxWidth: 440,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <svg
            viewBox="0 0 280 220"
            width="100%"
            height="230"
            role="img"
            aria-label={`Pact high-five between you and ${catName}`}
            style={{ overflow: 'visible' }}
          >
            {/* 1. Impact Star Sparkles */}
            {clasped && (
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'backOut' }}
                fill="#F59E0B"
                stroke={INK}
                strokeWidth={1.2}
              >
                <path d="M125 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#FEF08A" />
                <path d="M238 38 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#F59E0B" />
                <path d="M30 68 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#FEF08A" />
                <path d="M208 85 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#F59E0B" />
              </motion.g>
            )}

            {/* 2. "Pact Sealed" Text High Above with clean breathing space */}
            {clasped && (
              <motion.g
                initial={{ scale: 1.8, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                textAnchor="middle"
                fontFamily="var(--font-hand), 'Gochi Hand', -apple-system, sans-serif"
                fontWeight="800"
                fill={INK}
              >
                <text x="176" y="26" fontSize="20" letterSpacing="0.5px">Pact</text>
                <text x="176" y="45" fontSize="20" letterSpacing="0.5px">Sealed</text>
              </motion.g>
            )}

            {/* 3. Left Cat (Slides in smoothly from Left) */}
            <motion.g
              initial={{ x: -140, opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                y: clasped ? [0, -6, 3, -4, 0] : 0,
              }}
              transition={{
                x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 0.65, ease: 'easeInOut' },
              }}
            >
              <CatHighFiveFigure catId={catId} />
            </motion.g>

            {/* 4. Right Human Hand (Slides in smoothly from Right) */}
            <motion.g
              initial={{ x: 140, opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                y: clasped ? [0, -6, 3, -4, 0] : 0,
              }}
              transition={{
                x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 0.65, ease: 'easeInOut' },
              }}
            >
              <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
                <path d="M216,134 L258,156 L244,190 L202,168 Z" fill="#EAE2D2" />
                <line x1="210" y1="141" x2="198" y2="169" strokeWidth={2.2} />
                <path d="M198,145 L182,125 C176,120 168,118 164,124 C160,130 170,138 184,148 L196,162 Z" fill="#FBE9D2" />
                <path d="M198,145 
                         L194,115 L192,86 C192,80 186,80 186,86 L186,108 
                         L184,76 C184,70 178,70 178,76 L178,102 
                         L176,68 C176,62 170,62 170,68 L170,98 
                         L168,75 C168,69 162,69 162,75 L162,112 
                         C156,110 148,114 150,121 C152,126 160,130 170,135 
                         L182,148 Z" fill="#FBE9D2" />
                <line x1="168" y1="84" x2="168" y2="108" strokeWidth={1.6} />
                <line x1="176" y1="78" x2="176" y2="105" strokeWidth={1.6} />
                <line x1="184" y1="84" x2="184" y2="108" strokeWidth={1.6} />
              </g>
            </motion.g>
          </svg>

          {/* Caption */}
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <p
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 22,
                fontWeight: 'bold',
                margin: '0 0 2px',
                color: 'var(--ink)',
              }}
            >
              {catName} accepts your promise.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6C5E53' }}>
              Don't let your cat down!
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
