"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MpPortrait } from "@/components/constituency/mp-portrait";
import { InfoRow } from "@/components/ui/info-row";
import type { MPRecord } from "@/lib/data/models";

type InfoRowData = {
  label: string;
  value: ReactNode;
};

type ContactAction =
  | {
      kind: "link";
      label: string;
      href: string;
      icon: ReactNode;
    }
  | {
      kind: "phone";
      label: string;
      value: string;
      href: string;
      icon: ReactNode;
    };

type MpProfileCardProps = {
  mp: MPRecord | null;
  fallbackName: string;
};

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(parsed);
}

function makeExternalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function IconButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text)] transition-colors group-hover:border-[color:var(--color-text)] group-focus-visible:border-[color:var(--color-text)]"
    >
      {children}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M3.75 6.75h16.5v10.5H3.75z" />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M7.5 4.5h3l1.5 4-2.25 1.5a15.2 15.2 0 0 0 4.5 4.5L15.75 12l4 1.5v3c0 .828-.672 1.5-1.5 1.5C10.656 18 6 13.344 6 7.5 6 6.672 6.672 6 7.5 6z" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.75 12h16.5M12 3.75c2.1 2.25 3.15 5 3.15 8.25S14.1 18 12 20.25M12 3.75c-2.1 2.25-3.15 5-3.15 8.25S9.9 18 12 20.25" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M6.94 4.5h3.06l2.61 3.74L15.8 4.5h1.78l-4.17 4.75 4.9 7.25h-3.06l-2.96-4.28-3.7 4.28H6.8l4.7-5.32z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M13.38 20.25v-7.03h2.36l.35-2.74h-2.7V8.73c0-.79.22-1.33 1.35-1.33h1.44V4.95c-.25-.03-1.11-.11-2.1-.11-2.08 0-3.5 1.27-3.5 3.6v2.04H8.25v2.74h2.33v7.03z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <rect x="4.25" y="4.25" width="15.5" height="15.5" rx="4.25" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r=".9" className="fill-current stroke-none" />
    </svg>
  );
}

export function MpProfileCard({ mp, fallbackName }: MpProfileCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const visibleName = mp?.displayName ?? mp?.name ?? fallbackName;
  const contactDetails = mp?.contactDetails;
  const rows: InfoRowData[] = [];

  if (mp?.gender) {
    rows.push({ label: "Gender", value: mp.gender });
  }

  if (mp?.dateOfBirth) {
    rows.push({
      label: "Date of birth",
      value: formatDate(mp.dateOfBirth) ?? mp.dateOfBirth,
    });
  }

  if (mp?.mpSince) {
    rows.push({
      label: "MP since",
      value: formatDate(mp.mpSince) ?? mp.mpSince,
    });
  }

  if (contactDetails?.address) {
    rows.push({ label: "Address", value: contactDetails.address });
  }

  const contactActions: ContactAction[] = [];

  if (contactDetails?.phone) {
    contactActions.push({
      kind: "phone",
      label: `Phone ${contactDetails.phone}`,
      value: contactDetails.phone,
      href: `tel:${contactDetails.phone.replace(/\s+/g, "")}`,
      icon: <PhoneIcon />,
    });
  }

  if (contactDetails?.xTwitter) {
    contactActions.push({
      kind: "link",
      label: "Open X profile",
      href: makeExternalUrl(contactDetails.xTwitter),
      icon: <XIcon />,
    });
  }

  if (contactDetails?.facebook) {
    contactActions.push({
      kind: "link",
      label: "Open Facebook profile",
      href: makeExternalUrl(contactDetails.facebook),
      icon: <FacebookIcon />,
    });
  }

  if (contactDetails?.instagram) {
    contactActions.push({
      kind: "link",
      label: "Open Instagram profile",
      href: makeExternalUrl(contactDetails.instagram),
      icon: <InstagramIcon />,
    });
  }

  if (contactDetails?.email) {
    contactActions.push({
      kind: "link",
      label: "Send email",
      href: `mailto:${contactDetails.email}`,
      icon: <MailIcon />,
    });
  }

  if (contactDetails?.website) {
    contactActions.push({
      kind: "link",
      label: "Open website",
      href: makeExternalUrl(contactDetails.website),
      icon: <WebsiteIcon />,
    });
  }

  return (
    <section className="py-1">
      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col items-start gap-3">
          <MpPortrait memberId={mp?.memberId ?? null} mpName={visibleName} />
          <div className="max-w-[12rem]">
            <h2 className="text-[1.15rem] font-semibold tracking-tight sm:text-[1.25rem]">
              {visibleName}
            </h2>
            {mp?.currentRole ? (
              <p className="mt-2 text-sm leading-5 text-[color:var(--color-text-secondary)]">
                {mp.currentRole}
              </p>
            ) : null}
          </div>
        </div>

        <div className="min-w-0">
          {rows.length > 0 ? (
            <dl>
              {rows.map((row) => (
                <InfoRow key={row.label} {...row} />
              ))}
            </dl>
          ) : null}

          {contactActions.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">
                Contact
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {contactActions.map((action) => {
                  if (action.kind === "phone" && !isMobile) {
                    return (
                      <button
                        key={action.label}
                        type="button"
                        className="group inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-text)] focus-visible:ring-offset-2"
                        aria-label={showPhoneNumber ? "Hide phone number" : action.label}
                        title={showPhoneNumber ? "Hide phone number" : action.value}
                        onClick={() => setShowPhoneNumber((current) => !current)}
                      >
                        <IconButton label={action.label}>{action.icon}</IconButton>
                      </button>
                    );
                  }

                  return (
                    <a
                      key={action.label}
                      href={action.href}
                      className="group inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-text)] focus-visible:ring-offset-2"
                      aria-label={action.label}
                      title={action.label}
                      target={action.kind === "link" && !action.href.startsWith("mailto:") ? "_blank" : undefined}
                      rel={action.kind === "link" && !action.href.startsWith("mailto:") ? "noreferrer" : undefined}
                    >
                      <IconButton label={action.label}>{action.icon}</IconButton>
                    </a>
                  );
                })}
              </div>
              {showPhoneNumber && contactDetails?.phone ? (
                <p className="mt-3 text-sm font-medium text-[color:var(--color-text)]">
                  {contactDetails.phone}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
