"use client";

import { useEffect } from "react";

export default function TrackPageView() {
  useEffect(() => {
    fetch("/api/track", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
