import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Minimal OG image that works without a custom font.
 * ASCII-only text (brand name) avoids font dependency.
 * Japanese keyword/title text is shown as block patterns when no font is loaded.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get("keyword") ?? "採用コラム").slice(0, 20);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(140deg, #fdf8f1 0%, #fff5f0 55%, #fceae4 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top-right glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,71,48,0.12), transparent 65%)",
          }}
        />
        {/* Bottom-left glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(242,151,27,0.14), transparent 65%)",
          }}
        />
        {/* Dot grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(26,20,16,0.06) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
            opacity: 0.5,
          }}
        />

        {/* Keyword badge */}
        <div style={{ display: "flex", position: "relative" }}>
          <div
            style={{
              background: "#e84730",
              color: "white",
              padding: "10px 28px",
              borderRadius: "999px",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            {keyword}
          </div>
        </div>

        {/* Center decoration */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(232,71,48,0.10) 0%, rgba(242,151,27,0.14) 100%)",
              border: "2px solid rgba(232,71,48,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg, #e84730 0%, #f2971b 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "40px",
                fontWeight: 900,
                boxShadow: "0 8px 32px rgba(232,71,48,0.3)",
              }}
            >
              M
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            paddingTop: "24px",
            borderTop: "1px solid rgba(26,20,16,0.10)",
          }}
        >
          <span
            style={{ fontSize: "30px", fontWeight: 900, color: "#e84730" }}
          >
            MixJob
          </span>
          <span style={{ fontSize: "18px", color: "#7a6e63" }}>
            Recruit Column
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
