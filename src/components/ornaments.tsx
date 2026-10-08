import React from 'react';

// Decorative line-art taken from the client mockup. The olive sprig and the
// diamond separator are the only two ornaments the brief allows, used sparingly
// and always hidden from assistive tech.

export const OliveBranch = ({ className = '', flip = false }: { className?: string; flip?: boolean }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none select-none opacity-20 ${className}`}
    style={flip ? { transform: 'scaleX(-1)' } : undefined}
  >
    <svg viewBox="0 0 410 160" width="100%" fill="none" stroke="#a6865d" strokeWidth="1.2" strokeLinecap="round">
      <path d="M10 130C120 122 250 100 390 30" />
    <ellipse cx="58.9" cy="112.9" rx="15.0" ry="5.0" transform="rotate(-43.9 58.9 112.9)" />
    <ellipse cx="61.5" cy="138.0" rx="15.0" ry="5.0" transform="rotate(32.1 61.5 138.0)" />
    <ellipse cx="92.0" cy="108.4" rx="15.6" ry="5.1" transform="rotate(-45.5 92.0 108.4)" />
    <ellipse cx="95.4" cy="134.0" rx="15.6" ry="5.1" transform="rotate(30.5 95.4 134.0)" />
    <ellipse cx="126.0" cy="102.8" rx="16.2" ry="5.3" transform="rotate(-47.3 126.0 102.8)" />
    <ellipse cx="130.3" cy="128.8" rx="16.2" ry="5.3" transform="rotate(28.7 130.3 128.8)" />
    <ellipse cx="160.8" cy="95.8" rx="16.7" ry="5.5" transform="rotate(-49.3 160.8 95.8)" />
    <ellipse cx="166.1" cy="122.2" rx="16.7" ry="5.5" transform="rotate(26.7 166.1 122.2)" />
    <ellipse cx="196.2" cy="87.6" rx="16.7" ry="5.5" transform="rotate(-51.5 196.2 87.6)" />
    <ellipse cx="202.4" cy="113.8" rx="16.7" ry="5.5" transform="rotate(24.5 202.4 113.8)" />
    <ellipse cx="232.0" cy="78.2" rx="16.1" ry="5.3" transform="rotate(-53.7 232.0 78.2)" />
    <ellipse cx="239.1" cy="103.5" rx="16.1" ry="5.3" transform="rotate(22.3 239.1 103.5)" />
    <ellipse cx="268.6" cy="66.9" rx="15.6" ry="5.1" transform="rotate(-56.1 268.6 66.9)" />
    <ellipse cx="276.6" cy="91.4" rx="15.6" ry="5.1" transform="rotate(19.9 276.6 91.4)" />
    <ellipse cx="305.9" cy="53.6" rx="15.0" ry="4.9" transform="rotate(-58.7 305.9 53.6)" />
    <ellipse cx="314.7" cy="77.2" rx="15.0" ry="4.9" transform="rotate(17.3 314.7 77.2)" />
    <ellipse cx="343.8" cy="38.2" rx="14.4" ry="4.8" transform="rotate(-61.2 343.8 38.2)" />
    <ellipse cx="353.5" cy="60.8" rx="14.4" ry="4.8" transform="rotate(14.8 353.5 60.8)" />
    <ellipse cx="399.0" cy="26.0" rx="13" ry="4.6" transform="rotate(-46.6 399.0 26.0)" />
    </svg>
  </div>
);

// Rule — red diamond — rule. Sits above the closing Instagram block.
export const DiamondRule = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
    <span className="w-11 h-px bg-gold-600" />
    <span className="w-1.5 h-1.5 bg-love rotate-45" />
    <span className="w-11 h-px bg-gold-600" />
  </div>
);

// Gold rule + small uppercase label. `centered` adds the mirrored second rule.
export const SectionLabel = ({
  children, style, centered = false, className = '',
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  centered?: boolean;
  className?: string;
}) => (
  <div className={`flex items-center gap-3.5 md:gap-4 ${centered ? 'justify-center' : ''} ${className}`}>
    {centered && <span aria-hidden="true" className="w-7 md:w-12 h-px bg-gold-600" />}
    <span
      style={style}
      className="text-[11px] md:text-[12px] tracking-[0.32em] uppercase text-gold-label whitespace-nowrap"
    >
      {children}
    </span>
    <span aria-hidden="true" className="w-7 md:w-12 h-px bg-gold-600" />
  </div>
);
