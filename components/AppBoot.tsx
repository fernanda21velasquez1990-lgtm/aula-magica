"use client";

import { useEffect, useState } from "react";
import AppLogo from "./AppLogo";

export default function AppBoot() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="app-boot" role="status" aria-live="polite">
      <div className="app-boot-card">
        <AppLogo href="" priority />
        <div className="magic-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>Preparando tu Aula Mágica...</p>
      </div>
    </div>
  );
}
