"use client";

import { useId, useState } from "react";

import { EyeIcon, EyeOffIcon } from "@/components/ui-icons";

interface PasswordFieldProps {
  name: string;
  placeholder: string;
  className?: string;
  minLength?: number;
  required?: boolean;
  autoComplete?: string;
}

export function PasswordField({
  name,
  placeholder,
  className = "",
  minLength = 6,
  required = true,
  autoComplete = "new-password"
}: PasswordFieldProps) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        id={inputId}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`password-field-input ${className} pr-10`}
      />
      <button
        type="button"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-controls={inputId}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-transparent p-1 text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800"
      >
        {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
