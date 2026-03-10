import React, { FormEvent } from "react";

type ProfileState = {
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: string;
  address: string;
};

type Props = {
  cms: any;
  profile: ProfileState;
  setProfile: React.Dispatch<React.SetStateAction<ProfileState>>;
  loading: boolean;
  onSubmit: (e: FormEvent) => void | Promise<void>;
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

export default function ProfileTab({ cms, profile, setProfile, loading, onSubmit }: Props) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <Field label={cms.tabs.profile.fields.fullName.label} iconClass={cms.tabs.profile.fields.fullName.iconClass}>
        <input
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          placeholder={cms.tabs.profile.fields.fullName.placeholder}
          value={profile.fullName}
          onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
        />
      </Field>

      <Field label={cms.tabs.profile.fields.phone.label} iconClass={cms.tabs.profile.fields.phone.iconClass}>
        <input
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          placeholder={cms.tabs.profile.fields.phone.placeholder}
          value={profile.phone}
          onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
        />
      </Field>

      <Field
        label={cms.tabs.profile.fields.email.label}
        iconClass={cms.tabs.profile.fields.email.iconClass}
        helper={cms.tabs.profile.fields.email.helper}
      >
        <input
          className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          type="text"
          placeholder={cms.tabs.profile.fields.email.placeholder}
          value={profile.email}
          readOnly
        />
      </Field>

      <Field label={cms.tabs.profile.fields.birthDate.label} iconClass={cms.tabs.profile.fields.birthDate.iconClass}>
        <input
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          type="date"
          value={profile.birthDate}
          onChange={(e) => setProfile((prev) => ({ ...prev, birthDate: e.target.value }))}
        />
      </Field>

      <Field label={cms.tabs.profile.fields.gender.label} iconClass={cms.tabs.profile.fields.gender.iconClass}>
        <select
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          value={profile.gender}
          onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}
        >
          <option value="MALE">{cms.tabs.profile.fields.gender.options.male}</option>
          <option value="FEMALE">{cms.tabs.profile.fields.gender.options.female}</option>
          <option value="OTHER">{cms.tabs.profile.fields.gender.options.other}</option>
        </select>
      </Field>

      <div className="md:col-span-2">
        <Field label={cms.tabs.profile.fields.address.label} iconClass={cms.tabs.profile.fields.address.iconClass}>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder={cms.tabs.profile.fields.address.placeholder}
            value={profile.address}
            onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
          />
        </Field>
      </div>

      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500">
          <i className="fa-solid fa-circle-exclamation mr-2 text-slate-400" />
          {cms.tabs.profile.fields.email.helper}
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          disabled={loading}
        >
          <i className="fa-regular fa-floppy-disk" />
          {cms.common.actions.save}
        </button>
      </div>
    </form>
  );
}
