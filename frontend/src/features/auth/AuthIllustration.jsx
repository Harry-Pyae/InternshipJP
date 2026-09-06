/**
 * The artwork beside the sign-in form.
 */
export default function AuthIllustration() {
  return (
    <svg
      viewBox="0 0 420 320"
      className="ijp-auth-art"
      role="presentation"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* soft backdrop */}
      <circle cx="210" cy="160" r="150" fill="var(--ijp-signal-soft)" />

      {/* main panel - a list of vacancies */}
      <rect x="70" y="58" width="230" height="190" rx="14"
            fill="var(--ijp-surface)" stroke="var(--ijp-border-strong)" strokeWidth="2" />
      <rect x="70" y="58" width="230" height="34" rx="14" fill="var(--ijp-surface-sunken)" />
      <rect x="70" y="80" width="230" height="12" fill="var(--ijp-surface-sunken)" />
      <circle cx="88" cy="75" r="4" fill="var(--ijp-rejected)" opacity="0.7" />
      <circle cx="102" cy="75" r="4" fill="var(--ijp-pending)" opacity="0.7" />
      <circle cx="116" cy="75" r="4" fill="var(--ijp-verified)" opacity="0.7" />

      {/* three vacancy rows, each with a state rail like the real UI */}
      <g>
        <rect x="86" y="106" width="198" height="40" rx="8" fill="var(--ijp-surface-sunken)" />
        <rect x="86" y="106" width="3" height="40" rx="2" fill="var(--ijp-verified)" />
        <rect x="100" y="116" width="96" height="8" rx="4" fill="var(--ijp-border-strong)" />
        <rect x="100" y="130" width="60" height="6" rx="3" fill="var(--ijp-border)" />
        <rect x="238" y="120" width="34" height="12" rx="6" fill="var(--ijp-verified)" opacity="0.25" />
      </g>
      <g>
        <rect x="86" y="154" width="198" height="40" rx="8" fill="var(--ijp-surface-sunken)" />
        <rect x="86" y="154" width="3" height="40" rx="2" fill="var(--ijp-signal)" />
        <rect x="100" y="164" width="118" height="8" rx="4" fill="var(--ijp-border-strong)" />
        <rect x="100" y="178" width="48" height="6" rx="3" fill="var(--ijp-border)" />
        <rect x="238" y="168" width="34" height="12" rx="6" fill="var(--ijp-signal)" opacity="0.25" />
      </g>
      <g>
        <rect x="86" y="202" width="198" height="34" rx="8" fill="var(--ijp-surface-sunken)" />
        <rect x="86" y="202" width="3" height="34" rx="2" fill="var(--ijp-pending)" />
        <rect x="100" y="212" width="80" height="8" rx="4" fill="var(--ijp-border-strong)" />
        <rect x="100" y="224" width="54" height="6" rx="3" fill="var(--ijp-border)" />
      </g>

      {/* the match score, the idea the whole product turns on */}
      <g>
        <circle cx="330" cy="96" r="40" fill="var(--ijp-surface)"
                stroke="var(--ijp-border-strong)" strokeWidth="2" />
        <circle cx="330" cy="96" r="30" fill="none" stroke="var(--ijp-border)" strokeWidth="7" />
        <circle cx="330" cy="96" r="30" fill="none" stroke="var(--ijp-signal)" strokeWidth="7"
                strokeLinecap="round" strokeDasharray="188.5"
                strokeDashoffset="66" transform="rotate(-90 330 96)" />
        <text x="330" y="102" textAnchor="middle"
              fill="var(--ijp-ink)" fontSize="18" fontWeight="600"
              fontFamily="IBM Plex Mono, monospace">65%</text>
      </g>

      {/* verified badge - only verified evidence reaches employers */}
      <g transform="translate(292 196)">
        <circle cx="26" cy="26" r="26" fill="var(--ijp-verified)" opacity="0.16" />
        <circle cx="26" cy="26" r="18" fill="var(--ijp-surface)"
                stroke="var(--ijp-verified)" strokeWidth="2" />
        <path d="M18 26.5 L23.5 32 L34 21" fill="none" stroke="var(--ijp-verified)"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* magnifier over the list */}
      <g transform="translate(40 178)">
        <circle cx="30" cy="30" r="22" fill="var(--ijp-surface)"
                stroke="var(--ijp-signal)" strokeWidth="3" opacity="0.95" />
        <line x1="46" y1="46" x2="62" y2="62" stroke="var(--ijp-signal)"
              strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
