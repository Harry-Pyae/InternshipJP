"""
Stylesheet faults that a flat scan cannot see.

Two blind spots this replaces, both found by review rather than by the check
that was supposed to find them:

  1. ONLY SINGLE-CLASS SELECTORS WERE COMPARED. The old scan matched
     `^\\.[\\w-]+\\s*\\{`, so `.form-control:focus, .form-select:focus` and
     `.ijp-sidebar--collapsed .ijp-sidebar-head` were invisible. Both were
     declared twice with conflicting values, and in both cases the earlier
     declaration was dead - edit it and nothing changes.

  2. ONLY THE FIRST CLASS IN AN ATTRIBUTE WAS READ. The old scan captured one
     `ijp-` token per `className`, so `className="ijp-card p-3 ijp-invite"`
     never revealed `ijp-invite`, which had no rule at all.

Context matters: a rule inside `@media` is not a duplicate of the same selector
outside it, and a `@keyframes` stop is not a selector. Comparing flat reports
23 conflicts that are not conflicts, which is how the two real ones stayed
hidden - noise is as effective as silence at hiding a finding.
"""
import re, glob, sys, collections

CSS = "src/styles/app.css"


def blocks(css):
    """Every rule as (at-rule context, selector, line, body)."""
    out, ctx, i = [], [], 0
    while i < len(css):
        if css[i] == "@":
            m = re.match(r"@[\w-]+[^{;]*\{", css[i:])
            if m:
                ctx.append(re.sub(r"\s+", " ", css[i:i + m.end() - 1]).strip())
                i += m.end()
                continue
        if css[i] == "{":
            start = max(css.rfind("}", 0, i) + 1, css.rfind("*/", 0, i) + 2, 0)
            sel = re.sub(r"\s+", " ", css[start:i]).strip()
            j, d = i, 0
            while j < len(css):
                if css[j] == "{":
                    d += 1
                elif css[j] == "}":
                    d -= 1
                    if d == 0:
                        break
                j += 1
            if sel and not sel.startswith("@"):
                out.append((tuple(ctx), sel, css[:i].count("\n") + 1, css[i + 1:j]))
            i = j + 1
            continue
        if css[i] == "}" and ctx:
            ctx.pop()
        i += 1
    return out


def props(body):
    """Declarations in a rule body, comments removed first.

    Without stripping them, a comment sitting above a declaration is glued to
    the property name by the split, so `box-shadow` becomes
    `/* ... */ box-shadow` and never matches the same property in another
    block. Every conflict involving a documented declaration was invisible -
    which, in a stylesheet this heavily commented, was most of them.
    """
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
    return {p.split(":")[0].strip(): p.split(":", 1)[1].strip()
            for p in body.split(";") if ":" in p}


css = open(CSS, encoding="utf-8").read()
rules = blocks(css)

# --- 1. the same selector twice in the same context, setting the same property
grouped = collections.defaultdict(list)
for ctx, sel, line, body in rules:
    grouped[(ctx, sel)].append((line, props(body)))

conflicts, split = [], 0
for (ctx, sel), items in sorted(grouped.items()):
    if len(items) < 2:
        continue
    # first against last, not first against second - with three blocks the
    # overlap was taken from two of them and then indexed on a third, which
    # raised a KeyError instead of reporting anything.
    overlap = set(items[0][1]) & set(items[-1][1])
    where = f" inside {ctx[-1]}" if ctx else ""
    if overlap:
        for key in sorted(overlap):
            dead, live = items[0], items[-1]
            if dead[1][key] != live[1][key]:
                conflicts.append(
                    f"{sel}{where}: {key} set at L{dead[0]} is overridden at "
                    f"L{live[0]} ({dead[1][key]} -> {live[1][key]})")
    else:
        split += 1

# --- 2. classes used in markup with no rule anywhere
defined = set(re.findall(r"\.(ijp-[\w-]+)", css))
used = set()
for f in glob.glob("src/**/*.jsx", recursive=True):
    src = re.sub(r"/\*.*?\*/", "", open(f, encoding="utf-8", errors="ignore").read(), flags=re.S)
    # every token in every className, not only the first
    for attr in re.findall(r'className=(?:"([^"]*)"|\{`([^`]*)`\})', src):
        for token in re.findall(r"ijp-[\w-]+", attr[0] + " " + attr[1]):
            used.add(token)
orphans = sorted(c for c in used - defined
                 if not c.endswith("--") and c not in ("ijp-primary", "ijp-quiet"))

for c in conflicts:
    print("  OVERRIDDEN  " + c)
for o in orphans:
    print("  NO RULE     " + o + " is used in markup and defined nowhere")

print(f"\n  rules parsed                : {len(rules)}")
print(f"  same selector, same context : {split + len({k for k, v in grouped.items() if len(v) > 1 and set(v[0][1]) & set(v[1][1])})}")
print(f"  of which override a value   : {len(conflicts)}")
print(f"  classes used with no rule   : {len(orphans)}")

sys.exit(1 if conflicts or orphans else 0)
