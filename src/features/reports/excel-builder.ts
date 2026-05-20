import "server-only";
import ExcelJS from "exceljs";
import type { ReportBundle } from "@/services/reports.service";

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF18181B" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  color: { argb: "FFFFFFFF" },
  bold: true,
};

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
}

function toMajor(amount: number) {
  return Number((amount / 100).toFixed(2));
}

export async function buildExcelReport(bundle: ReportBundle): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Expense Manager";
  wb.created = new Date();

  // === Summary ===
  const sum = wb.addWorksheet("Summary");
  sum.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Currency", key: "currency", width: 12 },
    { header: "Amount", key: "amount", width: 18, style: { numFmt: "#,##0.00" } },
  ];
  applyHeaderStyle(sum.getRow(1));
  sum.addRow({ metric: "Report range", currency: "", amount: bundle.range.label });
  sum.addRow({ metric: "Generated", currency: "", amount: new Date().toISOString().slice(0, 10) });
  sum.addRow({});
  for (const [currency, amount] of bundle.summary.totalIncomeByCurrency) {
    sum.addRow({ metric: "Total income", currency, amount: toMajor(amount) });
  }
  for (const [currency, amount] of bundle.summary.totalExpensesByCurrency) {
    sum.addRow({ metric: "Total expenses", currency, amount: toMajor(amount) });
  }
  for (const [currency, amount] of bundle.summary.netByCurrency) {
    sum.addRow({ metric: "Net (income − expenses)", currency, amount: toMajor(amount) });
  }
  sum.addRow({});
  sum.addRow({ metric: "Expense entries", currency: "", amount: bundle.summary.expenseCount });
  sum.addRow({ metric: "Income entries", currency: "", amount: bundle.summary.incomeCount });

  // === Expenses ===
  const exp = wb.addWorksheet("Expenses");
  exp.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Title", key: "title", width: 28 },
    { header: "Category", key: "category", width: 16 },
    { header: "Payment", key: "payment", width: 14 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Amount", key: "amount", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Tags", key: "tags", width: 20 },
    { header: "Notes", key: "notes", width: 30 },
  ];
  applyHeaderStyle(exp.getRow(1));
  for (const e of bundle.expenses) {
    exp.addRow({
      date: e.date,
      title: e.title,
      category: e.category,
      payment: e.paymentMethod,
      currency: e.currency,
      amount: toMajor(e.amount),
      tags: (e.tags ?? []).join(", "),
      notes: e.notes ?? "",
    });
  }

  // === Income ===
  const inc = wb.addWorksheet("Income");
  inc.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Source", key: "source", width: 14 },
    { header: "Platform", key: "platform", width: 18 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Amount", key: "amount", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Notes", key: "notes", width: 30 },
  ];
  applyHeaderStyle(inc.getRow(1));
  for (const i of bundle.income) {
    inc.addRow({
      date: i.date,
      source: i.source,
      platform: i.platform,
      currency: i.currency,
      amount: toMajor(i.amount),
      notes: i.notes ?? "",
    });
  }

  // === Savings ===
  const sav = wb.addWorksheet("Savings");
  sav.columns = [
    { header: "Goal", key: "goal", width: 26 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Target", key: "target", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Saved", key: "saved", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Progress %", key: "pct", width: 12 },
    { header: "Deadline", key: "deadline", width: 14 },
    { header: "Emergency", key: "emergency", width: 12 },
  ];
  applyHeaderStyle(sav.getRow(1));
  for (const g of bundle.savings) {
    const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
    sav.addRow({
      goal: g.goalName,
      currency: g.currency,
      target: toMajor(g.targetAmount),
      saved: toMajor(g.savedAmount),
      pct,
      deadline: g.deadline ?? "",
      emergency: g.isEmergencyFund ? "Yes" : "",
    });
  }

  // === Budgets ===
  const bud = wb.addWorksheet("Budgets");
  bud.columns = [
    { header: "Category", key: "category", width: 18 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Monthly limit", key: "limit", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Spent (current month)", key: "spent", width: 16, style: { numFmt: "#,##0.00" } },
    { header: "% used", key: "pct", width: 10 },
    { header: "State", key: "state", width: 12 },
  ];
  applyHeaderStyle(bud.getRow(1));
  for (const s of bundle.budgets) {
    bud.addRow({
      category: s.budget.category,
      currency: s.budget.currency,
      limit: toMajor(s.budget.monthlyLimit),
      spent: toMajor(s.spent),
      pct: Math.round(s.percentUsed),
      state: s.state,
    });
  }

  const result = await wb.xlsx.writeBuffer();
  return Buffer.from(result);
}
