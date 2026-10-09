// Brand lockup from the mockup: "387" stacked vertically in Anton with
// "WEDDINGS" beneath it. One SVG, used at every size so the mark never differs
// between header, footer and the intro curtain.
//
// The first version spaced the digits by 0.72em, which is less than Anton's own
// cap height — the numerals overlapped and sheared into each other. A vertical
// stack needs a full em between baselines, which is what ROW below is.

const CAP = 0.73;  // Anton cap height, as a fraction of the font size
const ROW = 1.0;   // baseline-to-baseline for the stacked digits
const GAP = 0.42;  // space between the stack and the wordmark
const WORD = 0.368; // wordmark size relative to the numerals (38 -> 14)
// Headroom above the first digit. With the baseline at exactly CAP the top of
// the "3" lands on y=0, so Anton's rounded overshoot was shaved off at every
// size — in the header, the footer and the intro animation alike.
const PAD = 0.08;

type Props = {
  /** Height of the "387" glyphs in px; the wordmark scales with it */
  size?: number;
  color?: string;
  className?: string;
  title?: string;
};

const Logo = ({ size = 38, color = 'currentColor', className = '', title = '387 Weddings' }: Props) => {
  const digits = ['3', '8', '7'];
  const word = Math.round(size * WORD * 10) / 10;
  const top = PAD * size;
  const stackH = top + CAP * size + (digits.length - 1) * ROW * size;
  const wordBaseline = stackH + GAP * size + word * CAP;
  const height = wordBaseline + word * 0.18;
  // The wordmark is the wider of the two, so it sets the box
  const width = Math.max(size * 0.78, word * 6.6);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g fill={color} fontFamily="Anton, Oswald, Impact, sans-serif" fontWeight="400" textAnchor="middle">
        {digits.map((d, i) => (
          <text key={d} x={width / 2} y={top + CAP * size + i * ROW * size} fontSize={size}>
            {d}
          </text>
        ))}
        <text x={width / 2} y={wordBaseline} fontSize={word} letterSpacing={word * 0.06}>
          WEDDINGS
        </text>
      </g>
    </svg>
  );
};

export default Logo;
