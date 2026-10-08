// Brand lockup from the mockup: "387" set vertically in Anton with "WEDDINGS"
// beneath it. The brief asks for an SVG, so the mark is drawn as inline SVG —
// inline SVG inherits the page's webfonts, which an uploaded .svg file cannot.
//
// Sizes follow the spec: 38px / 14px on desktop, 22px / 9px on mobile.

type Props = {
  /** Height of the "387" glyphs in px (the wordmark scales with it) */
  size?: number;
  /** Any CSS colour; defaults to the ink tone so it inherits on light bars */
  color?: string;
  className?: string;
  title?: string;
};

const Logo = ({ size = 38, color = 'currentColor', className = '', title = '387 Weddings' }: Props) => {
  // "WEDDINGS" sits at roughly 37% of the numeral height in the mockup
  const word = Math.round(size * 0.368 * 10) / 10;
  const gap = Math.max(4, Math.round(size * 0.14));
  // The numerals stack vertically, so the block is three glyphs tall
  const stackH = size * 3 * 0.72;
  const height = stackH + gap + word * 1.2;
  const width = Math.max(size * 1.1, word * 6.2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title}
      style={{ overflow: 'visible' }}
    >
      <title>{title}</title>
      {/* Vertical numerals — one tspan per digit keeps the stack even */}
      {['3', '8', '7'].map((d, i) => (
        <text
          key={d}
          x={width / 2}
          y={size * 0.72 * (i + 1) - size * 0.04}
          textAnchor="middle"
          fill={color}
          fontFamily="Anton, Oswald, Impact, sans-serif"
          fontSize={size}
          fontWeight="400"
        >
          {d}
        </text>
      ))}
      <text
        x={width / 2}
        y={stackH + gap + word}
        textAnchor="middle"
        fill={color}
        fontFamily="Anton, Oswald, Impact, sans-serif"
        fontSize={word}
        letterSpacing={word * 0.06}
      >
        WEDDINGS
      </text>
    </svg>
  );
};

export default Logo;
