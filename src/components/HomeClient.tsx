"use client";

import { useState } from "react";
import JobForm from "@/components/JobForm";
import JobResult from "@/components/JobResult";
import ConsultationForm from "@/components/ConsultationForm";

export type JobMeta = {
  companyName: string;
  jobTitle: string;
  salary: string;
  location: string;
};

export default function HomeClient() {
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
      <>
        <JobResult markdown={result} jobMeta={jobMeta} />
        <ConsultationForm logId={logId} onBack={handleBack} />
      </>
    );
  }

  return <JobForm onGenerated={handleGenerated} />;
}
