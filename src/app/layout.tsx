import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import TrackPageView from "@/components/TrackPageView";
import Script from "next/script";
import "./globals.css";

const noto = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "MixJob",
    title,
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${noto.variable} ${zen.variable} ${mono.variable}`}>
      <body className="antialiased">
        {children}
        <TrackPageView />
        <Analytics />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-E3T47NQM6M"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);}
          window.gtag('js', new Date());
          window.gtag('config', 'G-E3T47NQM6M');
        `}</Script>
      </body>
    </html>
  );
}
