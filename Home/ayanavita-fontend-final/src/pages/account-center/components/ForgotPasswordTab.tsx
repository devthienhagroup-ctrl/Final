import React, { FormEvent } from "react";

type ForgotFormState = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

type Props = {
  cms: any;
  forgotStep: "email" | "otp" | "newPassword";
  setForgotStep: React.Dispatch<React.SetStateAction<"email" | "otp" | "newPassword">>;
  forgotForm: ForgotFormState;
  setForgotForm: React.Dispatch<React.SetStateAction<ForgotFormState>>;
  profileEmail: string;
  loading: boolean;
  onSendForgotOtp: (e: FormEvent) => void | Promise<void>;
  onVerifyForgotOtp: (e: FormEvent) => void | Promise<void>;
  onForgotPassword: (e: FormEvent) => void | Promise<void>;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Field({
  label,
  iconClass,
  children,
  helper,
}: {
  label: string;
  iconClass: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <i className={classNames(iconClass, "text-slate-400")} />
        {label}
      </span>
      {children}
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}

export default function ForgotPasswordTab({
  cms,
  forgotStep,
  setForgotStep,
  forgotForm,
  setForgotForm,
  profileEmail,
  loading,
  onSendForgotOtp,
  onVerifyForgotOtp,
  onForgotPassword,
}: Props) {
  return (
    <div className="space-y-4">
      {forgotStep === "email" && (
        <form className="space-y-4" onSubmit={onSendForgotOtp}>
          <Field label={cms.tabs.forgotPassword.steps.email.email.label} iconClass={cms.tabs.forgotPassword.steps.email.email.iconClass}>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              type="email"
              placeholder={cms.tabs.forgotPassword.steps.email.email.placeholder}
              value={forgotForm.email}
              onChange={(e) => setForgotForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <i className="fa-regular fa-envelope mr-2 text-slate-500" />
            {cms.tabs.forgotPassword.noteRegisteredEmail}:{" "}
            <span className="font-extrabold">{profileEmail || cms.common.labels.noEmail}</span>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
              disabled={loading}
            >
              <i className="fa-solid fa-paper-plane" />
              {cms.common.actions.sendOtp}
            </button>
          </div>
        </form>
      )}

      {forgotStep === "otp" && (
        <form className="flex flex-col gap-3 md:flex-row md:items-end" onSubmit={onVerifyForgotOtp}>
          <div className="flex-1">
            <Field label={cms.tabs.forgotPassword.steps.otp.otp.label} iconClass={cms.tabs.forgotPassword.steps.otp.otp.iconClass}>
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                type="text"
                placeholder={cms.tabs.forgotPassword.steps.otp.otp.placeholder}
                value={forgotForm.otp}
                onChange={(e) => setForgotForm((prev) => ({ ...prev, otp: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              onClick={() => setForgotStep("email")}
              disabled={loading}
            >
              <i className="fa-solid fa-arrow-left" />
              {cms.common.actions.back}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
              disabled={loading}
            >
              <i className="fa-solid fa-badge-check" />
              {cms.common.actions.verifyOtp}
            </button>
          </div>
        </form>
      )}

      {forgotStep === "newPassword" && (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onForgotPassword}>
          <Field
            label={cms.tabs.forgotPassword.steps.newPassword.newPassword.label}
            iconClass={cms.tabs.forgotPassword.steps.newPassword.newPassword.iconClass}
          >
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              type="password"
              placeholder={cms.tabs.forgotPassword.steps.newPassword.newPassword.placeholder}
              value={forgotForm.newPassword}
              onChange={(e) => setForgotForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </Field>

          <Field
            label={cms.tabs.forgotPassword.steps.newPassword.confirmPassword.label}
            iconClass={cms.tabs.forgotPassword.steps.newPassword.confirmPassword.iconClass}
          >
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              type="password"
              placeholder={cms.tabs.forgotPassword.steps.newPassword.confirmPassword.placeholder}
              value={forgotForm.confirmPassword}
              onChange={(e) => setForgotForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </Field>

          <div className="md:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              onClick={() => setForgotStep("otp")}
              disabled={loading}
            >
              <i className="fa-solid fa-arrow-left" />
              {cms.common.actions.back}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
              disabled={loading}
            >
              <i className="fa-solid fa-rotate" />
              {cms.common.actions.resetPassword}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
