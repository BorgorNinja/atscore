interface ScoreCardProps {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export default function ScoreCard({
  score,
  matchedKeywords,
  missingKeywords,
  suggestions
}: ScoreCardProps) {
  return (
    <div className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          ATS Match Score
        </p>
        <p className={`text-6xl font-bold ${scoreColor(score)}`}>{score}%</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-emerald-700">
            Matched keywords ({matchedKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.length === 0 && (
              <span className="text-sm text-slate-400">None found</span>
            )}
            {matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-red-700">
            Missing keywords ({missingKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.length === 0 && (
              <span className="text-sm text-slate-400">None — great coverage</span>
            )}
            {missingKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Suggestions</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
