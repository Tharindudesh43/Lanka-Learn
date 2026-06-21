import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const blobName = searchParams.get("blobName");

    if (!blobName) {
      return NextResponse.json({ success: false, error: "Missing blobName parameter" }, { status: 400 });
    }

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save under public/uploads/<blobName>
    const relativePath = path.join("public", "uploads", blobName);
    const absolutePath = path.resolve(process.cwd(), relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    // Write file
    await fs.writeFile(absolutePath, buffer);

    console.log(`[MOCK_UPLOAD] Saved file to ${absolutePath}`);

    return NextResponse.json({ success: true, message: "File uploaded locally successfully" });
  } catch (error) {
    console.error("[MOCK_UPLOAD_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to upload file locally" }, { status: 500 });
  }
}
