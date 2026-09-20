import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Will your resume make it past the bot?
      </h1>
      <p className="max-w-xl text-lg text-slate-600">
        Paste a job description, upload your resume, and get an instant ATS
        compatibility score with specific, actionable fixes — not vague
        advice.
      </p>
      <div className="flex gap-3">
        <Link
          href="/scan"
          className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
        >
          Score my resume
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-300 px-6 py-3 font-medium hover:bg-slate-100"
        >
          Create account
        </Link>
      </div>
      <ul className="mt-8 grid gap-3 text-left text-sm text-slate-600 sm:grid-cols-3">
        <li className="rounded-lg border border-slate-200 bg-white p-4">
          <strong className="block text-slate-900">Keyword matching</strong>
          See exactly which terms from the job posting your resume is missing.
        </li>
        <li className="rounded-lg border border-slate-200 bg-white p-4">
          <strong className="block text-slate-900">Format checks</strong>
          Catch ATS-breaking issues like missing section headers or tables.
        </li>
        <li className="rounded-lg border border-slate-200 bg-white p-4">
          <strong className="block text-slate-900">Scan history</strong>
          Create an account to track score improvements across versions.
        </li>
      </ul>
    </div>
  );
}
