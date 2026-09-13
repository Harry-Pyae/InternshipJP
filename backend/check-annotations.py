"""
Two annotation faults the parser cannot see.

javalang.parse accepts both of these as valid syntax. They fail at compile time
or, worse, at run time:

  1. The same non-repeatable annotation twice on one member. This happens when
     a method is inserted between an existing annotation and the method it
     belonged to - the annotation ends up on the new method and the old one is
     left bare. Two bugs from one edit: a compile error, and a method that
     silently lost its transaction.

  2. A public service method with no @Transactional. It compiles and usually
     works, because Spring Data wraps each repository call in its own
     transaction, but a read-then-write is then two units rather than one.
"""
import re, glob, sys

NON_REPEATABLE = ["Transactional", "Override", "Service", "Component",
                  "RestController", "Repository", "Configuration", "Bean"]

stacked, unannotated = [], []

for path in glob.glob("**/*.java", recursive=True):
    src = open(path, encoding="utf-8", errors="ignore").read().replace("\r\n", "\n")
    name = path.split("/")[-1]

    # --- 1. the same annotation twice in a row, ignoring javadoc between them
    lines = src.split("\n")
    seen = []
    for i, raw in enumerate(lines):
        line = raw.strip()
        if line.startswith("@"):
            ann = re.match(r"@(\w+)", line)
            if ann:
                seen.append((ann.group(1), i + 1))
        elif line.startswith(("*", "/*", "*/")) or not line:
            continue                      # javadoc does not end the run
        else:
            names = [a for a, _ in seen]
            for a in NON_REPEATABLE:
                if names.count(a) > 1:
                    stacked.append(f"{name}:{seen[0][1]} @{a} appears "
                                   f"{names.count(a)} times on one member")
            seen = []

    # --- 2. public service methods with no transaction
    # The glob is relative, so paths look like "service/AdminService.java" with
    # no leading slash. Matching on "/service/" examined nothing at all.
    parts = path.replace(chr(92), "/").split("/")
    if "service" in parts or "ai" in parts:
        for m in re.finditer(r"    public [\w<>,\[\]\s]+? (\w+)\(", src):
            head = src[max(0, m.start() - 500):m.start()]
            if "@Transactional" in head.split("}")[-1]:
                continue
            method = m.group(1)
            if method[0].isupper():        # a constructor, not a method
                continue
            unannotated.append(f"{name}: {method}()")

for s in sorted(set(stacked)):
    print("  STACKED      " + s)
print(f"\n  stacked annotations : {len(set(stacked))}")
print(f"  service methods with no @Transactional : {len(set(unannotated))}")
for u in sorted(set(unannotated))[:12]:
    print("    " + u)

sys.exit(1 if stacked else 0)
