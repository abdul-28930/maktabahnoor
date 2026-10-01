import React from 'react';

/**
 * Parses markdown inline formatting:
 * - ***bold italic*** or ___bold italic___
 * - **bold** or __bold__
 * - *italic* or _italic_
 */
export function parseInlineMarkdown(text) {
  if (!text || typeof text !== 'string') return text;

  // Non-greedy token matching for bold-italic, bold, and italic markers
  const tokenRegex = /(\*\*\*[^*]+?\*\*\*|___[^_]+?___|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\n]+?\*|_[^_\n]+?_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bold + Italic (***text*** or ___text___)
    if (
      (part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length >= 6)
    ) {
      return (
        <strong key={idx} style={{ fontWeight: 600, color: '#1a1712' }}>
          <em style={{ fontStyle: 'italic' }}>{part.slice(3, -3)}</em>
        </strong>
      );
    }

    // Bold (**text** or __text__)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} style={{ fontWeight: 600, color: '#1a1712' }}>
          {parseInlineMarkdown(inner)}
        </strong>
      );
    }

    // Italic (*text* or _text_)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} style={{ fontStyle: 'italic' }}>
          {inner}
        </em>
      );
    }

    return part;
  });
}

/**
 * Renders multiline descriptions with paragraphs and bold/italic formatting.
 * Paragraphs separated by blank lines (\n\n). Single newlines within paragraphs converted to <br />.
 */
export function renderDescription(text, options = {}) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const {
    pStyle = {},
    fontSize = 18,
    fontFamily = "'Cormorant Garamond', serif",
    color = '#4a453f',
    lineHeight = 1.8,
  } = options;

  // Split into paragraphs by blank lines (1 or more empty lines)
  const paragraphs = trimmed.split(/\n\s*\n+/).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split(/\n/);
        return (
          <p
            key={pIdx}
            style={{
              fontFamily,
              fontStyle: 'normal',
              fontSize,
              color,
              lineHeight,
              margin: 0,
              ...pStyle,
            }}
          >
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInlineMarkdown(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function FormattedDescription({ text, options }) {
  return renderDescription(text, options);
}
