export interface ScoreResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

const STOPWORDS = new Set(
  `a about above after again against all am an and any are aren't as at be
   because been before being below between both but by can't cannot could
   couldn't did didn't do does doesn't doing don't down during each few for
   from further had hadn't has hasn't have haven't having he he'd he'll he's
   her here here's hers herself him himself his how how's i i'd i'll i'm i've
   if in into is isn't it it's its itself let's me more most mustn't my
   myself no nor not of off on once only or other ought our ours ourselves
   out over own same shan't she she'd she'll she's should shouldn't so some
   such than that that's the their theirs them themselves then there there's
   these they they'd they'll they're they've this those through to too under
   until up very was wasn't we we'd we'll we're we've were weren't what what's
   when when's where where's which while who who's whom why why's with won't
   would wouldn't you you'd you'll you're you've your yours yourself
   yourselves will etc using use used strong ability able years experience
   including work team role responsibilities requirements preferred required
   plus job description company`
    .split(/\s+/)
    .filter(Boolean)
);

// Common tech/professional skill phrases weighted higher when found in a JD.
const SKILL_HINTS = [
  "javascript", "typescript", "python", "java", "kotlin", "swift", "golang",
  "react", "next.js", "nextjs", "node.js", "nodejs", "express", "django",
  "flask", "spring", "rest api", "graphql", "sql", "postgresql", "mysql",
  "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
  "ci/cd", "git", "agile", "scrum", "machine learning", "data analysis",
  "data structures", "algorithms", "microservices", "unit testing",
  "system design", "linux", "android", "ios", "html", "css", "tailwind",
  "figma", "product management", "communication skills", "leadership"
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+./#\s]/g, " ");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function extractBigrams(text: string): string[] {
  const words = normalize(text).split(/\s+/).filter(Boolean);
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

/** Pulls the most JD-significant keywords: skill-hint phrases first, then frequent nouns/terms. */
function extractKeywords(jobDescription: string, limit = 20): string[] {
  const normalizedJd = normalize(jobDescription);
  const found = new Set<string>();

  for (const skill of SKILL_HINTS) {
    if (normalizedJd.includes(skill)) found.add(skill);
  }

  const freq = new Map<string, number>();
  for (const token of tokenize(jobDescription)) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  for (const bigram of extractBigrams(jobDescription)) {
    const [a, b] = bigram.split(" ");
    if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
    freq.set(bigram, (freq.get(bigram) || 0) + 1);
  }

  const ranked = [...freq.entries()]
    .filter(([term, count]) => count >= 2 && term.length > 2)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);

  for (const term of ranked) {
    if (found.size >= limit) break;
    found.add(term);
  }

  return [...found].slice(0, limit);
}

export function scoreResume(
  resumeText: string,
  jobDescription: string
): ScoreResult {
  const keywords = extractKeywords(jobDescription);
  const normalizedResume = normalize(resumeText);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of keywords) {
    if (normalizedResume.includes(keyword)) matched.push(keyword);
    else missing.push(keyword);
  }

  const score =
    keywords.length === 0
      ? 0
      : Math.round((matched.length / keywords.length) * 100);

  const suggestions: string[] = [];

  if (missing.length > 0) {
    suggestions.push(
      `Add these missing keywords where genuinely true of your background: ${missing
        .slice(0, 8)
        .join(", ")}.`
    );
  }
  if (score < 50) {
    suggestions.push(
      "Your resume overlaps with less than half of this job's key terms — consider tailoring a version specifically for this role rather than sending a generic resume."
    );
  }
  if (!/experience|work history|employment/i.test(resumeText)) {
    suggestions.push(
      "Use a standard section header like \"Experience\" — ATS parsers rely on conventional headers to segment your resume correctly."
    );
  }
  if (!/\d+%|\$\d|\d+x|\bincreased\b|\bimproved\b|\breduced\b/i.test(resumeText)) {
    suggestions.push(
      "Add quantified achievements (e.g. \"reduced load time by 40%\") — measurable impact scores higher with both ATS and human reviewers."
    );
  }
  suggestions.push(
    "Avoid tables, text boxes, and images for content — many ATS parsers cannot read them and will drop that text entirely."
  );

  return {
    score,
    matchedKeywords: matched,
    missingKeywords: missing,
    suggestions
  };
}
