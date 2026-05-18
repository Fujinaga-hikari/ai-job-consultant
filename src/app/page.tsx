"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JobForm from "@/components/JobForm";
import JobResult from "@/components/JobResult";
import ConsultationForm from "@/components/ConsultationForm";

export type JobMeta = {
  companyName: string;
  jobTitle: string;
  salary: string;
  location: string;
};

export default function Home() {
  const [result, setResult] = useState<string | null>(null);
  const [logId, setLogId] = useState("");
  const [jobMeta, setJobMeta] = useState<JobMeta | null>(null);

  function handleGenerated(markdown: string, id: string, meta: JobMeta) {
    setResult(markdown);
    setLogId(id);
    setJobMeta(meta);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setResult(null);
    setLogId("");
    setJobMeta(null);
  }

  if (result !== null && jobMeta) {
    return (
      <div className="screen">
        <Header />
        <JobResult markdown={result} jobMeta={jobMeta} />
        <ConsultationForm logId={logId} onBack={handleBack} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="screen">
      <Header />
      <JobForm onGenerated={handleGenerated} />
      <Footer />
    </div>
  );
}
