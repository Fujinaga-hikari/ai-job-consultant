import { NextResponse } from "next/server";
import { consultationSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail, sendAutoReplyEmail } from "@/lib/email";

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

    // Send emails (non-blocking - don't fail the request if email fails)
    await Promise.allSettled([
      sendNotificationEmail(data),
      sendAutoReplyEmail(data.email, data.name || undefined),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Consultation API error:", e);
    return NextResponse.json(
      { error: "申込処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
