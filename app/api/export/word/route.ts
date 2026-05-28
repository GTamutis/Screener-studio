import { NextResponse } from "next/server";

import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import { buildScreenerWordDocument } from "@/lib/screeners/word-export/build-document";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ExportWordRequestBody = {
  screenerId?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) {
    return errorResponse(appUser.error, appUser.error === "Sign in required." ? 401 : 403);
  }

  let body: ExportWordRequestBody;
  try {
    body = (await req.json()) as ExportWordRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const screenerId =
    typeof body.screenerId === "string" ? body.screenerId.trim() : "";
  if (!UUID_RE.test(screenerId)) {
    return errorResponse("A valid screenerId is required.", 400);
  }

  try {
    const { buffer, filename } = await buildScreenerWordDocument(screenerId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate export.";
    const status = /not found/i.test(message) ? 404 : 500;
    console.error("[api/export/word]", error);
    return errorResponse(message, status);
  }
}
