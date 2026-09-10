/**
 * Renders an assistant answer as real sections instead of raw text.
 */
/**
 * Myanmar script, U+1000 to U+109F.
 *
 * Burmese stacks diacritics above and below the baseline, so at the size and
 * line-height that suit Latin text the marks collide and the small-caps
 * headings become unreadable. Detecting the script lets the CSS give it the
 * room it needs, rather than forcing one set of measurements onto both.
 */
const MYANMAR = /[\u1000-\u109F]/;

/**
 * Gives a heading or a labelled bullet a meaning, and therefore a colour.
 *
 * The assistants write in a consistent shape - a finding, then what to do
 * about it - and that shape was invisible because every block rendered
 * identically. Matching on the words the prompts actually produce turns a
 * uniform wall of text into something you can skim.
 *
 * Unrecognised text falls through to neutral, which is the common case and
 * must stay unremarkable.
 */
const TONES = [
  // Matched anywhere in the text, not just at the start: the assistants write
  // headings like "VACANCY CONFIGURATION RISK", where the meaningful word is
  // last. Anchoring missed every one of them.
  { match: /\b(gap|risk|issue|problem|weakness|missing|concern|warning|stalled)\b/i,
    tone: "warn", icon: "bi-exclamation-triangle" },
  { match: /\b(action|fix|recommend|suggest|next step|improve|consider|priorit)/i,
    tone: "action", icon: "bi-arrow-right-circle" },
  { match: /\b(strength|verified|match|advantage|already have)\b/i,
    tone: "ok", icon: "bi-check-circle" },
  { match: /\b(question|interview|ask about)\b/i,
    tone: "ask", icon: "bi-chat-quote" },
];

function toneOf(text) {
  const found = TONES.find((entry) => entry.match.test((text ?? "").trim()));
  return found ?? { tone: "neutral", icon: "bi-dot" };
}

/** Splits "Gap: the vacancy has no skills" into its label and the rest. */
function splitLabel(text) {
  // Digits allowed: "J2EE Experience:" and "2FA setup:" are labels too.
  const match = /^\s*(?:\*\*)?([A-Z][A-Za-z0-9 ]{2,28})(?:\*\*)?\s*:\s*(.*)$/s.exec(text ?? "");
  if (!match) {
    return null;
  }
  return { label: match[1].trim(), rest: match[2] };
}

export default function AnswerBlocks({ text, typing = false }) {
  const blocks = parse(text ?? "");
  const burmese = MYANMAR.test(text ?? "");

  return (
    <div className={`ijp-answer${burmese ? " ijp-answer--mm" : ""}`}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              className={`ijp-answer-heading ijp-answer-heading--${toneOf(block.text).tone}`}
              key={index}
            >
              <i
                className={`bi ${toneOf(block.text).icon} ijp-answer-heading-icon`}
                aria-hidden="true"
              />
              {block.text}
            </h3>
          );
        }
        if (block.type === "ordered") {
          return (
            <ol className="ijp-answer-list" key={index}>
              {block.items.map((item, i) => (
                // value= keeps the model's numbering across a list that was
                // interrupted, instead of silently restarting at 1.
                <li key={i} value={item.number}>
                  {(() => {
                    const parts = splitLabel(item.text);
                    if (!parts) {
                      return inline(item.text);
                    }
                    const { tone } = toneOf(parts.label);
                    return (
                      <>
                        <span className={`ijp-answer-label ijp-answer-label--${tone}`}>
                          {parts.label}
                        </span>
                        {inline(parts.rest)}
                      </>
                    );
                  })()}
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "unordered") {
          return (
            <ul className="ijp-answer-list" key={index}>
              {block.items.map((item, i) => {
                const parts = splitLabel(item);
                if (!parts) {
                  return <li key={i}>{inline(item)}</li>;
                }
                const { tone } = toneOf(parts.label);
                return (
                  <li key={i} className={`ijp-answer-item ijp-answer-item--${tone}`}>
                    <span className={`ijp-answer-label ijp-answer-label--${tone}`}>
                      {parts.label}
                    </span>
                    {inline(parts.rest)}
                  </li>
                );
              })}
            </ul>
          );
        }
        return (
          <p className="ijp-answer-text" key={index}>
            {inline(block.text)}
          </p>
        );
      })}
      {typing ? <span className="ijp-caret" aria-hidden="true" /> : null}
    </div>
  );
}

/** Turns the raw answer into a list of blocks. */
function parse(text) {
  const lines = text.split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "text", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }

    // A line that is nothing but bold text, or a markdown heading, is a
    // section title. "**TRIAGE**" and "### Triage" both land here.
    const boldOnly = line.match(/^\*\*(.+?)\*\*:?$/);
    const hashHeading = line.match(/^#{1,4}\s+(.+?)$/);
    if (boldOnly || hashHeading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: (boldOnly ?? hashHeading)[1].trim() });
      continue;
    }

    const ordered = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (ordered) {
      flushParagraph();
      if (!list || list.type !== "ordered") {
        flushList();
        list = { type: "ordered", items: [] };
      }
      // Keep the number the model wrote. A list interrupted by a bullet or a
      // heading starts a NEW <ol>, and a fresh <ol> restarts at 1 - which is
      // why three separate steps all rendered as "1.".
      list.items.push({ number: Number(ordered[1]), text: ordered[2] });
      continue;
    }

    // A line of only dashes or underscores is a divider the model drew to
    // separate sections. We already separate sections with a rule, so it is
    // noise - and rendered literally it looks like a mistake.
    if (/^([-_*]\s*){3,}$/.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = line.match(/^[-*\u2022]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.type !== "unordered") {
        flushList();
        list = { type: "unordered", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    // A plain line directly under a list item is a continuation of it -
    // wrapped text, not a new paragraph.
    if (list) {
      const last = list.items[list.items.length - 1];
      if (typeof last === "string") {
        list.items[list.items.length - 1] = last + " " + line;
      } else {
        last.text += " " + line;
      }
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

/** Inline **bold** and `code`, as React nodes. */
function inline(text) {
  // Bold before italic: **x** must be matched first or the single-asterisk
  // pattern eats its markers and leaves a stray one behind.
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code className="ijp-data" key={index}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
