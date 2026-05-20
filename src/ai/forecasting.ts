/**
 * Linear regression on (x, y) pairs. Returns slope, intercept, and predict(x).
 * No external deps — keeps the bundle small and works in both server and
 * client contexts (it's pure math).
 */
export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predict: (x: number) => number;
}

export function linearRegression(points: Array<[number, number]>): RegressionResult {
  if (points.length < 2) {
    return {
      slope: 0,
      intercept: points[0]?.[1] ?? 0,
      rSquared: 0,
      predict: () => points[0]?.[1] ?? 0,
    };
  }
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const r2Denom = (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY);
  const rSquared = r2Denom === 0 ? 0 : Math.pow(n * sumXY - sumX * sumY, 2) / r2Denom;
  return {
    slope,
    intercept,
    rSquared,
    predict: (x: number) => slope * x + intercept,
  };
}

/**
 * Group monthly totals from a series of dated amounts. Returns the last
 * `monthsBack` months in YYYY-MM order, with 0 for months that have no data.
 */
export function groupByMonth(
  rows: Array<{ date: string; amount: number }>,
  monthsBack: number = 6,
): Array<{ month: string; total: number }> {
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const ym = r.date.slice(0, 7);
    buckets.set(ym, (buckets.get(ym) ?? 0) + r.amount);
  }
  const now = new Date();
  const out: Array<{ month: string; total: number }> = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ month: ym, total: buckets.get(ym) ?? 0 });
  }
  return out;
}

export interface Forecast {
  history: Array<{ month: string; total: number }>;
  nextMonth: { month: string; predicted: number; rSquared: number };
}

export function forecastNextMonth(
  rows: Array<{ date: string; amount: number }>,
  monthsBack: number = 6,
): Forecast {
  const history = groupByMonth(rows, monthsBack);
  const points: Array<[number, number]> = history.map((h, i) => [i, h.total]);
  const reg = linearRegression(points);
  const predicted = Math.max(0, Math.round(reg.predict(history.length)));
  const now = new Date();
  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  return { history, nextMonth: { month: nextMonth, predicted, rSquared: reg.rSquared } };
}
