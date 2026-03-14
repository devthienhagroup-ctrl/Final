import React, { useEffect, useState } from "react";

type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

type CookieConsentCms = {
  title: string;
  subtitle: string;
  message: string;
  acceptAll: string;
  reject: string;
  settings: string;
  close: string;
  saveSettings: string;
  necessary: string;
  analytics: string;
  marketing: string;
  alwaysOn: string;
};

type Props = {
  cms?: Partial<CookieConsentCms>;
};

const COOKIE_CONSENT_KEY = "aya_cookie_consent_v1";

const defaultCms: CookieConsentCms = {
  title: "Cookie Settings",
  subtitle: "Manage your cookie preferences for this website.",
  message: "We use cookies to improve your experience.",
  acceptAll: "Accept All",
  reject: "Reject",
  settings: "Settings",
  close: "Close",
  saveSettings: "Save Settings",
  necessary: "Necessary",
  analytics: "Analytics",
  marketing: "Marketing",
  alwaysOn: "Always on",
};

function parseStoredConsent(raw: string | null): CookieConsentPreferences | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.analytics === "boolean" &&
        typeof parsed.marketing === "boolean" &&
        typeof parsed.updatedAt === "string"
    ) {
      return {
        necessary: true,
        analytics: parsed.analytics,
        marketing: parsed.marketing,
        updatedAt: parsed.updatedAt,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function saveConsent(preferences: CookieConsentPreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", {
        detail: preferences,
      }),
  );
}

export default function CookieConsentBanner({ cms }: Props) {
  const content = { ...defaultCms, ...cms };

  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = parseStoredConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
    if (stored) {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
      return;
    }

    setVisible(true);
  }, []);

  const applyConsent = (next: CookieConsentPreferences) => {
    saveConsent(next);
    setAnalytics(next.analytics);
    setMarketing(next.marketing);
    setSettingsOpen(false);
    setVisible(false);
  };

  const handleAcceptAll = () => {
    applyConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReject = () => {
    applyConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveSettings = () => {
    applyConsent({
      necessary: true,
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return (
      <>
        {settingsOpen ? (
            <section className="fixed bottom-[84px] left-2 right-2 z-[999] mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:left-4 sm:right-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{content.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{content.subtitle}</p>
                </div>

                <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {content.close}
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-sm">
                  <span className="font-medium text-slate-700">{content.necessary}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                {content.alwaysOn}
              </span>
                </label>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-sm">
                  <span className="font-medium text-slate-700">{content.analytics}</span>
                  <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(event) => setAnalytics(event.target.checked)}
                      className="h-4 w-4 accent-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-sm">
                  <span className="font-medium text-slate-700">{content.marketing}</span>
                  <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(event) => setMarketing(event.target.checked)}
                      className="h-4 w-4 accent-indigo-600"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  {content.saveSettings}
                </button>
              </div>
            </section>
        ) : null}

        <section className="fixed bottom-0 left-0 right-0 z-[998] border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div className="mx-auto flex w-full flex-col gap-4 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{content.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{content.subtitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{content.message}</p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg"
              >
                {content.acceptAll}
              </button>

              <button
                  type="button"
                  onClick={handleReject}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {content.reject}
              </button>

              <button
                  type="button"
                  onClick={() => setSettingsOpen((value) => !value)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {content.settings}
              </button>
            </div>
          </div>
        </section>
      </>
  );
}