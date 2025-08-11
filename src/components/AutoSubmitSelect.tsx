"use client";

import { useRef } from "react";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  formAction: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
};

export default function AutoSubmitSelect({ formAction, hiddenFields, className, onChange, children, ...rest }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  return (
    <form ref={formRef} action={formAction} className="inline">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <select
        {...rest}
        onChange={(e) => {
          onChange?.(e);
          formRef.current?.requestSubmit();
        }}
        className={`px-2 py-1 rounded border ${className ?? ""}`}
      >
        {children}
      </select>
    </form>
  );
}
