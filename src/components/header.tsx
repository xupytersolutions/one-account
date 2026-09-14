"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

type HeaderProps = {
  logoHref?: string;
  actions?: React.ReactNode;
  showThemeSwitcher?: boolean;
};

export function Header({
  logoHref = "/",
  actions,
  showThemeSwitcher = true,
}: HeaderProps) {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const getTheme = () =>
      document.documentElement.classList.contains("dark") ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from DOM/external store
    setTheme(getTheme());

    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const logoSrc =
    theme === "light" ? "/logo-light.png" : "/logo-dark.png";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8 min-w-0">
          <Link href={logoHref} className="flex items-center shrink-0">
            {theme === null ? (
              // Placeholder keeps layout stable before hydration — avoids CLS/flash
              <span className="h-9 w-36 block" aria-hidden />
            ) : (
              <Image
                src={logoSrc}
                alt="Xupyter Solutions"
                width={1254}
                height={1254}
                className="h-9 w-auto object-contain object-center"
                priority
              />
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showThemeSwitcher && <ThemeSwitcher />}
          {actions}
        </div>
      </div>
    </header>
  );
}

export const SiteHeader = Header;
