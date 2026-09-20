import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractResumeText } from "@/lib/parseResume";
import { scoreResume } from "@/lib/scoring";
import { getAiSuggestions } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const jobDescription = (formData.get("jobDescription") as string) || "";
    const jobTitle = (formData.get("jobTitle") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "No resume file uploaded." },
        { status: 400 }
      );
    }
    if (jobDescription.trim().length < 30) {
      return NextResponse.json(
        { error: "Job description is too short." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await extractResumeText(buffer, file.name);

    const result = scoreResume(resumeText, jobDescription);
    const aiSuggestions = await getAiSuggestions(
      resumeText,
      jobDescription,
      result.missingKeywords
    );
    const suggestions = [...aiSuggestions, ...result.suggestions];

    const session = await getServerSession(authOptions);
    if (session?.user) {
      await prisma.resumeScan.create({
        data: {
          userId: (session.user as { id: string }).id,
          resumeFilename: file.name,
          jobTitle: jobTitle || null,
          score: result.score,
          matchedKeywords: JSON.stringify(result.matchedKeywords),
          missingKeywords: JSON.stringify(result.missingKeywords),
          suggestions: JSON.stringify(suggestions)
        }
      });
    }

    return NextResponse.json({
      score: result.score,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      suggestions
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
