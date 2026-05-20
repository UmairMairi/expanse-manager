import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth.service";
import { gatherReport } from "@/services/reports.service";
import { renderReportPdf } from "@/features/reports/pdf-builder";
import { rangeForPreset, customRange, type RangePreset } from "@/features/reports/range";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const preset = (sp.get("preset") ?? "month") as RangePreset;
  const from = sp.get("from");
  const to = sp.get("to");

  const range =
    preset === "custom" && from && to ? customRange(from, to) : rangeForPreset(preset);

  const bundle = await gatherReport(user.username, range);
  const pdf = await renderReportPdf(bundle, user.name);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${range.from.toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
