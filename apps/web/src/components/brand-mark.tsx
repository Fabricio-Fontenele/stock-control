"use client";

import { useState } from "react";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = "" }: BrandMarkProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-2xl bg-white/10 ${className}`}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo-empresa.png"
          alt="Logo da empresa"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-bold tracking-[0.14em] text-amber-200">CEC</span>
      )}
    </div>
  );
}
