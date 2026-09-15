"""
Put the untranslated pages through t().

THE MISTAKES THIS IS WRITTEN AROUND
  Three earlier passes at this by hand went wrong in the same three ways:

    attr="Text"     became   attr=t("Text")      - JSX attributes need braces
    {t("X")}        became   {t(t("X"))}         - wrapping something already wrapped
    text split over two source lines was missed entirely

  So: attributes and text nodes are handled separately, anything already inside
  a t(...) is skipped, and a text node is matched across newlines and collapsed
  to one line before wrapping.

WHAT IS DELIBERATELY LEFT ALONE
  className, key, id, type, name, href, to, role, aria-*, data-*, and anything
  that looks like a path, a number or an enum value. Translating a class name
  or a route breaks the page rather than the language.
"""
import re
import sys

# Attributes whose value a person reads.
VISIBLE_ATTRS = ("label", "title", "header", "placeholder", "hint", "subtitle",
                 "confirmLabel", "cancelLabel", "reasonLabel", "noun", "ariaLabel",
                 "emptyTitle", "emptyHint")

SKIP_VALUE = re.compile(r"^(?:/|#|https?:|[0-9.]+$|[A-Z_]{3,}$)")


def already_wrapped(source, index):
    """True when this position sits inside a t( ... ) call."""
    window = source[max(0, index - 90):index]
    return "t(" in window and window.rfind("t(") > window.rfind(")")


def wrap_attributes(source):
    count = 0

    def swap(match):
        nonlocal count
        name, value = match.group(1), match.group(2)
        if SKIP_VALUE.match(value) or not re.search(r"[a-z]", value):
            return match.group(0)
        count += 1
        return f'{name}={{t("{value}")}}'

    pattern = r'\b(' + "|".join(VISIBLE_ATTRS) + r')="([^"{}]{3,})"'
    return re.sub(pattern, swap, source), count


def wrap_text_nodes(source):
    """
    Text between tags. Matched across newlines, because a sentence wrapped by
    the editor is still one sentence - missing those is how the last pass left
    a paragraph in English.
    """
    count = 0

    def swap(match):
        nonlocal count
        head, text, tail = match.group(1), match.group(2), match.group(3)
        flat = " ".join(text.split())
        if not flat or not re.search(r"[A-Za-z]{3}", flat):
            return match.group(0)
        if SKIP_VALUE.match(flat) or flat.startswith("{") or "{" in flat:
            return match.group(0)
        if already_wrapped(source, match.start(2)):
            return match.group(0)
        count += 1
        return f'{head}{{t("{flat}")}}{tail}'

    pattern = r"(>)\s*\n?\s*([A-Z][^<>{}\"]{4,}?)\s*\n?\s*(<)"
    return re.sub(pattern, swap, source), count


def add_hook(source):
    if "useLanguage" in source:
        return source, False
    imports = list(re.finditer(r"^import [^\n\r]*$", source, re.M))
    if not imports:
        return source, False
    newline = "\r\n" if "\r\n" in source else "\n"
    depth = source.count("/components/") and "../.." or ".."
    rel = "../../config/languageContext.jsx"
    if "/components/" in CURRENT and CURRENT.count("/") > 3:
        rel = "../../../config/languageContext.jsx"
    source = (source[:imports[-1].end()] + newline
              + f'import {{ useLanguage }} from "{rel}";' + source[imports[-1].end():])
    component = re.search(r"export default function \w+\([^)]*\)\s*\{", source)
    if not component:
        return source, False
    source = (source[:component.end()] + newline + "  const { t } = useLanguage();"
              + source[component.end():])
    return source, True


total_attrs = total_text = hooks = 0
for CURRENT in sys.argv[1:]:
    original = open(CURRENT, encoding="utf-8").read()
    changed = original

    changed, attrs = wrap_attributes(changed)
    changed, texts = wrap_text_nodes(changed)
    if attrs or texts:
        changed, added = add_hook(changed)
        hooks += 1 if added else 0

    # belt and braces: undo any double wrap this pass could have created
    changed = re.sub(r't\(t\((\"(?:[^\"\\\\]|\\\\.)*\")\)\)', r"t(\1)", changed)
    # and any attribute that lost its braces
    changed = re.sub(r'(\w+)=t\("((?:[^"\\]|\\.)*)"\)', r'\1={t("\2")}', changed)

    if changed != original:
        open(CURRENT, "w", encoding="utf-8", newline="").write(changed)
        total_attrs += attrs
        total_text += texts
        print(f"  {CURRENT.split('/')[-1]:34} {attrs:3} attributes  {texts:3} text nodes")

print(f"\n  {total_attrs} attributes, {total_text} text nodes, {hooks} hooks added")
