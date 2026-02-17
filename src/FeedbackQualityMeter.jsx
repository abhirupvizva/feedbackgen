// FeedbackQualityMeter.jsx
const qualityMap = {
  "Very Bad": {
    level: 1,
    label: "Very Bad",
    from: "from-red-500",
    to: "to-red-700",
    ring: "ring-red-200",
    text: "text-red-700",
    dot: "bg-red-600",
  },
  Bad: {
    level: 2,
    label: "Bad",
    from: "from-orange-400",
    to: "to-oranage-600",
    ring: "ring-orange-200",
    text: "text-orange-600",
    dot: "bg-orange-500",
  },
  Neutral: {
    level: 3,
    label: "Neutral",
    from: "from-amber-400",
    to: "to-amber-600",
    ring: "ring-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  Good: {
    level: 4,
    label: "Good",
    from: "from-emerald-400",
    to: "to-emerald-600",
    ring: "ring-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  "Very Good": {
    level: 5,
    label: "Very Good",
    from: "from-green-500",
    to: "to-green-700",
    ring: "ring-green-200",
    text: "text-green-700",
    dot: "bg-green-600",
  },
};

export default function FeedbackQualityMeter({ quality }) {
  const maxLevel = 5;
  const info = qualityMap[quality] || qualityMap["Neutral"];

  return (
    <div className="my-3" role="group" aria-label="Feedback quality meter">
      {/* Label + Badge */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${info.dot} shadow`}
          aria-hidden="true"
        />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${info.text} bg-white ring-1 ${info.ring}`}
        >
          {/* badge icon */}
          <svg
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 1.5l2.39 4.84 5.34.78-3.86 3.76.91 5.31L10 13.98l-4.78 2.21.91-5.31L2.27 7.12l5.34-.78L10 1.5z" />
          </svg>
          {info.label}
        </span>
      </div>

      {/* Segmented meter */}
      <div
        className="rounded-xl bg-slate-200/70 p-1 ring-1 ring-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={maxLevel}
        aria-valuenow={info.level}
        aria-valuetext={`${info.label} (${info.level}/${maxLevel})`}
        title={`${info.label}`}
      >
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: maxLevel }).map((_, i) => {
            const active = i < info.level;
            return (
              <div
                key={i}
                className={[
                  "h-2.5 rounded-lg transition-all duration-300",
                  active
                    ? `bg-gradient-to-r ${info.from} ${info.to} shadow-[0_0_0_1px_rgba(0,0,0,0.04)]`
                    : "bg-white/70",
                ].join(" ")}
                style={{
                  boxShadow: active
                    ? "0 2px 10px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.3)"
                    : "inset 0 0 0 1px rgba(0,0,0,0.04)",
                }}
                title={active ? `Level ${i + 1}` : `Inactive`}
              />
            );
          })}
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-1.5 text-[11px] text-slate-500">
        {info.label} quality • {info.level}/{maxLevel}
      </div>
    </div>
  );
}
