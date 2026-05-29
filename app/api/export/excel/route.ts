import { NextResponse } from "next/server";

import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import { buildScreenerExcelWorkbook } from "@/lib/screeners/excel-export/build-workbook";

// IMPORTANT: The column structure of this export (13 fixed core columns +
// display_id-labelled screener response columns) must remain stable.
// A future re-upload feature will parse files generated here and relies
// on this exact structure to identify and import respondent data.

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ExportExcelRequestBody = {
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

  let body: ExportExcelRequestBody;
  try {
    body = (await req.json()) as ExportExcelRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const screenerId =
    typeof body.screenerId === "string" ? body.screenerId.trim() : "";
  if (!UUID_RE.test(screenerId)) {
    return errorResponse("A valid screenerId is required.", 400);
  }

  try {
    const { buffer, filename } = await buildScreenerExcelWorkbook(screenerId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate export.";
    const status = /not found/i.test(message) ? 404 : 500;
    console.error("[api/export/excel]", error);
    return errorResponse(message, status);
  }
}
