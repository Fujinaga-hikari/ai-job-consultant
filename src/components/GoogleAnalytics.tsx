"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

const GA_ID = "G-E3T47NQM6M";

export default function GoogleAnalytics() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){window.dataLayer.push(arguments);}
        window.gtag('js', new Date());
        window.gtag('config', '${GA_ID}');
      `}</Script>
    </>
  );
}
