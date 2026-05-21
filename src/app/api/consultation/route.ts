import { NextResponse } from "next/server";
import { consultationSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail, sendAutoReplyEmail } from "@/lib/email";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = consultationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 同一IPからの重複送信チェック（1日1回まで）
    const ip = getClientIp(request);
    const today = new Date().toISOString().slice(0, 10);
    const consultKey = `consult:${ip}`;
    const existing = await prisma.rateLimit.findUnique({
      where: { ip_date: { ip: consultKey, date: today } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "本日すでにお申し込みを受け付けております。明日以降に再度お試しください。" },
        { status: 429 }
      );
    }
    await prisma.rateLimit.create({
      data: { ip: consultKey, date: today, count: 1, lastRequest: new Date() },
    });

    const data = parsed.data;

    await prisma.consultation.create({
      data: {
        email: data.email,
        name: data.name || null,
        companyName: data.companyName || null,
        preferredTime: data.preferredTime || null,
        generationLogId: data.generationLogId || null,
      },
    });

    const results = await Promise.allSettled([
      sendNotificationEmail(data),
      sendAutoReplyEmail(data.email, data.name || undefined),
    ]);

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Email ${i === 0 ? "notification" : "auto-reply"} failed:`, r.reason);
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Consultation API error:", e);
    return NextResponse.json(
      { error: "申込処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
