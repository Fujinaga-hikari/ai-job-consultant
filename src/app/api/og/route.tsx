import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Module-level cache so the font is only fetched once per worker lifetime
let _font: ArrayBuffer | null | undefined;

async function getFont(): Promise<ArrayBuffer | null> {
  if (_font !== undefined) return _font;
  try {
    // Old IE UA forces Google Fonts to return TTF (which satori supports)
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700",
      {
        headers: {
          "User-Agent":
            "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",
        },
      }
    ).then((r) => r.text());
    const match = css.match(/url\(([^)]+)\)/);
    if (!match) {
      _font = null;
      return null;
    }
    const buf = await fetch(match[1]).then((r) => r.arrayBuffer());
    _font = buf;
    return buf;
  } catch {
    _font = null;
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "採用ガイド").slice(0, 60);
  const keyword = (searchParams.get("keyword") ?? "採用コラム").slice(0, 20);

  const fontData = await getFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(140deg, #fdf8f1 0%, #fff5f0 55%, #fdf0eb 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "56px 72px",
          fontFamily: fontData ? "NotoSansJP, sans-serif" : "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative radial – top right */}
        <div
          style={{
            position: "absolute",
            top: "-90px",
            right: "-90px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,71,48,0.10), transparent 70%)",
          }}
        />
        {/* Decorative radial – bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: "-70px",
            left: "-70px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(242,151,27,0.12), transparent 70%)",
          }}
        />

        {/* Keyword badge */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              background: "#e84730",
              color: "white",
              padding: "10px 26px",
              borderRadius: "999px",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {keyword}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            fontSize: title.length > 26 ? 42 : 54,
            fontWeight: 700,
            color: "#1a1410",
            lineHeight: 1.45,
            maxWidth: "960px",
            marginTop: "32px",
          }}
        >
          {title}
        </div>

        {/* Footer bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "24px",
            borderTop: "1px solid rgba(26,20,16,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#e84730",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "20px",
              }}
            >
              M
            </div>
            <span
              style={{ fontSize: "26px", fontWeight: 700, color: "#e84730" }}
            >
              MixJob
            </span>
          </div>
          <span style={{ fontSize: "18px", color: "#7a6e63" }}>
            採用・求人票の無料AIツール
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: "NotoSansJP",
              data: fontData,
              weight: 700,
              style: "normal",
            },
          ]
        : [],
    }
  );
}
