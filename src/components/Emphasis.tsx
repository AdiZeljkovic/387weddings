import React from 'react';

/**
 * A word wrapped in *asterisks* in a CMS field is set apart, the way the board
 * marks the one key word of a sentence ("svaki *par*", "To je *vaša priča.*").
 * The owner chooses the word from the panel; the page decides how it looks.
 */
const Emphasis = ({ text, className = 'italic text-love' }: { text: string; className?: string }) => (
  <>
    {text.split(/(\*[^*]+\*)/g).map((part, i) =>
      part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
        <span key={i} className={className}>{part.slice(1, -1)}</span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    )}
  </>
);

export default Emphasis;
