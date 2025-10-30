import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getModelWithCapabilities } from "@/lib/ai/model-loader";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const modelId = formData.get("modelId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Load model configuration to check file upload capabilities
    const modelConfig = await getModelWithCapabilities(modelId);

    if (!modelConfig) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Check if file inputs are enabled for this model
    if (!modelConfig.capabilities?.fileInputs?.enabled) {
      return NextResponse.json(
        { error: "File uploads are not supported for this model" },
        { status: 400 }
      );
    }

    // Get allowed file types for this model (default to images only)
    const allowedTypes = modelConfig.allowedFileTypes && modelConfig.allowedFileTypes.length > 0
      ? modelConfig.allowedFileTypes
      : ["image/jpeg", "image/png"];

    // Get max file size from metadata (default to 5MB)
    const maxFileSize = (modelConfig.metadata as any)?.maxFileSize || 5 * 1024 * 1024;

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxFileSize / 1024 / 1024}MB limit for this model` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type ${file.type} is not allowed for this model. Allowed types: ${allowedTypes.join(", ")}`
        },
        { status: 400 }
      );
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(`${user.id}/${Date.now()}-${filename}`, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Supabase Storage error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(data.path);

      return NextResponse.json({
        url: publicUrlData.publicUrl,
        pathname: data.path,
      });
    } catch (_error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
