"use client";

import Image from "next/image";
import Link from "next/link";

type AppLogoProps = {
  compact?: boolean;
  href?: string;
  priority?: boolean;
};

export default function AppLogo({
  compact = false,
  href = "/dashboard",
  priority = false,
}: AppLogoProps) {
  const content = (
    <span className={`app-logo ${compact ? "compact" : ""}`}>
      <Image
        className="app-logo-picture"
        src="/brand/aula-magica-logo.webp"
        alt="Aula Mágica"
        width={1100}
        height={1100}
        priority={priority}
        sizes={compact ? "130px" : "(max-width: 700px) 240px, 320px"}
      />
      <span className="sr-only">Aula Mágica</span>
    </span>
  );

  return href ? (
    <Link className="app-logo-link" href={href} aria-label="Ir al inicio">
      {content}
    </Link>
  ) : (
    content
  );
}
