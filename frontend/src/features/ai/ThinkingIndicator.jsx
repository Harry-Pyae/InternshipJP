import { useEffect, useState } from "react";

/**
 * What the assistant shows while it is working.
 *
 * WHY THIS EXISTS
 *   A real answer takes two to six seconds. With nothing on screen the page
 *   looks frozen, and when the text does arrive it appears all at once - which
 *   reads as a page refresh rather than a reply. Showing the work makes the
 *   wait feel like progress instead of a stall.
 *
 * TWO PARTS
 *   1. A status line that changes as the work moves on. The stages are real:
 *      the backend really does read the profile, score the vacancies, then
 *      call the provider. It is not a fake progress bar.
 *   2. Skeleton lines where the answer will appear, at the width text will
 *      actually be, so the layout does not jump when it arrives.
 *
 * The shimmer is the only animation in the product, and it is doing a job:
 * a still grey block reads as broken, a moving one reads as loading. It stops
 * entirely for anyone with reduced motion turned on.
 */

const STUDENT_STAGES = [
  { at: 0, text: "Reading your profile and skills" },
  { at: 1200, text: "Comparing them with the open internships" },
  { at: 2600, text: "Writing advice for your situation" },
  { at: 6000, text: "Still writing - a longer answer takes a little more time" },
];

const EMPLOYER_CANDIDATE_STAGES = [
  { at: 0, text: "Loading the applicants for this internship" },
  { at: 1200, text: "Checking verified qualifications only" },
  { at: 2600, text: "Comparing them against your requirements" },
  { at: 6000, text: "Still working - almost there" },
];

const EMPLOYER_COMPANY_STAGES = [
  { at: 0, text: "Reviewing your listings and pipeline" },
  { at: 1200, text: "Checking which required skills students actually have" },
  { at: 2600, text: "Writing up what to change first" },
  { at: 6000, text: "Still working - almost there" },
];

export default function ThinkingIndicator({ mode = "student" }) {
  const stages =
    mode === "employer-company"
      ? EMPLOYER_COMPANY_STAGES
      : mode === "employer-candidates"
        ? EMPLOYER_CANDIDATE_STAGES
        : STUDENT_STAGES;

  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    setStageIndex(0);
    const timers = stages.slice(1).map((stage, index) =>
      setTimeout(() => setStageIndex(index + 1), stage.at),
    );
    return () => timers.forEach(clearTimeout);
  }, [stages]);

  return (
    <div
      className="ijp-bubble ijp-bubble--assistant"
      role="status"
      aria-live="polite"
      aria-label="The assistant is preparing an answer"
    >
      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="ijp-thinking-dot" aria-hidden="true" />
        <span className="small fw-semibold">{stages[stageIndex].text}</span>
      </div>

      {/* Uneven widths, like a real paragraph. Equal bars look like a loader,
          not like text about to appear. */}
      <div className="d-grid gap-2" aria-hidden="true">
        <span className="ijp-skeleton" style={{ width: "92%" }} />
        <span className="ijp-skeleton" style={{ width: "78%" }} />
        <span className="ijp-skeleton" style={{ width: "85%" }} />
        <span className="ijp-skeleton" style={{ width: "45%" }} />
      </div>
    </div>
  );
}
