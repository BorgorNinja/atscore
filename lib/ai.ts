/**
 * Optional layer: if OPENAI_API_KEY is set, ask an LLM for sharper,
 * context-aware rewrite suggestions on top of the rule-based ones in
 * lib/scoring.ts. Silently returns an empty array if no key is configured
 * or the request fails — the app is fully usable without this.
 */
export async function getAiSuggestions(
  resumeText: string,
  jobDescription: string,
  missingKeywords: string[]
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an ATS resume reviewer. Give at most 4 short, specific, actionable bullet suggestions (no preamble) to help the resume better match the job description. Never invent experience the candidate doesn't have."
          },
          {
            role: "user",
            content: `Job description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nKeywords currently missing from the resume: ${missingKeywords.join(
              ", "
            )}`
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      })
    });

    if (!res.ok) return [];
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return text
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
  } catch {
    return [];
  }
}
