import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { generateUploadSasUrl, generateBlobName } from "@/lib/azure-storage";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Instructor access required" }, { status: 403 });
    }

    const body = await request.json();
    const { fileName, fileType, folder = "courses" } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: "fileName and fileType are required" }, { status: 400 });
    }

    const blobName = generateBlobName(folder, fileName);

    try {
      const { uploadUrl, blobUrl } = await generateUploadSasUrl(blobName, fileType);
      return NextResponse.json({
        success: true,
        uploadUrl,
        blobUrl,
        blobName,
        isMock: false,
      });
    } catch (azureError: any) {
      // Fallback for local development when Azure credentials are not set
      console.warn("[UPLOAD_AZURE_WARNING] Azure storage is not configured, falling back to mock upload:", azureError.message);
      
      const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.json({
        success: true,
        uploadUrl: `${origin}/api/upload/mock?blobName=${encodeURIComponent(blobName)}`,
        blobUrl: `${origin}/public/uploads/${blobName}`,
        blobName,
        isMock: true,
      });
    }
  } catch (error) {
    console.error("[UPLOAD_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to generate upload URL" }, { status: 500 });
  }
}
