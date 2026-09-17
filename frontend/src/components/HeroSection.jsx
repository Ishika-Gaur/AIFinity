import Button from "./Button";

function ChalkVisual({ variant }) {
  const cream = "#F7F4EA";
  const gold = "#E8C547";
  const line = { fill: "none", stroke: cream, strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.8 };

  if (variant === "home") {
    const rows = [
      { icon: "target", head: "Understand", sub: "what you know" },
      { icon: "search", head: "Uncover", sub: "what you're missing" },
      { icon: "map", head: "Follow", sub: "your personalized path" },
      { icon: "check", head: "Become", sub: "job-ready" },
    ];
    const rowY = [95, 185, 275, 365];

    return (
      <svg className="hs-visual" viewBox="0 0 460 460" aria-hidden="true">
        <circle cx="240" cy="230" r="205" fill="none" stroke={cream} strokeWidth="2" opacity="0.75" />

        <path
          d="M382 108l30-12-6 30z"
          fill="none"
          stroke={gold}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M300 22l4 11 11 2-9 8 2 11-11-6-11 6 2-11-9-8 11-2z"
          fill="none"
          stroke={cream}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M424 388l4 11 11 2-9 8 2 11-11-6-11 6 2-11-9-8 11-2z"
          fill="none"
          stroke={gold}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {rows.map((row, i) => {
          const y = rowY[i];
          return (
            <g key={row.head}>
              <g transform={`translate(75 ${y - 16})`} stroke={i === rows.length - 1 ? gold : cream} strokeWidth="2" fill="none">
                {row.icon === "target" && (
                  <>
                    <circle cx="14" cy="14" r="13" />
                    <circle cx="14" cy="14" r="6.5" />
                    <path d="M14 14l13-13" strokeLinecap="round" />
                    <path d="M27 1l-3 1 2 2z" fill={gold} stroke="none" />
                  </>
                )}
                {row.icon === "search" && (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M19.5 19.5L28 28" strokeLinecap="round" />
                  </>
                )}
                {row.icon === "map" && (
                  <>
                    <path d="M2 6l9-4 8 4 9-4v22l-9 4-8-4-9 4z" strokeLinejoin="round" />
                    <path d="M11 2v22M19 6v22" opacity="0.6" />
                  </>
                )}
                {row.icon === "check" && (
                  <>
                    <circle cx="14" cy="14" r="13" />
                    <path d="M8 14l4.5 4.5L21 9" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
              </g>

              <text x="130" y={y - 2} fill={gold} fontSize="21" fontFamily="Kalam" fontStyle="italic">
                {row.head}
              </text>
              <text x="130" y={y + 24} fill={cream} fontSize="16" fontFamily="Kalam" fontStyle="italic" opacity="0.85">
                {row.sub}
              </text>

              {i < rows.length - 1 && (
                <path d={`M75 ${y + 46}h235`} stroke={cream} strokeWidth="1" opacity="0.2" />
              )}
            </g>
          );
        })}
      </svg>
    );
  }
  if (variant === "concept-root") return <svg className="hs-visual" viewBox="0 0 340 180" aria-hidden="true"><text x="170" y="20" textAnchor="middle" fill={cream} fontSize="14" fontFamily="Kalam">surface mistake</text><circle cx="170" cy="38" r="6" fill={gold}/><path {...line} d="M170 45v28m0 0c-22 18-48 14-70 43m70-43c22 18 48 14 70 43m-140 0c-14 17-28 19-43 37m43-37c13 17 28 19 42 37m98-37c-13 17-28 19-42 37m42-37c14 17 28 19 43 37"/><text x="170" y="175" textAnchor="middle" fill={gold} fontSize="15" fontFamily="Kalam">root concepts</text></svg>;
  if (variant === "mistake-map") return <svg className="hs-visual" viewBox="0 0 380 210" aria-hidden="true"><path d="M323 36l18 18m0-18l-18 18" stroke={cream} strokeWidth="4" strokeLinecap="round"/><text x="332" y="82" textAnchor="middle" fill={cream} fontSize="13" fontFamily="Kalam">wrong answer</text><path d="M320 66c-37 18-12 55-65 57s-55-43-104 2-46 46-81 32" fill="none" stroke={gold} strokeWidth="3" strokeLinecap="round" strokeDasharray="3 7"/><circle cx="255" cy="123" r="6" fill={cream}/><circle cx="151" cy="125" r="6" fill={cream}/><circle cx="70" cy="157" r="11" fill="none" stroke={gold} strokeWidth="3"/><text x="70" y="194" textAnchor="middle" fill={gold} fontSize="15" fontFamily="Kalam">root cause</text></svg>;
  if (variant === "skill-gap") {
    return (
      <svg className="hs-visual" viewBox="0 0 320 440" aria-hidden="true">
        <path d="M160 40v360" fill="none" stroke={cream} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M160 400v-180" fill="none" stroke={gold} strokeWidth="6" strokeLinecap="round" />

        {[400, 310, 220, 130, 40].map((y) => (
          <circle key={y} cx="160" cy={y} r="5.5" fill={cream} />
        ))}

        <circle cx="160" cy="220" r="12" fill={gold} />
        <path d="M178 220h46" stroke={gold} strokeWidth="2" strokeLinecap="round" />
        <text x="230" y="216" fill={gold} fontSize="19" fontFamily="Kalam" fontStyle="italic">You are</text>
        <text x="230" y="240" fill={gold} fontSize="19" fontFamily="Kalam" fontStyle="italic">here</text>

        <text x="182" y="406" fill={cream} fontSize="15" fontFamily="Space Mono" opacity="0.9">CURRENT</text>
        <text x="182" y="46" fill={cream} fontSize="15" fontFamily="Space Mono" opacity="0.9">TARGET</text>
        <text x="30" y="310" fill={cream} fontSize="14" fontFamily="Space Mono" opacity="0.6">skill</text>
        <text x="30" y="330" fill={cream} fontSize="14" fontFamily="Space Mono" opacity="0.6">gap</text>

        <path
          d="M300 22l4 11 11 2-9 8 2 11-11-6-11 6 2-11-9-8 11-2z"
          fill="none"
          stroke={gold}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M40 60l24-14" stroke={cream} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M32 76l20-4" stroke={cream} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }
  if (variant === "roadmap") {
    return (
      <svg className="hs-visual hs-roadmap-visual" viewBox="0 0 320 460" aria-hidden="true">
        <path
          d="M62 412C130 380 168 366 232 342C168 322 96 306 72 262C128 232 196 202 242 172C190 142 132 112 112 62"
          fill="none"
          stroke={gold}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="3 8"
        />

        <g fill="#24413A" stroke={cream} strokeWidth="2">
          <circle cx="62" cy="412" r="10" />
          <circle cx="232" cy="342" r="10" />
          <circle cx="72" cy="262" r="10" />
          <circle cx="242" cy="172" r="10" />
          <circle cx="112" cy="62" r="11" stroke={gold} />
        </g>

        <g fill={cream} fontSize="15" fontFamily="Kalam" fontStyle="italic">
          <text x="82" y="418">Start</text>
          <text x="192" y="326" textAnchor="end">Skills</text>
          <text x="92" y="268">Projects</text>
          <text x="202" y="150" textAnchor="end">Mastery</text>
        </g>
        <text x="112" y="26" textAnchor="middle" fill={gold} fontSize="17" fontFamily="Kalam" fontStyle="italic">Job Ready</text>
      </svg>
    );
  }
  if (variant === "about") return <svg className="hs-visual" viewBox="0 0 420 190" aria-hidden="true"><text x="12" y="86" fill={gold} fontSize="88" fontFamily="Kalam">"</text><path d="M104 105c44-32 86 30 139 0s88-20 145 0" {...line}/><circle cx="104" cy="105" r="5" fill={cream}/><circle cx="243" cy="105" r="5" fill={gold}/><circle cx="388" cy="105" r="5" fill={cream}/><g fill={cream} fontSize="11" fontFamily="Space Mono"><text x="79" y="140">MISTAKE</text><text x="218" y="140">INSIGHT</text><text x="360" y="140">GROWTH</text></g><text x="58" y="178" fill={gold} fontSize="15" fontFamily="Kalam">Learning reveals the missing piece.</text></svg>;
  return <svg className="hs-visual" viewBox="0 0 340 180" aria-hidden="true"><path d="M77 130a75 75 0 1 1 134 8" {...line} strokeWidth="3"/><path d="M84 130a68 68 0 0 1 93-71" fill="none" stroke={gold} strokeWidth="3"/><circle cx="77" cy="130" r="9" fill={gold}/><path d="M69 130H45m12-12v24" stroke={gold} strokeWidth="2"/><text x="170" y="166" textAnchor="middle" fill={cream} fontSize="16" fontFamily="Kalam">start your journey</text></svg>;
}

export default function HeroSection({
  eyebrow,
  title,
  highlightWord,
  description,
  primaryCta,
  secondaryCta,
  stats = [],
  variant = "default",
  visual,
  visualPosition = "right",
}) {
  const hasCustomVisual = Boolean(visual);
  const showAnyVisual = hasCustomVisual || variant !== "default";

  return (
    <section
      className={`hs-classroom hs-${variant} relative overflow-hidden py-20 sm:py-24 lg:py-28`}
      style={{
        "--color-primary-50": "rgba(232, 197, 71, 0.14)",
        "--color-primary-600": "#D9A62B",
        "--color-primary-700": "#B9860F",
        "--color-border": "rgba(247, 244, 234, 0.16)",
        "--color-border-strong": "rgba(247, 244, 234, 0.34)",
        "--color-text-h": "#F7F4EA",
        "--color-text-muted": "rgba(247, 244, 234, 0.78)",
        "--color-text-light": "rgba(247, 244, 234, 0.58)",
        "--font-display": "'Kalam', cursive",
        "--font-mono": "'Space Mono', monospace",
        background:
          "radial-gradient(ellipse 70% 55% at 50% 38%, #2E4F42 0%, #24413A 55%, #1B332C 100%)",
        borderBottom: "1px solid rgba(247, 244, 234, 0.12)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Space+Mono:wght@400;700&display=swap');

        .hs-classroom {
          --dust: rgba(247, 244, 234, 0.5);
        }

        .hs-classroom .hs-grid {
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, rgba(247,244,234,0.05) 0px, rgba(247,244,234,0.05) 1px, transparent 1px, transparent 48px),
            repeating-linear-gradient(90deg, rgba(247,244,234,0.05) 0px, rgba(247,244,234,0.05) 1px, transparent 1px, transparent 48px);
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 90%);
          pointer-events: none;
        }

        .hs-classroom .hs-eyebrow {
          transform: rotate(-2deg);
          box-shadow: 0 3px 0 rgba(0,0,0,0.15), 0 6px 10px rgba(0,0,0,0.25);
        }
        .hs-classroom .hs-eyebrow::before {
          content: "";
          position: absolute;
          left: 10px;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: rgba(247,244,234,0.5);
          transform: translateY(-50%);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2);
        }

        .hs-classroom .hs-underline {
          position: absolute;
          left: -2%;
          right: -2%;
          bottom: -0.1em;
          height: 0.5em;
          width: 104%;
        }

        .hs-classroom .hs-card {
          background: #FBF8F0;
          background-image: repeating-linear-gradient(
            180deg,
            transparent 0px,
            transparent 21px,
            rgba(122, 156, 198, 0.25) 22px
          );
          box-shadow: 0 6px 0 rgba(0,0,0,0.12), 0 10px 16px rgba(0,0,0,0.28);
        }
        .hs-classroom .hs-card::before {
          content: "";
          position: absolute;
          top: -6px;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #C1443C;
          box-shadow: 0 1px 2px rgba(0,0,0,0.4);
          transform: translateX(-50%);
        }
        .hs-classroom .hs-card:nth-child(odd) { transform: rotate(-2.5deg); }
        .hs-classroom .hs-card:nth-child(even) { transform: rotate(2deg); }
        .hs-classroom .hs-card:hover { transform: rotate(0deg) translateY(-2px); }
        .hs-classroom .hs-card { transition: transform 0.2s ease; }

        .hs-classroom .hs-tray {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 14px;
          background: linear-gradient(180deg, #B98A5E 0%, #8B5A3C 100%);
          box-shadow: 0 -2px 8px rgba(0,0,0,0.25) inset;
        }
        .hs-classroom .hs-dust {
          position: absolute;
          bottom: 12px;
          border-radius: 999px;
          background: var(--dust);
          opacity: 0;
          animation: hs-fall 5s ease-in infinite;
        }
        .hs-classroom .hs-visual { width: min(100%, 460px); height: auto; flex: 0 1 460px; }
        .hs-classroom .hs-visual-wrap { flex: 0 1 460px; width: min(100%, 460px); position: relative; }

        .hs-classroom.hs-about .hs-main,
        .hs-classroom.hs-mistake-map .hs-main,
        .hs-classroom.hs-concept-root .hs-main,
        .hs-classroom.hs-skill-gap .hs-main,
        .hs-classroom.hs-roadmap .hs-main,
        .hs-classroom.hs-home .hs-main {
          max-width: 78rem;
          flex-direction: row;
          justify-content: space-between;
          gap: 3rem;
          text-align: left;
        }
        .hs-classroom.hs-about .hs-copy,
        .hs-classroom.hs-mistake-map .hs-copy,
        .hs-classroom.hs-concept-root .hs-copy,
        .hs-classroom.hs-skill-gap .hs-copy,
        .hs-classroom.hs-roadmap .hs-copy,
        .hs-classroom.hs-home .hs-copy {
          align-items: flex-start;
          text-align: left;
        }
        .hs-classroom.hs-about .hs-actions,
        .hs-classroom.hs-mistake-map .hs-actions,
        .hs-classroom.hs-concept-root .hs-actions,
        .hs-classroom.hs-skill-gap .hs-actions,
        .hs-classroom.hs-roadmap .hs-actions,
        .hs-classroom.hs-home .hs-actions {
          justify-content: flex-start;
        }

        .hs-classroom.hs-skill-gap .hs-visual-wrap { flex-basis: 340px; width: min(100%, 340px); }
        .hs-classroom.hs-roadmap .hs-visual-wrap { flex-basis: 340px; width: min(100%, 340px); }
        .hs-classroom.hs-roadmap .hs-roadmap-visual { width: 100%; height: auto; }

        @media (max-width: 1023px) {
          .hs-classroom.hs-about .hs-main,
          .hs-classroom.hs-mistake-map .hs-main,
          .hs-classroom.hs-concept-root .hs-main,
          .hs-classroom.hs-skill-gap .hs-main,
          .hs-classroom.hs-roadmap .hs-main,
          .hs-classroom.hs-home .hs-main {
            flex-direction: column;
            text-align: center;
          }
          .hs-classroom.hs-about .hs-copy,
          .hs-classroom.hs-mistake-map .hs-copy,
          .hs-classroom.hs-concept-root .hs-copy,
          .hs-classroom.hs-skill-gap .hs-copy,
          .hs-classroom.hs-roadmap .hs-copy,
          .hs-classroom.hs-home .hs-copy {
            align-items: center;
            text-align: center;
          }
          .hs-classroom.hs-about .hs-actions,
          .hs-classroom.hs-mistake-map .hs-actions,
          .hs-classroom.hs-concept-root .hs-actions,
          .hs-classroom.hs-skill-gap .hs-actions,
          .hs-classroom.hs-roadmap .hs-actions,
          .hs-classroom.hs-home .hs-actions {
            justify-content: center;
          }
          .hs-classroom.hs-skill-gap .hs-visual-wrap { width: min(100%, 460px); margin-top: 8px; }
          .hs-classroom.hs-roadmap .hs-visual-wrap { width: min(100%, 460px); margin-top: 8px; }
          .hs-classroom.hs-home .hs-visual-wrap { order: 1 !important; width: 100%; }
          .hs-classroom.hs-home .hs-copy { order: 2 !important; }
        }

        @keyframes hs-fall {
          0% { opacity: 0; transform: translateY(0); }
          10% { opacity: 0.6; }
          90% { opacity: 0.15; }
          100% { opacity: 0; transform: translateY(-26px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hs-classroom .hs-dust { animation: none; opacity: 0.2; }
        }
      `}</style>

      <div className="hs-grid" />

      <div className="hs-main relative mx-auto flex max-w-4xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <div
          className="hs-copy flex flex-col items-center gap-6 text-center"
          style={
            hasCustomVisual
              ? { order: visualPosition === "left" ? 2 : 1 }
              : undefined
          }
        >
          {eyebrow && variant === "home" && (
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 34 40" className="h-9 w-8 shrink-0" aria-hidden="true">
                <path d="M17 2v11" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 9l8 8" stroke="#F7F4EA" strokeWidth="2" strokeLinecap="round" />
                <path d="M30 9l-8 8" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" />
                <path d="M1 22l9 3" stroke="#F7F4EA" strokeWidth="2" strokeLinecap="round" />
                <path d="M33 22l-9 3" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" />
              </svg>

              <div className="leading-tight">
                <div style={{ fontFamily: "var(--font-display)", color: "#E8C547", fontWeight: 700, fontSize: "1.05rem" }}>
                  {eyebrow.split("|")[0] || eyebrow}
                </div>
                {eyebrow.split("|")[1] && (
                  <div style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)", fontWeight: 700, fontSize: "1.05rem" }}>
                    {eyebrow.split("|")[1]}
                  </div>
                )}
              </div>

              <svg viewBox="0 0 40 30" className="h-7 w-9 shrink-0 self-end" aria-hidden="true">
                <path d="M2 4c14 0 22 8 20 20" fill="none" stroke="#F7F4EA" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                <path d="M14 20l8 4-2-9" fill="none" stroke="#F7F4EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
              </svg>
            </div>
          )}

          {eyebrow && variant !== "home" && (
            <div
              className="hs-eyebrow relative inline-flex items-center gap-2 rounded-sm border border-dashed px-5 py-1.5 pl-7 text-xs font-bold uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-mono)",
                borderColor: "var(--color-border-strong)",
                background: "#FBF8F0",
                color: "#3D2E1F",
              }}
            >
              {eyebrow}
            </div>
          )}

          <h1
            className="max-w-3xl text-4xl font-bold tracking-normal sm:text-5xl lg:text-6xl lg:leading-[1.15]"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}
          >
            {title}{" "}
            {highlightWord && (
              <span className="relative inline-block" style={{ color: "#E8C547" }}>
                {highlightWord}
                <svg
                  className="hs-underline"
                  viewBox="0 0 200 16"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9 C 40 14, 80 2, 120 8 S 180 13, 198 6"
                    fill="none"
                    stroke="#E8C547"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </svg>
              </span>
            )}
          </h1>

          {description && (
            <p
              className="max-w-2xl text-base leading-7 sm:text-lg"
              style={{ color: "var(--color-text-muted)" }}
            >
              {description}
            </p>
          )}

          {(primaryCta || secondaryCta) && (
            <div className="hs-actions flex flex-wrap justify-center gap-3.5 pt-2">
              {primaryCta && (
                <Button
                  as={primaryCta.onClick ? "button" : (primaryCta.as || (primaryCta.href ? "a" : "button"))}
                  href={primaryCta.onClick ? undefined : primaryCta.href}
                  onClick={primaryCta.onClick}
                  size="lg"
                >
                  {primaryCta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  as={secondaryCta.onClick ? "button" : (secondaryCta.as || (secondaryCta.href ? "a" : "button"))}
                  href={secondaryCta.onClick ? undefined : secondaryCta.href}
                  onClick={secondaryCta.onClick}
                  variant="outline"
                  size="lg"
                >
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          )}

          {stats.length > 0 && (
            <div
              className="mt-10 grid w-full max-w-xl gap-6 pt-4"
              style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="hs-card relative flex flex-col items-center gap-0.5 rounded-sm px-3 py-4"
                >
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)", color: "#2E4F42" }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-mono)", color: "#6B6152" }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAnyVisual && (
          <div
            className="hs-visual-wrap"
            style={hasCustomVisual ? { order: visualPosition === "left" ? 1 : 2 } : undefined}
          >
            {hasCustomVisual ? visual : <ChalkVisual variant={variant} />}
          </div>
        )}
      </div>

      <div className="hs-tray" aria-hidden="true" />
      <span className="hs-dust" style={{ left: "18%", width: 3, height: 3, animationDelay: "0s" }} aria-hidden="true" />
      <span className="hs-dust" style={{ left: "34%", width: 2, height: 2, animationDelay: "1.4s" }} aria-hidden="true" />
      <span className="hs-dust" style={{ left: "58%", width: 3, height: 3, animationDelay: "2.6s" }} aria-hidden="true" />
      <span className="hs-dust" style={{ left: "76%", width: 2, height: 2, animationDelay: "0.8s" }} aria-hidden="true" />
    </section>
  );
}