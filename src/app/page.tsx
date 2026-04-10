"use client";

import { useState } from "react";
import Header from "@/components/Header";
import JobForm from "@/components/JobForm";
import JobResult from "@/components/JobResult";
import ConsultationForm from "@/components/ConsultationForm";

export default function Home() {
  const [result, setResult] = useState<string | null>(null);
  const [logId, setLogId] = useState("");

  function handleGenerated(markdown: string, id: string) {
    setResult(markdown);
    setLogId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setResult(null);
    setLogId("");
  }

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-16">
      <Header showBanner={result === null} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 mt-8">
        {result === null ? (
          <JobForm onGenerated={handleGenerated} />
        ) : (
          <div className="space-y-10">
            <JobResult markdown={result} />
            <hr className="border-gray-200" />
            <ConsultationForm logId={logId} onBack={handleBack} />
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-gray-400 mt-8">
        &copy; {new Date().getFullYear()} MixJob Inc. All rights reserved.
      </footer>
    </main>
  );
}
