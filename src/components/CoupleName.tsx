import React from 'react';

/**
 * "Amra & Tarik" — the ampersand in italic red, as the boards set it (plain
 * italic where the board keeps it quiet, e.g. the previous/next links).
 */
export default function CoupleName({ name, className, redAmp = true }: {
  name: string; className?: string; redAmp?: boolean;
}) {
  const parts = name.split(/\s*&\s*/);
  if (parts.length < 2) return <span className={className}>{name}</span>;
  return (
    <span className={className}>
      {parts[0]} <span className={redAmp ? 'italic text-love' : 'italic'}>&amp;</span>{' '}
      {parts.slice(1).join(' & ')}
    </span>
  );
}

// The card and story label uses the singular form the boards show ("Vjenčanje")
export const CARD_LABEL_KEYS: Record<string, string> = {
  WEDDINGS:  'portfolio.card.wedding',
  STUDIO:    'portfolio.card.studio',
  PORTRAITS: 'portfolio.card.portrait',
};
