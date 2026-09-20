/**
 * Extracts plain text from an uploaded resume file.
 * Supports: PDF (.pdf), Word (.docx), and plain text (.txt).
 */
export async function extractResumeText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === "txt") {
    return buffer.toString("utf-8");
  }

  throw new Error(
    `Unsupported file type: .${ext}. Please upload a .pdf, .docx, or .txt file.`
  );
}
