"""
Locals that are reassigned and then captured by a lambda.

Java requires a captured local to be final or effectively final. Reassigning it
- very often by `x = repository.save(x)` - and then using it inside a lambda
later in the same method is a compile error:

    local variables referenced from a lambda expression must be final or
    effectively final

The parser accepts the file, because this is a semantic rule rather than a
syntax one. Maven rejects it. Without a JDK and the dependency jars there is no
way to compile here, so this walks the real AST instead of guessing with a
regular expression.

A first attempt at this did use regular expressions and reported 36 findings on
code that compiles cleanly. A check that cries wolf is as useless as one that
cannot fail, so it was thrown away rather than tuned.
"""
import glob
import sys

import javalang


def names_in(node):
    """Every identifier mentioned anywhere under this node."""
    found = set()
    for _, child in node:
        member = getattr(child, "member", None)
        if isinstance(member, str):
            found.add(member)
        qualifier = getattr(child, "qualifier", None)
        if isinstance(qualifier, str) and qualifier:
            found.add(qualifier.split(".")[0])
        name = getattr(child, "name", None)
        if isinstance(name, str):
            found.add(name)
    return found


findings = []

for path in sorted(glob.glob("**/*.java", recursive=True)):
    source = open(path, encoding="utf-8", errors="ignore").read()
    try:
        tree = javalang.parse.parse(source)
    except Exception:
        continue
    filename = path.replace("\\", "/").split("/")[-1]

    for _, method in tree.filter(javalang.tree.MethodDeclaration):
        if not method.body:
            continue

        # Locals AND parameters. The rule applies to both, and a reassigned
        # parameter is the more common way to hit it: `user = repo.save(user)`
        # at the top of a method, then a lambda further down. Leaving
        # parameters out made this check miss the exact fault it was written
        # for, which is why it is worth saying so here.
        declared = {parameter.name for parameter in (method.parameters or [])}
        for _, decl in method.filter(javalang.tree.LocalVariableDeclaration):
            for declarator in decl.declarators:
                declared.add(declarator.name)

        reassigned = set()
        for _, assignment in method.filter(javalang.tree.Assignment):
            target = assignment.expressionl
            target_name = getattr(target, "member", None) or getattr(target, "name", None)
            # `this.x = ...` is a field, not a local, and is not captured.
            qualifier = getattr(target, "qualifier", None)
            if qualifier:
                continue
            if target_name in declared:
                reassigned.add(target_name)

        if not reassigned:
            continue

        for _, lambda_expression in method.filter(javalang.tree.LambdaExpression):
            captured = names_in(lambda_expression) & reassigned
            # A lambda parameter shadows the outer name, so it is not a capture.
            parameters = {
                getattr(parameter, "member", None) or getattr(parameter, "name", None)
                for parameter in (lambda_expression.parameters or [])
            }
            for name in sorted(captured - parameters):
                findings.append(
                    f"{filename}: {method.name}() reassigns {name} and a lambda "
                    f"captures it")

for finding in sorted(set(findings)):
    print("  NOT FINAL       " + finding)

print(f"\n  lambdas capturing a reassigned local : {len(set(findings))}")

sys.exit(1 if findings else 0)
