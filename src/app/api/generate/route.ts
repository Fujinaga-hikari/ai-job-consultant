import { NextResponse } from "next/server";
import { generateSchema } from "@/lib/validations";
import { generateJobPosting } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // レート制限チェック
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason },
        {
          status: 429,
          headers: rateCheck.retryAfterSeconds
            ? { "Retry-After": String(rateCheck.retryAfterSeconds) }
            : {},
        }
      );
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const result = await generateJobPosting(data);

    const log = await prisma.generationLog.create({
      data: {
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        salary: data.salary || null,
        location: data.location || null,
        content: data.content,
        persona: data.persona || null,
        result,
      },
    });

    return NextResponse.json({ result, logId: log.id });
  } catch (e) {
    console.error("Generate API error:", e);
    return NextResponse.json(
      { error: "求人生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
