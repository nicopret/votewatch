"use client";

import Image from "next/image";
import { useState } from "react";
import { getMpImage } from "@/lib/getMpImage";

type MpPortraitProps = {
  memberId: number | null;
  mpName: string;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MpPortrait({ memberId, mpName }: MpPortraitProps) {
  const [hasError, setHasError] = useState(false);

  if (!memberId || hasError) {
    return (
      <div className="flex aspect-[3/4] w-[88px] items-end rounded-[20px] bg-[var(--color-surface)] p-3 text-left sm:w-[120px]">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[color:var(--color-text-secondary)]">
            {getInitials(mpName)}
          </p>
          <p className="mt-1 text-[0.75rem] leading-4 text-[color:var(--color-text-secondary)]">
            Official portrait unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] bg-[var(--color-surface)]">
      <Image
        src={getMpImage(memberId)}
        alt={`Official portrait of ${mpName}`}
        width={240}
        height={320}
        sizes="(min-width: 640px) 120px, 88px"
        className="aspect-[3/4] h-auto w-[88px] object-cover sm:w-[120px]"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
