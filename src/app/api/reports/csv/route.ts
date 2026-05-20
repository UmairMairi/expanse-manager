import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth.service";
import { gatherReport } from "@/services/reports.service";
import { buildCsvFiles } from "@/features/reports/csv-builder";
import { rangeForPreset, customRange, type RangePreset } from "@/features/reports/range";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const preset = (sp.get("preset") ?? "month") as RangePreset;
  const from = sp.get("from");
  const to = sp.get("to");
  const which = sp.get("module"); // optional: expenses|income|savings|budgets

  const range =
    preset === "custom" && from && to ? customRange(from, to) : rangeForPreset(preset);

  const bundle = await gatherReport(user.username, range);
  const files = buildCsvFiles(bundle);

  // For simplicity (no JS zip lib): if a single module requested, return that
  // CSV directly. Otherwise concat with markers — usable in any spreadsheet,
  // and avoids a 6KB zip dependency for a personal app.
  if (which) {
    const file = files.find((f) => f.filename === `${which}.csv`);
    if (!file) return new NextResponse("Unknown module", { status: 400 });
    return new NextResponse(file.content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const combined = files
    .map((f) => `# ${f.filename}\n${f.content}`)
    .join("\n\n");

  return new NextResponse(combined, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${range.from.toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
