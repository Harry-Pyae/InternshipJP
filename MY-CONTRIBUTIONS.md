# My contribution — Member 1

InternshipJP · CST-6108 · Third Year, Section B, Semester VI
University of Information Technology · Supervisor: Dr. Ei Moh Moh Aung

---

## What my role was

The other three members each own a vertical slice — authentication and the
student module, the employer module, the administration module. Mine is
horizontal. I own the parts every slice sits on, and the work of making three
separately built modules behave as one application.

That means I wrote less of any single screen than they did, and more of what
holds the screens together. The sections below describe areas I was responsible
for rather than lines I typed.

---

## 1. The database

Eleven Flyway migrations defining twenty-one tables. Every schema change in the
project went through me, and the version history doubles as a record of who
needed what and when.

Two decisions I would defend:

**Status columns are `VARCHAR`, never MariaDB `ENUM`.** A Java enum can gain a
value with no migration; a database enum cannot. When `FILLED` finally needed
setting, it was already in the Java enum and the column took it without a
schema change.

**An applied migration is never edited.** V9, V10 and V11 were added late — an
`application_skills` table and a `reference_id` column — and both are purely
additive, so neither can fail on a database that already holds data. That is
not an accident; it is why they were shaped that way.

## 2. The shared component layer

Twenty-seven components under `components/shared`. The test of whether this layer
works is whether a change made once appears everywhere, and it does: the themed
confirmation dialog replaced the last browser `window.confirm` in the project,
and three screens changed at once.

`Avatar` is the one worth describing. It fetches a photo through the API client
rather than an `<img src>`, because the API is a different origin in
development and a plain image request carries no session cookie. It caches per
user, shares a request when four rows ask for the same person in the same tick,
and notifies every mounted copy when a photo changes, so the sidebar, the menu
and the table row all update together.

## 3. English and Burmese

1,122 strings, no i18n library. A React context resolves `t()` through a table
keyed on the **English source string**, so a missing translation falls back to
readable English rather than showing `nav.faq`.

Three things made this harder than a table of strings:

- **A sentence with a number in it cannot be built by concatenation.** English
  puts the number before the noun and Burmese does not, so `t()` takes
  parameters and substitutes into placeholders, keeping the sentence whole.
- **Text composed on the server cannot be translated in the browser.** The
  workload report, the company review and the skill-gap analysis take a
  `language` parameter and compose Burmese at source, and the chat assistant is
  told which language to answer in. Notification bodies and server error
  messages are still written in English; closing that gap means composing them
  per recipient's language, which the notification table does not record.
- **A string can reach the screen without passing through `t()`.** Shared
  components that display a message they are handed - the error alert, the
  confirmation dialog, pagination - now translate it themselves, and dates and
  relative times follow the interface language rather than the browser's. The
  check that found the gaps parses the source rather than searching it, so a
  label inside a ternary is traced to where it is shown.
- **The language must be selectable before signing in**, so the toggle is on
  the authentication screens too. Somebody who reads Burmese should not have to
  get through an English login first.

Certificate titles, company names and covering letters are never translated.
They are somebody's own words.

## 4. Matching and analysis

Four features compute from the platform's own database and make no external
call: recommendations, skill gaps, company insight, and the administrator
workload report. I verified this rather than assumed it — all five analysis
services construct zero HTTP clients.

The scoring uses only the skills an employer required and the skills a student
recorded:

```java
matched * 100 / requiredSkills.size()
```

Institution, connections, graduation year and profile activity are not weighted
zero. **They are not parameters.** The function cannot see them. Every score
arrives with the skills matched and the skills missing, so a student who
disagrees has something specific to correct.

## 5. Integration — the work that has no screen

This is the part that is hardest to show and took the most time.

**Cross-origin sessions.** React on 5173, Spring on 8080. `withCredentials`
sends the cookie; `withXSRFToken` attaches the CSRF header, which since Axios
1.6.2 is not automatic across origins. Without that one flag every POST, PUT
and DELETE in the application returns 403.

**Ownership on the record, not just the role.** Repository finders take the
record id and the caller's id together — `findByIdAndStudentProfileId`. Role
says what kind of thing you may do; ownership says which rows. A missing check
here is not a broken page, it is somebody reading another person's documents.

**Faults that crossed module boundaries.** Several came from the seams rather
than from any one member's code: an applicant's skills read live instead of as
sent, a notification type emitted by one module with no route in another, a
file endpoint whose permission was written and never exposed. Finding those was
the job.

## 6. Messages, and the difference between a notice and a conversation

Two things that look alike and are not.

**An application carries a conversation.** `application_messages` keeps what an
employer and a student said to each other, beside the application it concerns.
Both sides read it in order, aligned so that whoever is looking is on the right
— the convention every chat uses.

Messages were notifications before that, and a notification belongs to one
recipient, so each side held only half the exchange and neither could read it
back. That was the fault worth finding: the feature existed at both ends and
the content was never stored anywhere.

**An administrator issues a notice.** One way, arriving under Account with no
reply channel — because a warning about conduct is an instruction, and giving
it a reply channel would create a conversation between somebody with authority
and somebody without.

The distinction is deliberate and it is the answer to "why not just build
messaging": the two need different shapes, and collapsing them would have made
the wrong one available to the wrong people.

## 7. Testing and tooling

102 test methods across 15 classes. The tests that matter are the ones that pin
a decision rather than a value — `aPasswordMeetingEveryClassRuleCanStillBeRefused`
exists so that nobody later concludes the denylist is redundant.

**And the worst one I found was the twelve that never ran.** The tests needing a
real database are tagged `requires-db`, and the build excluded that tag in the
surefire block. Surefire applies includes and excludes together, so
`mvn test -Dgroups=requires-db` - the command written at the top of every one of
those files - asked for the intersection of an include and an exclude, ran
nothing, and printed `Tests run: 0` followed by `BUILD SUCCESS`. Selecting a
group now clears the exclusion. Two of the twelve failed the moment they could
run: they registered with `password123`, which the denylist had started refusing
by name months earlier.

That is the same fault as the three check scripts below, arriving by a different
route, and it is the reason the habit is worth more than any one of them: **a
green result means nothing until you have watched it go red.**

Four check scripts, each written after a fault that had already cost a day:

```
check-annotations.py     stacked @Transactional  — a compile error, and worse,
                         an annotation silently lost from the method below
check-wiring.py          a field used and assigned but never declared; a test
                         calling a constructor whose arity changed
check-lambda-capture.py  a reassigned local captured by a lambda — valid to the
                         parser, rejected by the compiler
check-styles.py          a CSS declaration overridden by a later one, and a
                         class used in markup with no rule behind it
```

**The most useful thing I learned on this project is in those scripts.** Three
of them reported success while standing on ground they never examined — one had
a path filter matching zero files, one compared declared fields to assignments
so an undeclared field appeared in neither set, and none of them looked at
`src/test` at all. Each looked correct and could not fail.

The habit that catches it is simple and I now apply it every time: **feed the
check the known bug before trusting the zero.** A check that cannot fail is
worse than no check, because it is believed.

---

## What I would do differently

**I would write the checks before the faults, not after.** Every one of the
four exists because something broke first. Three of them would have caught
their own fault on the day it was introduced rather than a week later.

**I would have questioned the stored values earlier.** `availablePositions` was
written to the database and read back for months before anything counted
against it. The same was true of `photo_path`, of `logo_path`, and of
`FILLED` — all present, none used. A field that nothing reads is a feature
nobody has finished, and the schema does not say which.

The final pass found four more of exactly this shape, and the last one is the
one I should have caught first:

- **`issuing_organization`** was read on four screens and written by nothing.
  The administrator's certificate queue had a column for it, and a search that
  matched on it, and it said “not given” for every certificate ever
  uploaded, because the upload form had no box for it. The one fact an
  administrator checks a document against was the fact we never asked for.
- **`issue_date`** the same, down to a helper written for it alone,
  `certificateAge()`, which had nothing to work on outside demo data.
- **`WITHDRAWN`** was in the enum, in the column comment, in the status badge
  and in the employer's transition table. No code path could produce it, so a
  student who took another offer could only leave the application sitting in
  somebody's queue.
- **`internship_skills`** was written by the demo seeder and by nothing else.
  This is the one that matters, because it is not a field on a form: it is the
  whole input to the matching. The score is `matched * 100 /
  requiredSkills.size()`, the skill-gap report counts demand across it, and
  the company review reads it. Four features, all of them the ones this
  project is about, worked on seeded rows and would have returned nothing for
  a real employer — whose own posting form told them to list three to five
  skills and then gave them nowhere to type one.

The demo data is what hid it. Every screen was checked against a database the
seeder had filled, so the seeder was quietly standing in for a feature. That is
the same failure as a check that cannot fail: something was green because it
was never really asked.

---

## Figures

```
Backend      206 main Java files, 15 test classes, 102 test methods
             97 endpoints, 21 repositories, 64 DTOs
             11 Flyway migrations, 21 tables
Frontend     94 React modules, 27 shared components, 56 routes
Bilingual    1,122 Burmese strings, none missing on the user-facing pages
             (developer diagnostics are English only)
Tooling      4 check scripts
```

Every figure counted from the code rather than recalled - which is how the
test count moved. It was 100, and twelve of those could not be run.
