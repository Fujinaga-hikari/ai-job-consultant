import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const svgContent = fs.readFileSync(
    path.join(process.cwd(), "public", "logo_mixjob.svg"),
    "utf-8"
  );
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 60%, #fff8f0 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 上部アクセントライン */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #e84730, #f2971b)",
          }}
        />

        {/* ロゴ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={480} height={120} alt="MixJob" style={{ objectFit: "contain" }} />

        {/* キャッチコピー */}
        <div
          style={{
            marginTop: 40,
            fontSize: 36,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.5px",
          }}
        >
          AI求人作成コンサルタント
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 22,
            color: "#555",
            fontWeight: 400,
          }}
        >
          求職者の心を掴む求人原稿を、AIが無料で自動生成
        </div>

        {/* バッジ */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 16,
          }}
        >
          {["無料で生成", "AIが最適化", "専門家に相談"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                background: "#fff",
                border: "2px solid #e84730",
                color: "#e84730",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 下部アクセントライン */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #e84730, #f2971b)",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
