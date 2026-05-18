import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import TrackPageView from "@/components/TrackPageView";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mixjob.jp";
const title = "AI求人作成コンサルタント | MixJob";
const description =
  "AIが求職者の心を掴む求人原稿を無料で自動生成。プロのコンサルタントへの無料相談も。採用力を高めたい企業担当者に最適です。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "MixJob",
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AI求人作成コンサルタント | MixJob",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-sans antialiased">
        {children}
        <TrackPageView />
        <Analytics />
      </body>
    </html>
  );
}
