"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";

interface ConfirmSubmitFormProps {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Array<{ name: string; value: string }>;
  triggerLabel: string;
  triggerClassName: string;
  dialogTitle: string;
  dialogDescription: string;
  confirmLabel?: string;
  confirmPendingLabel?: string;
  cancelLabel?: string;
}

function ConfirmSubmitButton({
  idleLabel,
  pendingLabel,
  className
}: {
  idleLabel: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export function ConfirmSubmitForm({
  action,
  hiddenFields,
  triggerLabel,
  triggerClassName,
  dialogTitle,
  dialogDescription,
  confirmLabel = "Confirmar",
  confirmPendingLabel = "Processando...",
  cancelLabel = "Cancelar"
}: ConfirmSubmitFormProps) {
  const [open, setOpen] = useState(false);
  const descriptionId = useId();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open ? (
        <DialogPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/55" onClick={() => setOpen(false)} />

            <div
              role="dialog"
              aria-modal="true"
              aria-describedby={descriptionId}
              className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <h2 className="text-lg font-semibold text-slate-950">{dialogTitle}</h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
                {dialogDescription}
              </p>

              <form action={action} className="mt-6 flex flex-wrap justify-end gap-2">
                {hiddenFields.map((field) => (
                  <input key={field.name} type="hidden" name={field.name} value={field.value} />
                ))}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {cancelLabel}
                </button>

                <ConfirmSubmitButton
                  idleLabel={confirmLabel}
                  pendingLabel={confirmPendingLabel}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>
            </div>
          </div>
        </DialogPortal>
      ) : null}
    </>
  );
}
