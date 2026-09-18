import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PDFParse } from "pdf-parse";

// Lets the setup page offer "upload a PDF" as an alternative to pasting
// resume text. Extraction happens server-side so the client never has to
// ship a PDF-parsing library to the browser.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    if (!result.text.trim()) {
      return NextResponse.json(
        { error: "Couldn't find any text in that PDF — it may be a scanned image. Try pasting the text instead." },
        { status: 422 }
      );
    }
    return NextResponse.json({ text: result.text });
  } catch (e) {
    return NextResponse.json(
      { error: `Could not read PDF: ${(e as Error).message}` },
      { status: 422 }
    );
  } finally {
    await parser.destroy();
  }
}
