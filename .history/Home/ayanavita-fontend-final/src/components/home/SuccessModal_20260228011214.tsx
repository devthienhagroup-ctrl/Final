// src/components/home/SuccessModal.tsx
import React, { useMemo } from "react";
import { Modal } from "../ui/Modal";

export type SuccessModalCmsData = {
  ariaLabel: string;
  iconText: string;
  title: string;
  continueButtonText: string;
};

const defaultCmsData: SuccessModalCmsData = {
  ariaLabel: "Thành công",
  iconText: "✓",
  title: "Thành công!",
  continueButtonText: "Tiếp tục",
};

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge<T extends Record<string, any>>(base: T, override?: Partial<T>): T {
  if (!override) return base;

  const out: T = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const ov = override[key];
    const bv = base[key];

    if (isPlainObject(bv) && isPlainObject(ov)) {
      out[key] = deepMerge(bv, ov) as T[typeof key];
    } else if (ov !== undefined) {
      out[key] = ov as T[typeof key];
    }
  }
  return out;
}

export function SuccessModal({
  open,
  message,
  onClose,
  cmsData,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
  cmsData?: Partial<SuccessModalCmsData>;
}) {
  const cms = useMemo(() => deepMerge(defaultCmsData, cmsData), [cmsData]);

  return (
    <Modal open={open} onClose={onClose} ariaLabel={cms.ariaLabel}>
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-100 to-green-100">
          <span className="text-3xl text-emerald-600">{cms.iconText}</span>
        </div>

        <h3 className="mt-6 text-2xl font-semibold">{cms.title}</h3>

        <p className="mt-2 text-slate-600">{message}</p>

        <button onClick={onClose} className="mt-8 rounded-2xl btn-accent px-8 py-3 font-semibold">
          {cms.continueButtonText}
        </button>
      </div>
    </Modal>
  );
}

export { defaultCmsData };