/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

const sentimentConfig = {
  "Very Positive": {
    gradient: "from-green-500 to-emerald-600",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
    emoji: "🤩",
  },
  Positive: {
    gradient: "from-emerald-400 to-green-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    emoji: "🙂",
  },
  "Slightly Positive": {
    gradient: "from-teal-400 to-emerald-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
    emoji: "😊",
  },
  Neutral: {
    gradient: "from-slate-400 to-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    emoji: "😐",
  },
  "Slightly Negative": {
    gradient: "from-amber-400 to-orange-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    emoji: "😕",
  },
  Negative: {
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    emoji: "😟",
  },
  "Very Negative": {
    gradient: "from-red-500 to-red-700",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-600",
    emoji: "😡",
  },
};

export default function SentimentDisplay({ result }) {
  if (!result || result.wordCount === 0) return null;

  const config = sentimentConfig[result.label] || sentimentConfig["Neutral"];

  // Map normalizedScore (-100 to 100) to bar width (0% to 100%)
  const barPercent = Math.round((result.normalizedScore + 100) / 2);
  const totalSentimentWords =
    result.positiveWords.length + result.negativeWords.length;

  return (
    <Card className={`border ${config.border} ${config.bg} shadow-md overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <span className="text-2xl">{config.emoji}</span>
            Sentiment Analysis
          </CardTitle>
          <div className={`text-sm font-bold px-3 py-1 rounded-full bg-background border ${config.border} ${config.text}`}>
            {result.label}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main score */}
        <div className="flex items-end gap-2 mb-6">
          <span className="text-4xl font-bold tracking-tighter">
            {result.normalizedScore > 0 ? "+" : ""}
            {result.normalizedScore}
          </span>
          <span className="text-sm text-muted-foreground mb-1.5 font-medium">
            Sentiment Score
          </span>
        </div>

        {/* Sentiment bar */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Negative</span>
            <span>Neutral</span>
            <span>Positive</span>
          </div>
          <div className="relative h-4 rounded-full bg-muted overflow-hidden ring-1 ring-border">
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-foreground/20 z-10" />

            {/* Gradient Background for Bar */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-red-500 via-slate-500 to-green-500" />

            {/* Indicator dot */}
            <motion.div
              initial={{ left: "50%" }}
              animate={{ left: `${barPercent}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-gradient-to-br ${config.gradient} shadow-lg ring-2 ring-background z-20`}
            />
          </div>
        </div>

        {/* Numeric stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Raw Score"
            value={result.score > 0 ? `+${result.score}` : result.score}
          />
          <StatCard
            label="Comparative"
            value={result.comparative}
          />
          <StatCard label="Positive" value={`+${result.positiveScore}`} color="text-green-500" />
          <StatCard label="Negative" value={`-${result.negativeScore}`} color="text-red-500" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Words" value={result.wordCount} />
          <StatCard label="Keywords" value={totalSentimentWords} />
          <StatCard
            label="Density"
            value={`${result.wordCount > 0 ? Math.round((result.analyzedWords / result.wordCount) * 100) : 0}%`}
          />
        </div>

        {/* Word lists */}
        {(result.positiveWords.length > 0 || result.negativeWords.length > 0) && (
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border/50">
            {result.positiveWords.length > 0 && (
              <WordList
                title="Positive Contributors"
                words={result.positiveWords}
                color="text-green-600 dark:text-green-400"
                bg="bg-green-500/10"
                border="border-green-500/20"
              />
            )}
            {result.negativeWords.length > 0 && (
              <WordList
                title="Negative Contributors"
                words={result.negativeWords}
                color="text-red-600 dark:text-red-400"
                bg="bg-red-500/10"
                border="border-red-500/20"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-lg bg-background/50 p-3 text-center border border-border shadow-sm">
      <div className={`text-lg font-bold font-mono tracking-tight ${color || "text-foreground"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function WordList({ title, words, color, bg, border }) {
  return (
    <div className={`rounded-lg p-3 border ${border} ${bg}`}>
      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {words.slice(0, 12).map((w, i) => (
          <span
            key={`${w.word}-${i}`}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-background/80 shadow-sm border border-transparent ${color}`}
          >
            {w.word}
            <span className="opacity-60 text-[10px]">
              {w.score > 0 ? "+" : ""}
              {w.score}
            </span>
          </span>
        ))}
        {words.length > 12 && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            +{words.length - 12} more
          </span>
        )}
      </div>
    </div>
  );
}
