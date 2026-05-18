import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const leads = await prisma.consultation.findMany({
    orderBy: { createdAt: "desc" },
    include: { generationLog: { select: { jobTitle: true, companyName: true } } },
  });

  const rows = [
    ["申込日時", "氏名", "会社名", "メール", "希望連絡時間", "生成職種", "生成企業名"],
    ...leads.map((lead) => [
      new Date(lead.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
      lead.name ?? "",
      lead.companyName ?? "",
      lead.email,
      lead.preferredTime ?? "",
      lead.generationLog?.jobTitle ?? "",
      lead.generationLog?.companyName ?? "",
    ]),
  ];

  const csv =
    "﻿" + // BOM for Excel
    rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

  const filename = `leads_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
