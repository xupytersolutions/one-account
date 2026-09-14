"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

function FooterLogo() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const getTheme = () =>
      document.documentElement.classList.contains("dark") ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from DOM
    setTheme(getTheme());
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const logoSrc = theme === "light" ? "/logo-light.png" : "/logo-dark.png";

  if (theme === null) {
    return <span className="h-7 w-32 block" aria-hidden />;
  }

  return (
    <Link href="/" className="flex items-center shrink-0">
      <Image
        src={logoSrc}
        alt="Xupyter Solutions"
        width={1254}
        height={1254}
        className="h-7 w-auto object-contain object-left"
      />
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_1.1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <FooterLogo />
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              One Account — secure vault for account credentials. Spaces for personal, company and client work. Private by default, Google-only login.
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              A product by{" "}
              <a
                href="https://www.xupyter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary"
              >
                Xupyter Solutions Pvt Ltd
              </a>
              . Architecture-led ERP, CRM and automation systems. Bharuch, Gujarat, India.
            </p>
          </div>

          {/* Product links */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold tracking-widest uppercase text-foreground">Product</p>
            <nav className="flex flex-col gap-2.5">
              <Link href="/#generator" className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                Generate password
              </Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                Dashboard
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                Sign in
              </Link>
              <a
                href="https://www.xupyter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit inline-flex items-center gap-1"
              >
                Visit Xupyter <span aria-hidden>↗</span>
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold tracking-widest uppercase text-foreground">Contact Xupyter</p>
            <div className="flex flex-col gap-2.5 text-sm">
              <a href="mailto:hello@xupyter.com" className="text-muted-foreground hover:text-foreground transition-colors w-fit">
                hello@xupyter.com
              </a>
              <a href="tel:+919428714605" className="text-muted-foreground hover:text-foreground transition-colors w-fit">
                +91 94287-14605
              </a>
              <a
                href="https://wa.me/919428714605"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                WhatsApp
              </a>
              <a
                href="https://www.google.com/maps/search/NARMADA+COMMERCIAL+COMPLEX,+M+G+ROAD,+Panch+Batti+Cir,+Bharuch,+Gujarat+392001"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm leading-5 text-muted-foreground hover:text-foreground transition-colors"
              >
                NARMADA COMMERCIAL COMPLEX, M G ROAD,
                <br />
                Panch Batti Cir, Bharuch, Gujarat 392001
              </a>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.linkedin.com/company/xupyter-solutions"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xupyter on LinkedIn"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zm1.777 13.019H3.56V9h3.554v11.452z" />
                </svg>
              </a>
              <a
                href="https://github.com/xupytersolutions"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xupyter on GitHub"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.82-.26.82-.58v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803a11.5 11.5 0 0 1 3.004.404c2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.214.694.823.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/xupytersolutions/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xupyter on Instagram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Xupyter One Account. All rights reserved. Built and maintained by Xupyter Solutions Pvt Ltd.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="h-3 w-px bg-border" aria-hidden />
            <a href="https://www.xupyter.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <span className="h-3 w-px bg-border" aria-hidden />
            <a href="https://www.xupyter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              www.xupyter.com
            </a>
          </div>
          </div>
        </div>
      </footer>
  );
}

export const SiteFooter = Footer;
