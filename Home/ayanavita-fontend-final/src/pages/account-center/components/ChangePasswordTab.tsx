import React, { FormEvent } from "react";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type Props = {
  cms: any;
  passwordStep: "verifyCurrent" | "setNew";
  setPasswordStep: React.Dispatch<React.SetStateAction<"verifyCurrent" | "setNew">>;
  passwordForm: PasswordFormState;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordFormState>>;
  loading: boolean;
  onVerifyCurrentPassword: (e: FormEvent) => void | Promise<void>;
  onChangePassword: (e: FormEvent) => void | Promise<void>;
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

export default function ChangePasswordTab({
  cms,
  passwordStep,
  setPasswordStep,
  passwordForm,
  setPasswordForm,
  loading,
  onVerifyCurrentPassword,
  onChangePassword,
}: Props) {
  return (
    <div className="space-y-4">
      {passwordStep === "verifyCurrent" ? (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onVerifyCurrentPassword}>
          <div className="md:col-span-2">
            <Field
              label={cms.tabs.changePassword.steps.verifyCurrent.currentPassword.label}
              iconClass={cms.tabs.changePassword.steps.verifyCurrent.currentPassword.iconClass}
            >
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                type="password"
                placeholder={cms.tabs.changePassword.steps.verifyCurrent.currentPassword.placeholder}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </Field>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
              disabled={loading}
            >
              <i className="fa-solid fa-magnifying-glass" />
              {cms.tabs.changePassword.steps.verifyCurrent.buttonText}
            </button>
          </div>
        </form>
      ) : (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onChangePassword}>
          <Field
            label={cms.tabs.changePassword.steps.setNew.newPassword.label}
            iconClass={cms.tabs.changePassword.steps.setNew.newPassword.iconClass}
          >
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              type="password"
              placeholder={cms.tabs.changePassword.steps.setNew.newPassword.placeholder}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </Field>

          <Field
            label={cms.tabs.changePassword.steps.setNew.confirmPassword.label}
            iconClass={cms.tabs.changePassword.steps.setNew.confirmPassword.iconClass}
          >
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              type="password"
              placeholder={cms.tabs.changePassword.steps.setNew.confirmPassword.placeholder}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </Field>

          <div className="md:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              onClick={() => setPasswordStep("verifyCurrent")}
              disabled={loading}
            >
              <i className="fa-solid fa-arrow-left" />
              {cms.common.actions.back}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
              disabled={loading}
            >
              <i className="fa-solid fa-key" />
              {cms.common.actions.updatePassword}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
