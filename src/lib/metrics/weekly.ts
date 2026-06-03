import { prisma } from "@/lib/prisma";

export function toJST(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

export function formatJSTDate(d: Date): string {
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

/** 直近の完了した月曜〜日曜（JST） */
export function getLastCompleteWeekRange(now = new Date()) {
  const jst = toJST(now);
  const end = new Date(jst);
  const daysBackToSunday = jst.getDay() === 0 ? 0 : jst.getDay();
  end.setDate(end.getDate() - daysBackToSunday);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

export function getPreviousWeekRange(start: Date, end: Date) {
  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(-1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 6);
  prevStart.setHours(0, 0, 0, 0);
  return { start: prevStart, end: prevEnd };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function countRangeMetrics(start: Date, end: Date) {
  const where = { createdAt: { gte: start, lte: end } };

  const [pv, generations, leads, uuGroups] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.generationLog.count({ where }),
    prisma.consultation.count({ where }),
    prisma.pageView.groupBy({
      by: ["visitorId"],
      where,
    }),
  ]);

  const uu = uuGroups.length;
  const conversionRate =
    generations > 0 ? Math.round((leads / generations) * 1000) / 10 : 0;

  return { pv, uu, generations, leads, conversionRate };
}

export type WeekMetrics = Awaited<ReturnType<typeof countRangeMetrics>>;

export type WeeklyReportMetrics = {
  periodLabel: string;
  siteUrl: string;
  thisWeek: WeekMetrics;
  lastWeek: WeekMetrics;
  changes: {
    pv: number | null;
    uu: number | null;
    generations: number | null;
    leads: number | null;
    conversionRate: number | null;
  };
  eightWeekTrend: Array<{
    week: string;
    pv: number;
    uu: number;
    generations: number;
    leads: number;
  }>;
};

export async function fetchWeeklyReportMetrics(): Promise<WeeklyReportMetrics> {
  const { start, end } = getLastCompleteWeekRange();
  const { start: prevStart, end: prevEnd } = getPreviousWeekRange(start, end);

  const [thisWeek, lastWeek] = await Promise.all([
    countRangeMetrics(start, end),
    countRangeMetrics(prevStart, prevEnd),
  ]);

  const eightWeeksAgo = new Date(start);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 55);

  const [pageViews, generations, leads] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: eightWeeksAgo, lte: end } },
      select: { visitorId: true, createdAt: true },
    }),
    prisma.generationLog.findMany({
      where: { createdAt: { gte: eightWeeksAgo, lte: end } },
      select: { createdAt: true },
    }),
    prisma.consultation.findMany({
      where: { createdAt: { gte: eightWeeksAgo, lte: end } },
      select: { createdAt: true },
    }),
  ]);

  const weekKey = (d: Date) => {
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    return formatJSTDate(mon);
  };

  const trendMap = new Map<
    string,
    { pv: number; uuSet: Set<string>; generations: number; leads: number }
  >();

  for (let i = 7; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - i * 7);
    const key = weekKey(toJST(d));
    trendMap.set(key, { pv: 0, uuSet: new Set(), generations: 0, leads: 0 });
  }

  for (const r of pageViews) {
    const key = weekKey(toJST(r.createdAt));
    const entry = trendMap.get(key);
    if (entry) {
      entry.pv++;
      entry.uuSet.add(r.visitorId);
    }
  }
  for (const r of generations) {
    const key = weekKey(toJST(r.createdAt));
    const entry = trendMap.get(key);
    if (entry) entry.generations++;
  }
  for (const r of leads) {
    const key = weekKey(toJST(r.createdAt));
    const entry = trendMap.get(key);
    if (entry) entry.leads++;
  }

  const eightWeekTrend = Array.from(trendMap.entries()).map(([week, v]) => ({
    week,
    pv: v.pv,
    uu: v.uuSet.size,
    generations: v.generations,
    leads: v.leads,
  }));

  return {
    periodLabel: `${formatJSTDate(start)} 〜 ${formatJSTDate(end)}`,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://lp.mixjob.co.jp",
    thisWeek,
    lastWeek,
    changes: {
      pv: pctChange(thisWeek.pv, lastWeek.pv),
      uu: pctChange(thisWeek.uu, lastWeek.uu),
      generations: pctChange(thisWeek.generations, lastWeek.generations),
      leads: pctChange(thisWeek.leads, lastWeek.leads),
      conversionRate:
        Math.round((thisWeek.conversionRate - lastWeek.conversionRate) * 10) / 10,
    },
    eightWeekTrend,
  };
}

export function metricsToPromptJson(metrics: WeeklyReportMetrics): string {
  return JSON.stringify(metrics, null, 2);
}
