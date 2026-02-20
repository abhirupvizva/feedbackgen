import { useState, useRef, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import toast, { Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import { analyzeSentiment } from "./sentimentAnalyzer";
import { analyzeWithGroq } from "./groqAnalyzer";
import SentimentDisplay from "./SentimentDisplay";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Label from "./components/ui/label";
import Input from "./components/ui/input";
import Textarea from "./components/ui/textarea";
import Select from "./components/ui/select";
import Button from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

function FieldLabel({ children }) {
  return <Label className="mb-2 block">{children}</Label>;
}

/* -------------------------------------------
   Formats config (unchanged)
------------------------------------------- */
const formats = [
  {
    name: "Interview",
    fields: [
      {
        key: "taskStatus",
        label: "Task Status",
        type: "select",
        options: ["Completed", "Cancelled", "Rescheduled", "Not Done"],
      },
      {
        key: "interviewRound",
        label: "Interview Round",
        type: "select",
        options: [
          "Screening",
          "On Demand or AI Interview",
          "1st Round",
          "2nd Round",
          "3rd Round",
          "4th Round",
          "5th Round",
          "Technical Round",
          "Coding Round",
          "Final Round",
          "Loop Round",
        ],
      },
      {
        key: "feedback",
        label: "Feedback",
        type: "textarea",
        placeholder:
          "Brief on the candidate's performance: answer quality, communication, confidence, possibility of moving to next round. If cancelled/not done, state reason – e.g., no show, cancellation, etc.",
      },
      {
        key: "questions",
        label: "Interview Questions Asked",
        type: "textarea",
        placeholder:
          "List the questions asked in the interview (if AI-generated, ensure review before sharing).",
      },
    ],
  },
  {
    name: "Mock Interview",
    fields: [
      {
        key: "taskStatus",
        label: "Task Status",
        type: "select",
        options: ["Completed", "Not Done", "Cancelled"],
      },
      {
        key: "feedback",
        label: "Feedback",
        type: "textarea",
        placeholder:
          "Comments on candidate behavior, technical/soft skills, communication ability, and key improvement areas.",
      },
      {
        key: "questions",
        label: "Mock Interview Questions",
        type: "textarea",
        placeholder:
          "List of questions asked during the session (ensure validity if auto-generated).",
      },
    ],
  },
  {
    name: "Resume Understanding",
    fields: [
      {
        key: "taskStatus",
        label: "Task Status",
        type: "select",
        options: ["Completed", "Not Done", "Cancelled"],
      },
      {
        key: "feedback",
        label: "Feedback",
        type: "textarea",
        placeholder:
          "Notes or remarks based on resume analysis – skill highlights, gaps, relevant experience, or inconsistencies.",
      },
    ],
  },
  {
    name: "Assessment",
    fields: [
      {
        key: "taskStatus",
        label: "Task Status",
        type: "select",
        options: ["Completed", "Not Done", "Cancelled"],
      },
      {
        key: "assessmentType",
        label: "Assessment Type",
        type: "select",
        options: ["Behavioral", "Technical", "Behavioral/Technical"],
      },
      {
        key: "feedback",
        label: "Feedback",
        type: "textarea",
        placeholder:
          "Briefly describe the assessment — e.g., coding challenge (JavaScript array manipulations), behavioral test (situational judgment), case study, multiple-choice test, etc. Was the assessment completed end-to-end? Any sections that were complex or required extra effort. If applicable, mention whether any instructions from the candidate/client were followed.",
      },
    ],
  },
];

/* -------------------------------------------
   Output formatter (unchanged)
------------------------------------------- */
function formatOutput(selected, values) {
  const normalizeQuestions = (text) => {
    if (!text || !text.trim()) return "1. NA";
    const items = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => l.replace(/^(\d+\.)\s+/, "").replace(/^[-*•]\s+/, ""));
    if (items.length === 0) return "1. NA";
    return items.map((l, i) => `${i + 1}. ${l}`).join("\n");
  };
  switch (selected) {
    case "Interview":
      return [
        `**Task Status:** ${values.taskStatus || "NA"}`,
        `**Interview Round:** ${values.interviewRound || "NA"}`,
        `**Feedback:**`,
        `${values.feedback?.trim() || "NA"}`,
        ``,
        `**Interview Questions Asked:**`,
        ``,
        normalizeQuestions(values.questions),
      ].join("\n");
    case "Mock Interview":
      return [
        `**Task Status:** ${values.taskStatus || "NA"}`,
        `**Feedback:**`,
        `${values.feedback?.trim() || "NA"}`,
        ``,
        `**Mock Interview Questions:**`,
        ``,
        normalizeQuestions(values.questions),
      ].join("\n");
    case "Resume Understanding":
      return [
        `**Task Status:** ${values.taskStatus || "NA"}`,
        `**Feedback:**`,
        `${values.feedback?.trim() || "NA"}`,
      ].join("\n");
    case "Assessment":
      return [
        `**Task Status:** ${values.taskStatus || "NA"}`,
        `**Assessment Type:** ${values.assessmentType || "NA"}`,
        `**Feedback:**`,
        `${values.feedback?.trim() || "NA"}`,
      ].join("\n");
    default:
      return "";
  }
}

/* -------------------------------------------
App Component
------------------------------------------- */
export default function App() {
  const [selectedFormat, setSelectedFormat] = useState("Interview");
  const [fieldValues, setFieldValues] = useState({});
  const [output, setOutput] = useState("");
  const [sentimentResult, setSentimentResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const outputRef = useRef(null);

  // Restore cache on mount
  useEffect(() => {
    const cached = localStorage.getItem("feedback_generator_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const { timestamp, data } = parsed;
        if (Date.now() - timestamp < 10000) {
          setSelectedFormat(data.selectedFormat);
          setFieldValues(data.fieldValues);
          setOutput(data.output);
          setSentimentResult(data.sentimentResult);
          toast.success("Restored previous session");
        } else {
          localStorage.removeItem("feedback_generator_cache");
        }
      } catch (e) {
        console.error("Failed to parse cache", e);
      }
    }
  }, []);

  // Save cache on change
  useEffect(() => {
    if (Object.keys(fieldValues).length > 0 || output) {
      const data = {
        selectedFormat,
        fieldValues,
        output,
        sentimentResult,
      };
      localStorage.setItem(
        "feedback_generator_cache",
        JSON.stringify({
          timestamp: Date.now(),
          data,
        })
      );
    }
  }, [selectedFormat, fieldValues, output, sentimentResult]);

  const current = formats.find((f) => f.name === selectedFormat);

  const handleFieldChange = (key, value) => {
    setFieldValues((v) => ({ ...v, [key]: value }));
  };

  const handleGenerate = async () => {
    setOutput(formatOutput(selectedFormat, fieldValues));
    const feedbackText = fieldValues.feedback || "";
    if (!feedbackText.trim()) return;

    setIsAnalyzing(true);
    setSentimentResult(null);
    try {
      const result = await analyzeWithGroq(feedbackText);
      setSentimentResult(result);
    } catch (err) {
      console.error("Groq analysis failed, falling back to local analyzer:", err);
      toast.error("AI analysis failed – using local analyzer.");
      setSentimentResult(analyzeSentiment(feedbackText));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (outputRef.current) {
      const html = outputRef.current.innerHTML;
      if (navigator.clipboard && window.ClipboardItem) {
        const blob = new Blob([html], { type: "text/html" });
        const data = [new window.ClipboardItem({ "text/html": blob })];
        navigator.clipboard.write(data);
        toast.success("Rich text copied!");
      } else {
        navigator.clipboard.writeText(output);
        toast.success("Markdown copied!");
      }
    }
  };

  return (
    <>
      <Toaster />
      <Analytics />
      <SpeedInsights />

      <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Feedback Generator
            </h1>
            <p className="mt-2 text-muted-foreground">
              Create structured feedback in seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                  <CardDescription>
                    Select a format and fill in the details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Format Switcher */}
                  <div className="flex flex-wrap gap-2">
                    {formats.map((f) => (
                      <Button
                        key={f.name}
                        variant={selectedFormat === f.name ? "default" : "outline"}
                        onClick={() => {
                          setSelectedFormat(f.name);
                          setFieldValues({});
                          setOutput("");
                          setSentimentResult(null);
                        }}
                        size="sm"
                        className="rounded-full"
                      >
                        {f.name}
                      </Button>
                    ))}
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await handleGenerate();
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedFormat}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {current.fields.map((field) => (
                          <div key={field.key} className="space-y-1">
                            <FieldLabel>{field.label}</FieldLabel>
                            {field.type === "select" ? (
                              <Select
                                value={fieldValues[field.key] || ""}
                                onChange={(val) =>
                                  handleFieldChange(field.key, val)
                                }
                                options={field.options || []}
                                placeholder="Select an option"
                                required
                              />
                            ) : field.type === "textarea" ? (
                              <>
                                <Textarea
                                  value={fieldValues[field.key] || ""}
                                  onChange={(e) =>
                                    handleFieldChange(field.key, e.target.value)
                                  }
                                  placeholder={field.placeholder}
                                  rows={5}
                                  resizable
                                  required={
                                    field.label !== "Interview Questions Asked"
                                  }
                                  className="overflow-auto min-h-[100px] max-h-[600px]"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                  Tip: Use line breaks for lists.
                                </p>
                              </>
                            ) : (
                              <Input
                                type="text"
                                value={fieldValues[field.key] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.key, e.target.value)
                                }
                                required
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>

                    <Button type="submit" className="w-full" disabled={isAnalyzing}>
                      {isAnalyzing ? "Analyzing…" : "Generate Feedback"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column: Sentiment & Output */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Sentiment Display */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border/50 bg-muted/30 p-6 flex items-center gap-3 text-muted-foreground text-sm"
                  >
                    <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    AI is analyzing the feedback…
                  </motion.div>
                )}
                {!isAnalyzing && sentimentResult && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <SentimentDisplay result={sentimentResult} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Output Display */}
              <AnimatePresence>
                {output && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="border-border/50 shadow-lg overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg">Generated Output</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div
                          className="p-6 max-h-[500px] overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed"
                          ref={outputRef}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {output}
                          </ReactMarkdown>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/30 p-4 flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => toast("You can paste this directly into email.")}>
                          How to use
                        </Button>
                        <Button onClick={handleCopy}>Copy Output</Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {!output && !sentimentResult && (
                <div className="hidden lg:flex h-full min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  <div className="max-w-xs">
                    <p className="text-lg font-medium">Ready to Generate</p>
                    <p className="text-sm mt-2">Fill the form to get the Sentiment Analysis.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
