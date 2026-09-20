"use client";

import { useState } from "react";
import ScoreCard from "./ScoreCard";

interface ScanResponse {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("Please upload a resume file (.pdf, .docx, or .txt).");
      return;
    }
    if (jobDescription.trim().length < 30) {
      setError("Paste the full job description (at least a few sentences).");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    formData.append("jobTitle", jobTitle);

    setLoading(true);
    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Resume file (.pdf, .docx, .txt)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-slate-300 p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Job title (optional)
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Junior Backend Developer"
            className="block w-full rounded-lg border border-slate-300 p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Job description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            placeholder="Paste the full job posting here..."
            className="block w-full rounded-lg border border-slate-300 p-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Scoring..." : "Score my resume"}
        </button>
      </form>

      {result && (
        <ScoreCard
          score={result.score}
          matchedKeywords={result.matchedKeywords}
          missingKeywords={result.missingKeywords}
          suggestions={result.suggestions}
        />
      )}
    </div>
  );
}
