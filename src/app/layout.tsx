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

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://lp.mixjob.co.jp").replace(/\/$/, "");
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "AI求人作成コンサルタント",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: {
        "@type": "Organization",
        name: "MixJob",
        url: "https://mixjob.co.jp/",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "無料で使えますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "はい、AI求人原稿の生成は完全無料でご利用いただけます。",
          },
        },
        {
          "@type": "Question",
          name: "どんな求人原稿が作れますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "職種・給与・勤務地・業務内容・ターゲット像を入力するだけで、応募者の心を掴む求人原稿をAIが自動生成します。エンジニア・営業・事務・製造など業種問わず対応しています。",
          },
        },
        {
          "@type": "Question",
          name: "生成された原稿はそのまま使えますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AIが生成した原稿はたたき台としてご活用ください。内容を確認・編集のうえご使用いただくことを推奨します。プロのコンサルタントへの無料相談も承っています。",
          },
        },
        {
          "@type": "Question",
          name: "相談は本当に無料ですか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "はい、初回の採用コンサルティング相談は完全無料です。求人媒体の選び方や採用戦略についてもお気軽にご相談ください。",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${noto.variable} ${zen.variable} ${mono.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
