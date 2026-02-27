// src/components/home/SuccessModal.tsx
import React from "react";
import { Modal } from "../ui/Modal";

export function SuccessModal({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} ariaLabel="Thành công">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-100 to-green-100">
          <span className="text-3xl text-emerald-600">✓</span>
        </div>
        <h3 className="mt-6 text-2xl font-semibold">Thành công!</h3>
        <p className="mt-2 text-slate-600">{message}</p>
        <button onClick={onClose} className="mt-8 rounded-2xl btn-accent px-8 py-3 font-semibold">
          Tiếp tục
        </button>
      </div>
    </Modal>
  );
}
