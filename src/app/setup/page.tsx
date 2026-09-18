"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldClassName =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function SetupPage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResumeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setParsingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read PDF");
      setResumeText(data.text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setParsingResume(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (resumeText.trim().length < 50 || jobDescription.trim().length < 50) {
      setError("Paste the full resume text and job description (at least a few sentences each).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, companyName, roleTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      sessionStorage.setItem(`questions:${data.applicationId}`, JSON.stringify(data.questions));
      router.push(`/practice/${data.applicationId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New practice session</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your resume text and the job description. Questions are generated
          from the specific overlap and gaps between them.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Company</label>
              <input
                className={fieldClassName}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Role</label>
              <input
                className={fieldClassName}
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Full Stack Developer"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">Resume text</label>
              <label className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                <motion.span
                  key={parsingResume ? "reading" : "idle"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {parsingResume ? "Reading PDF..." : "Upload PDF instead"}
                </motion.span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleResumeFile}
                  disabled={parsingResume}
                />
              </label>
            </div>
            <textarea
              className={fieldClassName}
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Job description</label>
            <textarea
              className={fieldClassName}
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
          >
            {loading ? "Generating questions..." : "Generate interview questions"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
