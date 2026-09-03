/**
 * Renders an assistant answer as real sections instead of raw text.
 *
 * WHY THIS EXISTS
 *   The model replies in light markdown - "**TRIAGE**" on its own line,
 *   numbered steps, the odd bold phrase. We were printing that verbatim inside
 *   a pre-wrap bubble, so the reader saw literal asterisks and one unbroken
 *   wall of prose. The information was all there; finding it took effort.
 *
 * WHY NOT A MARKDOWN LIBRARY
 *   We control the prompt, so the output shape is narrow: headings, ordered
 *   and unordered lists, paragraphs, inline bold and inline code. That is
 *   about sixty lines to handle, against a dependency that also brings HTML
 *   parsing and sanitising decisions we would then own. If answers ever need
 *   tables or links, swap this for react-markdown - the seam is one component.
 *
 * SAFETY
 *   Everything is rendered as React text nodes. There is no
 *   dangerouslySetInnerHTML anywhere here, so model output cannot inject
 *   markup no matter what it returns.
 */
export default function AnswerBlocks({ text, typing = false }) {
  const blocks = parse(text ?? "");

  return (
    <div className="ijp-answer">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 className="ijp-answer-heading" key={index}>
              {block.text}
            </h3>
          );
        }
        if (block.type === "ordered") {
          return (
            <ol className="ijp-answer-list" key={index}>
              {block.items.map((item, i) => (
                <li key={i}>{inline(item)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "unordered") {
          return (
            <ul className="ijp-answer-list" key={index}>
              {block.items.map((item, i) => (
                <li key={i}>{inline(item)}</li>
              ))}
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
      list.items.push(ordered[2]);
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
      list.items[list.items.length - 1] += " " + line;
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
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
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
