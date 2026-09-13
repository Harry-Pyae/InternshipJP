"""
Constructor wiring faults the parser cannot see.

javalang.parse accepts `this.fileStorageService = fileStorageService;` whether
or not the field exists. It fails at compile time with "cannot find symbol",
which is cheap to fix but only after a full Maven run.

This happens when a field is added by pattern-matching the declaration above
it. Match the indentation wrongly and the replacement silently does nothing:
the constructor gains its parameter and its assignment, and the field is never
declared. Nothing raises, and the file still parses.

Three faults, in the order they bite:

  1. this.X = ... where X is not a declared field   -> cannot find symbol
  2. a declared final field never assigned          -> not initialised
  3. a constructor parameter never used             -> harmless, but a sign
                                                       an edit half-landed
"""
import re, glob, sys

undeclared, unassigned, unused = [], [], []

for path in sorted(glob.glob("**/*.java", recursive=True)):
    src = open(path, encoding="utf-8", errors="ignore").read().replace("\r\n", "\n")
    name = path.split("/")[-1]
    cls = name[:-5]

    # Indentation varies between files in this project, so the patterns below
    # deliberately do not anchor to a column.
    fields = set(re.findall(r"private\s+final\s+[\w<>,\[\]\s]*?(\w+)\s*;", src))
    if not fields:
        continue

    ctor = re.search(r"public\s+" + re.escape(cls) + r"\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\s*\}", src)
    if not ctor:
        continue

    params = [p.strip().split()[-1] for p in ctor.group(1).split(",") if p.strip()]
    assigns = set(re.findall(r"this\.(\w+)\s*=", ctor.group(2)))

    for a in sorted(assigns - fields):
        undeclared.append(f"{name}: this.{a} assigned, but no field {a} is declared")
    for f in sorted(fields - assigns):
        unassigned.append(f"{name}: final field {f} is never assigned")
    for p in params:
        if p not in assigns:
            unused.append(f"{name}: constructor parameter {p} is never stored")

for u in undeclared:
    print("  CANNOT COMPILE  " + u)
for u in unassigned:
    print("  NEVER SET       " + u)
for u in unused:
    print("  UNUSED PARAM    " + u)

print(f"\n  assigned but undeclared : {len(undeclared)}")
print(f"  declared but unassigned : {len(unassigned)}")
print(f"  unused parameters       : {len(unused)}")


# ---------------------------------------------------------------- test call sites
#
# Changing a constructor in main and forgetting the test that builds it does not
# show up above: the test compiles separately and only fails on `mvn test-compile`,
# which is after the main build has already gone green.
arity = {}
for path in glob.glob("**/*.java", recursive=True):
    if "test" in path.replace("\\", "/").split("/"):
        continue
    src = open(path, encoding="utf-8", errors="ignore").read().replace("\r\n", "\n")
    cls = path.split("/")[-1][:-5]
    m = re.search(r"public\s+" + re.escape(cls) + r"\s*\(([^)]*)\)\s*\{", src)
    if m:
        arity[cls] = len([p for p in m.group(1).split(",") if p.strip()])

def count_args(text, start):
    depth, n, i, q = 1, 1, start, None
    if text[i:i + 1] == ")":
        return 0
    while i < len(text) and depth:
        c = text[i]
        if q:
            if c == "\\": i += 2; continue
            if c == q: q = None
        elif c in "\"'": q = c
        elif c in "([{": depth += 1
        elif c in ")]}":
            depth -= 1
            if depth == 0: break
        elif c == "," and depth == 1: n += 1
        i += 1
    return n

mismatched = []
for path in glob.glob("**/*.java", recursive=True):
    parts = path.replace("\\", "/").split("/")
    if "test" not in parts:
        continue
    src = open(path, encoding="utf-8", errors="ignore").read().replace("\r\n", "\n")
    for m in re.finditer(r"new\s+(\w+)\s*\(", src):
        cls = m.group(1)
        if cls not in arity:
            continue
        got = count_args(src, m.end())
        if got != arity[cls]:
            mismatched.append(
                f"{path.split('/')[-1]}: new {cls}(...) passes {got}, "
                f"constructor takes {arity[cls]}")

for x in sorted(set(mismatched)):
    print("  TEST ARITY      " + x)
print(f"  test call sites with the wrong argument count : {len(set(mismatched))}")

sys.exit(1 if undeclared or unassigned or mismatched else 0)
