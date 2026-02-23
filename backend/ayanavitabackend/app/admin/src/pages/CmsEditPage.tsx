import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  adminGetPage,
  adminPublish,
  adminSaveDraft,
  type CmsLocale,
  type CmsPageDetail,
  type CmsSection,
  type CmsSectionLocale,
  type CmsSectionKey,
} from "../api/cms.api";
import { useAuth } from "../app/auth.store";
import { useToast } from "../components/Toast";

// =====================
// HARD SWITCH: AUTOSAVE
// =====================
const AUTOSAVE = (import.meta as any)?.env?.VITE_CMS_AUTOSAVE === "1"; // false => manual only

// ===== helpers =====
function pickLocale(sec: CmsSection, locale: CmsLocale): CmsSectionLocale | undefined {
  return sec.locales?.find((x) => x.locale === locale);
}

function fmtDate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleString();
}

function safeObj(v: any) {
  return v && typeof v === "object" ? v : {};
}
function clampStr(v: any) {
  return typeof v === "string" ? v : "";
}
function arrStr(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string");
}

function stableStringify(v: any) {
  try {
    return JSON.stringify(v ?? {}, Object.keys(v ?? {}).sort(), 2);
  } catch {
    try {
      return JSON.stringify(v ?? {});
    } catch {
      return String(v);
    }
  }
}

function is401(e: any) {
  const status = e?.status ?? e?.response?.status ?? e?.cause?.status;
  if (status === 401) return true;
  const msg = String(e?.message || e || "");
  return msg.includes("401") || msg.toLowerCase().includes("unauthorized");
}

// ===== types =====
type HeroForm = { pill: string; title: string; subtitle: string };
type AboutForm = { title: string; paragraphsText: string };
type CardsForm = { items: { tag: string; title: string; desc: string }[] };
type CtaForm = { title: string; body: string; hint: string; primaryText: string; secondaryText: string };
type FooterForm = { left: string; right: string };

type FormState = {
  hero: HeroForm;
  about: AboutForm;
  cards: CardsForm;
  cta: CtaForm;
  footer: FooterForm;
};

function defaultForm(): FormState {
  return {
    hero: { pill: "", title: "", subtitle: "" },
    about: { title: "", paragraphsText: "" },
    cards: {
      items: [
        { tag: "", title: "", desc: "" },
        { tag: "", title: "", desc: "" },
        { tag: "", title: "", desc: "" },
      ],
    },
    cta: { title: "", body: "", hint: "", primaryText: "", secondaryText: "" },
    footer: { left: "", right: "" },
  };
}

function parseSectionToForm(key: CmsSectionKey, data: any, prev: FormState): FormState {
  const d = safeObj(data);
  const next = { ...prev };

  if (key === "hero") next.hero = { pill: clampStr(d.pill), title: clampStr(d.title), subtitle: clampStr(d.subtitle) };

  if (key === "about") {
    const paragraphs = arrStr(d.paragraphs);
    next.about = { title: clampStr(d.title), paragraphsText: paragraphs.join("\n") };
  }

  if (key === "cards") {
    const items = Array.isArray(d.items) ? d.items : [];
    next.cards = {
      items: [0, 1, 2].map((i) => {
        const it = safeObj(items[i]);
        return { tag: clampStr(it.tag), title: clampStr(it.title), desc: clampStr(it.desc) };
      }),
    };
  }

  if (key === "cta") {
    next.cta = {
      title: clampStr(d.title),
      body: clampStr(d.body),
      hint: clampStr(d.hint),
      primaryText: clampStr(d.primaryText),
      secondaryText: clampStr(d.secondaryText),
    };
  }

  if (key === "footer") next.footer = { left: clampStr(d.left), right: clampStr(d.right) };

  return next;
}

function formToDraftData(key: CmsSectionKey, form: FormState): any {
  if (key === "hero")
    return {
      pill: form.hero.pill?.trim() || undefined,
      title: form.hero.title?.trim() || undefined,
      subtitle: form.hero.subtitle?.trim() || undefined,
    };

  if (key === "about") {
    const lines = form.about.paragraphsText.split("\n").map((x) => x.trim()).filter(Boolean);
    return { title: form.about.title?.trim() || undefined, paragraphs: lines };
  }

  if (key === "cards") {
    return {
      items: (form.cards.items || []).map((it) => ({
        tag: it.tag?.trim() || undefined,
        title: it.title?.trim() || undefined,
        desc: it.desc?.trim() || undefined,
      })),
    };
  }

  if (key === "cta") {
    return {
      title: form.cta.title?.trim() || undefined,
      body: form.cta.body?.trim() || undefined,
      hint: form.cta.hint?.trim() || undefined,
      primaryText: form.cta.primaryText?.trim() || undefined,
      secondaryText: form.cta.secondaryText?.trim() || undefined,
    };
  }

  if (key === "footer") return { left: form.footer.left?.trim() || undefined, right: form.footer.right?.trim() || undefined };

  return {};
}

// =====================
// ✅ TOP-LEVEL INPUTS (fix focus)
// =====================
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="f">
      <div className="lab">{label}</div>
      <input className="input2" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="f">
      <div className="lab">{label}</div>
      <textarea className="textarea2" value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function CmsEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const { token } = useAuth();
  const toast = useToast();

  const [page, setPage] = useState<CmsPageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [locale, setLocale] = useState<CmsLocale>("vi");
  const [sectionId, setSectionId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState<FormState>(() => defaultForm());

  const section = useMemo(() => page?.sections?.find((s) => s.id === sectionId) || null, [page, sectionId]);
  const key = (section?.key || "hero") as CmsSectionKey;

  const locInfo = useMemo(() => (section ? pickLocale(section, locale) || null : null), [section, locale]);
  const effectiveData = useMemo(() => locInfo?.draftData ?? locInfo?.publishedData ?? {}, [locInfo]);

  const sectionsSorted = useMemo(() => (page?.sections || []).slice().sort((a, b) => a.sortOrder - b.sortOrder), [page]);

  const baselineRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  const currentDraftFromForm = useMemo(() => formToDraftData(key, form), [key, form]);
  const draftSig = useMemo(() => stableStringify(currentDraftFromForm), [currentDraftFromForm]);
  const dirty = useMemo(() => (baselineRef.current || "") !== draftSig, [draftSig]);

  async function load() {
    if (!slug) return;
    setLoading(true);
    try {
      if (!token) {
        toast.push({ kind: "err", title: "Chưa có token", detail: "Vui lòng đăng nhập lại." });
        nav("/login", { replace: true });
        return;
      }

      const data = await adminGetPage(token, slug);
      setPage(data);
      if (data.sections?.length) setSectionId((prev) => prev ?? data.sections[0].id);
    } catch (e: any) {
      if (is401(e)) {
        toast.push({ kind: "err", title: "Phiên đăng nhập hết hạn", detail: "401 Unauthorized. Vui lòng đăng nhập lại." });
        nav("/login", { replace: true });
        return;
      }
      toast.push({ kind: "err", title: "Load page failed", detail: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const dataSig = useMemo(() => `${sectionId ?? ""}|${locale}`, [sectionId, locale]);

  useEffect(() => {
    if (!section) return;

    setForm((prev) => {
      const next = parseSectionToForm(key, effectiveData, prev);
      baselineRef.current = stableStringify(formToDraftData(key, next));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSig, section?.id]);

  useEffect(() => {
    if (!AUTOSAVE) return;
    if (!section) return;
    if (!dirty) return;
    if (!token) return;
    if (saving || publishing) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        setSaving(true);
        await adminSaveDraft(token, section.id, locale, currentDraftFromForm);
        baselineRef.current = stableStringify(currentDraftFromForm);
      } catch (e: any) {
        if (is401(e)) {
          toast.push({ kind: "err", title: "Phiên đăng nhập hết hạn", detail: "401 Unauthorized. Vui lòng đăng nhập lại." });
          nav("/login", { replace: true });
          return;
        }
        console.warn("[AUTOSAVE] failed:", e);
      } finally {
        setSaving(false);
      }
    }, 1200);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [dirty, token, section?.id, locale, currentDraftFromForm, saving, publishing, nav, toast]);

  function guardedSwitch(nextLocale: CmsLocale, nextSectionId?: number | null) {
    if (dirty && !AUTOSAVE) {
      const ok = window.confirm("Bạn có thay đổi chưa lưu. Bỏ thay đổi và chuyển tiếp?");
      if (!ok) return;
    }
    if (typeof nextSectionId === "number") setSectionId(nextSectionId);
    if (nextLocale !== locale) setLocale(nextLocale);
  }

  async function onSaveDraft() {
    if (!section) return;

    if (!token) {
      toast.push({ kind: "err", title: "Chưa có token", detail: "Vui lòng đăng nhập lại." });
      nav("/login", { replace: true });
      return;
    }

    setSaving(true);
    try {
      await adminSaveDraft(token, section.id, locale, currentDraftFromForm);
      baselineRef.current = stableStringify(currentDraftFromForm);
      toast.push({ kind: "ok", title: "Saved draft", detail: `section=${section.key} locale=${locale}` });
      await load();
    } catch (e: any) {
      if (is401(e)) {
        toast.push({ kind: "err", title: "Phiên đăng nhập hết hạn", detail: "401 Unauthorized. Vui lòng đăng nhập lại." });
        nav("/login", { replace: true });
        return;
      }
      toast.push({ kind: "err", title: "Save draft failed", detail: e?.message || String(e) });
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    if (!section) return;

    if (!token) {
      toast.push({ kind: "err", title: "Chưa có token", detail: "Vui lòng đăng nhập lại." });
      nav("/login", { replace: true });
      return;
    }

    if (dirty && !AUTOSAVE) {
      const ok = window.confirm("Bạn đang có thay đổi chưa lưu. Save Draft trước khi Publish?");
      if (ok) await onSaveDraft();
    }

    setPublishing(true);
    try {
      await adminPublish(token, section.id, locale);
      toast.push({ kind: "ok", title: "Published", detail: `section=${section.key} locale=${locale}` });
      await load();
    } catch (e: any) {
      if (is401(e)) {
        toast.push({ kind: "err", title: "Phiên đăng nhập hết hạn", detail: "401 Unauthorized. Vui lòng đăng nhập lại." });
        nav("/login", { replace: true });
        return;
      }
      toast.push({ kind: "err", title: "Publish failed", detail: e?.message || String(e) });
    } finally {
      setPublishing(false);
    }
  }

  function onReset() {
    if (!dirty) return;
    const ok = window.confirm("Reset về dữ liệu đang load (draft/published) và bỏ thay đổi?");
    if (!ok) return;
    load();
  }

  function onCopyPublishedToDraft() {
    if (!section) return;
    const pub = locInfo?.publishedData;
    if (!pub) {
      toast.push({ kind: "err", title: "No published data", detail: "Chưa có publishedData." });
      return;
    }
    const ok = window.confirm("Copy Published → Form (ghi đè nội dung form hiện tại). Tiếp tục?");
    if (!ok) return;
    setForm((prev) => parseSectionToForm(key, pub, prev));
  }

  const statusBadge = useMemo(() => {
    const st = (locInfo?.status || "").toUpperCase();
    if (!st) return <span className="badge off">NO LOCALE</span>;
    if (st.includes("PUBLISH")) return <span className="badge ok">PUBLISHED</span>;
    if (st.includes("DRAFT")) return <span className="badge warn">DRAFT</span>;
    return <span className="badge">{st}</span>;
  }, [locInfo]);

  function renderRightBadge() {
    if (saving) return <span className="badge warn">SAVING…</span>;
    return <span className={`badge ${dirty ? "warn" : "ok"}`}>{dirty ? "UNSAVED" : "SAVED"}</span>;
  }

  function renderEditorPanel() {
    if (!section) {
      return (
        <div className="card glass editorCard">
          <div className="pad muted">Chưa có section để chỉnh.</div>
        </div>
      );
    }

    if (key === "hero") {
      return (
        <div className="card glass editorCard">
          <div className="editorTop">
            <div>
              <div className="h2">HERO CONTENT</div>
              <div className="muted">Chỉ chỉnh text • không chỉnh JSON</div>
            </div>
            <div className="rightBadges">{renderRightBadge()}</div>
          </div>
          <div className="sep" />
          <div className="pad gridX">
            <Field label="Pill" value={form.hero.pill} placeholder='VD: "AYANAVITA • Intro"' onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, pill: v } }))} />
            <Field label="Title" value={form.hero.title} placeholder='VD: "AYANAVITA"' onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, title: v } }))} />
            <Area label="Subtitle" rows={4} value={form.hero.subtitle} placeholder="Mô tả ngắn dưới tiêu đề…" onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, subtitle: v } }))} />
          </div>
        </div>
      );
    }

    if (key === "about") {
      return (
        <div className="card glass editorCard">
          <div className="editorTop">
            <div>
              <div className="h2">ABOUT CONTENT</div>
              <div className="muted">Paragraphs: mỗi dòng = 1 đoạn</div>
            </div>
            <div className="rightBadges">{renderRightBadge()}</div>
          </div>
          <div className="sep" />
          <div className="pad gridX">
            <Field label="Title" value={form.about.title} onChange={(v) => setForm((p) => ({ ...p, about: { ...p.about, title: v } }))} />
            <Area label="Paragraphs (mỗi dòng 1 đoạn)" rows={8} value={form.about.paragraphsText} placeholder={"Đoạn 1...\nĐoạn 2...\nĐoạn 3..."} onChange={(v) => setForm((p) => ({ ...p, about: { ...p.about, paragraphsText: v } }))} />
          </div>
        </div>
      );
    }

    if (key === "cards") {
      return (
        <div className="card glass editorCard">
          <div className="editorTop">
            <div>
              <div className="h2">CARDS CONTENT</div>
              <div className="muted">3 cards (tag/title/desc)</div>
            </div>
            <div className="rightBadges">{renderRightBadge()}</div>
          </div>
          <div className="sep" />
          <div className="pad">
            <div className="cardsGrid">
              {form.cards.items.map((it, idx) => (
                <div key={idx} className="cardMini">
                  <div className="cardMiniTitle">Card #{idx + 1}</div>
                  <Field
                    label="Tag"
                    value={it.tag}
                    onChange={(v) =>
                      setForm((p) => {
                        const items = p.cards.items.slice();
                        items[idx] = { ...items[idx], tag: v };
                        return { ...p, cards: { items } };
                      })
                    }
                  />
                  <Field
                    label="Title"
                    value={it.title}
                    onChange={(v) =>
                      setForm((p) => {
                        const items = p.cards.items.slice();
                        items[idx] = { ...items[idx], title: v };
                        return { ...p, cards: { items } };
                      })
                    }
                  />
                  <Area
                    label="Description"
                    rows={4}
                    value={it.desc}
                    onChange={(v) =>
                      setForm((p) => {
                        const items = p.cards.items.slice();
                        items[idx] = { ...items[idx], desc: v };
                        return { ...p, cards: { items } };
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (key === "cta") {
      return (
        <div className="card glass editorCard">
          <div className="editorTop">
            <div>
              <div className="h2">CTA CONTENT</div>
              <div className="muted">Text + button labels</div>
            </div>
            <div className="rightBadges">{renderRightBadge()}</div>
          </div>
          <div className="sep" />
          <div className="pad gridX">
            <Field label="Title" value={form.cta.title} onChange={(v) => setForm((p) => ({ ...p, cta: { ...p.cta, title: v } }))} />
            <Area label="Body" rows={5} value={form.cta.body} onChange={(v) => setForm((p) => ({ ...p, cta: { ...p.cta, body: v } }))} />
            <Area label="Hint" rows={3} value={form.cta.hint} onChange={(v) => setForm((p) => ({ ...p, cta: { ...p.cta, hint: v } }))} />
            <div className="row2">
              <Field label="Primary button text" value={form.cta.primaryText} onChange={(v) => setForm((p) => ({ ...p, cta: { ...p.cta, primaryText: v } }))} />
              <Field label="Secondary button text" value={form.cta.secondaryText} onChange={(v) => setForm((p) => ({ ...p, cta: { ...p.cta, secondaryText: v } }))} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card glass editorCard">
        <div className="editorTop">
          <div>
            <div className="h2">FOOTER CONTENT</div>
            <div className="muted">left / right</div>
          </div>
          <div className="rightBadges">{renderRightBadge()}</div>
        </div>
        <div className="sep" />
        <div className="pad gridX">
          <Field label="Left" value={form.footer.left} onChange={(v) => setForm((p) => ({ ...p, footer: { ...p.footer, left: v } }))} />
          <Field label="Right" value={form.footer.right} onChange={(v) => setForm((p) => ({ ...p, footer: { ...p.footer, right: v } }))} />
        </div>
      </div>
    );
  }

  return (
    <div className="aya-editor">
      <aside className="left">
        <div className="card glass">
          <div className="hdr">
            <div>
              <div className="h1">
                Edit CMS: <span className="g-text">{slug}</span>
                {saving ? <span className="dirty">● Saving…</span> : dirty ? <span className="dirty">● Unsaved</span> : <span className="saved">✓ Saved</span>}
              </div>
              <div className="muted sub">
                Chỉnh text theo section • <b>{AUTOSAVE ? "Auto-save" : "Manual Save"}</b> • Publish
              </div>
            </div>

            <div className="hdrRight">
              {statusBadge}
              <button className="btn" onClick={load} disabled={loading}>
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="sep" />

          <div className="block">
            <div className="h2">Locale</div>
            <div className="row">
              {(["vi", "en", "de"] as CmsLocale[]).map((l) => {
                const on = locale === l;
                return (
                  <button key={l} className={`btn ${on ? "btn-primary" : ""}`} onClick={() => guardedSwitch(l)} type="button">
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="block">
            <div className="h2">Sections</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Click để chọn section
            </div>

            <div className="sep" />

            <div className="sections">
              {sectionsSorted.map((s) => {
                const active = s.id === sectionId;
                return (
                  <button key={s.id} className={`sec ${active ? "on" : ""}`} type="button" onClick={() => guardedSwitch(locale, s.id)}>
                    <div className="secLeft">
                      <div className="secKey">{s.key}</div>
                      <div className="secMeta muted">
                        id={s.id} • #{s.sortOrder}
                      </div>
                    </div>
                    <span className="pill">#{s.sortOrder}</span>
                  </button>
                );
              })}
              {!sectionsSorted.length ? <div className="muted">Không có sections.</div> : null}
            </div>
          </div>

          <div className="block">
            <div className="h2">Status</div>
            <div className="sep" />
            <div className="kv">
              <div>
                <span className="muted">locale</span>: <b>{locInfo?.locale ?? "-"}</b>
              </div>
              <div>
                <span className="muted">status</span>: <b>{locInfo?.status ?? "-"}</b>
              </div>
              <div>
                <span className="muted">publishedAt</span>: <b>{fmtDate((locInfo as any)?.publishedAt)}</b>
              </div>
              <div>
                <span className="muted">updatedAt</span>: <b>{fmtDate((locInfo as any)?.updatedAt)}</b>
              </div>
            </div>
          </div>

          <div className="block">
            <div className="h2">Quick actions</div>
            <div className="sep" />
            <div className="row wrap">
              <button className="btn" type="button" onClick={onCopyPublishedToDraft} disabled={!section}>
                Copy Published → Form
              </button>
              <button className="btn" type="button" onClick={onReset} disabled={!dirty}>
                Reset
              </button>
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onSaveDraft} disabled={!section || saving}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button className="btn" type="button" onClick={onPublish} disabled={!section || publishing}>
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </aside>

      <section className="right">{renderEditorPanel()}</section>

      <style>{`
        .aya-editor{ display:grid; grid-template-columns: 460px 1fr; gap:14px; align-items:start; }
        @media (max-width:1100px){ .aya-editor{ grid-template-columns: 1fr; } .left{ position:relative; top:auto; } }
        .left{ position: sticky; top: 12px; }
        .right{ min-width:0; }

        .card.glass{
          border-radius:18px;
          border:1px solid rgba(148,163,184,.18);
          background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.04));
          box-shadow: 0 22px 60px rgba(0,0,0,.35);
          overflow:hidden;
        }

        .hdr{ padding:14px; display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap; }
        .hdrRight{ display:flex; align-items:center; gap:10px; }
        .sub{ margin-top:6px; opacity:.78; }

        .h1{ font-size:22px; font-weight:950; letter-spacing:.2px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .h2{ font-size:14px; font-weight:950; letter-spacing:.08em; text-transform:uppercase; opacity:.92; }

        .dirty{ font-size:12px; font-weight:950; padding:6px 10px; border-radius:999px; border:1px solid rgba(245,158,11,.25); background: rgba(245,158,11,.10); }
        .saved{ font-size:12px; font-weight:950; padding:6px 10px; border-radius:999px; border:1px solid rgba(34,197,94,.25); background: rgba(34,197,94,.10); }

        .block{ padding:12px 14px; }
        .row{ display:flex; gap:10px; margin-top:10px; flex-wrap:nowrap; }
        .row.wrap{ flex-wrap:wrap; }
        .row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media(max-width:900px){ .row2{ grid-template-columns:1fr; } }

        .sections{ display:grid; gap:10px; }
        .sec{
          width:100%; text-align:left;
          display:flex; justify-content:space-between; align-items:center; gap:12px;
          padding:12px; border-radius:16px;
          border:1px solid rgba(148,163,184,.14);
          background: rgba(2,6,23,.18);
          color: inherit; cursor:pointer;
          transition: transform .08s ease, border-color .12s ease, background .12s ease;
        }
        .sec:hover{ transform: translateY(-1px); border-color: rgba(99,102,241,.32); background: rgba(99,102,241,.10); }
        .sec.on{ border-color: rgba(99,102,241,.50); background: rgba(99,102,241,.16); }
        .secKey{ font-weight:950; }
        .secMeta{ margin-top:4px; font-size:12px; opacity:.72; }

        .pill{
          padding:6px 10px; border-radius:999px;
          border:1px solid rgba(148,163,184,.14);
          background: rgba(255,255,255,.05);
          font-weight:950; font-size:12px; opacity:.9; white-space:nowrap;
        }

        .kv{ display:grid; gap:8px; font-size:14px; }

        .actions{
          padding:14px; display:flex; gap:10px; flex-wrap:wrap;
          border-top:1px solid rgba(148,163,184,.12);
          background: rgba(2,6,23,.12);
        }

        .badge{
          display:inline-flex; align-items:center;
          padding:6px 10px; border-radius:999px;
          font-size:12px; font-weight:950; letter-spacing:.06em;
          border:1px solid rgba(148,163,184,.14);
          background: rgba(255,255,255,.04);
        }
        .badge.ok{ border-color: rgba(34,197,94,.25); background: rgba(34,197,94,.10); }
        .badge.off{ border-color: rgba(239,68,68,.25); background: rgba(239,68,68,.10); }
        .badge.warn{ border-color: rgba(245,158,11,.25); background: rgba(245,158,11,.10); }

        .sep{ height:1px; background: rgba(148,163,184,.12); width:100%; }

        .editorCard{ overflow:hidden; }
        .editorTop{ padding:14px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; }
        .rightBadges{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

        .pad{ padding:14px; }
        .gridX{ display:grid; gap:12px; }

        .f{ display:grid; gap:8px; }
        .lab{ font-size:12px; font-weight:950; letter-spacing:.06em; text-transform:uppercase; opacity:.86; }
        .input2, .textarea2{
          width:100%; border-radius:14px;
          border:1px solid rgba(148,163,184,.18);
          background: rgba(2,6,23,.20);
          color: inherit; outline:none; padding:12px;
        }
        .input2:focus, .textarea2:focus{
          border-color: rgba(99,102,241,.55);
          box-shadow: 0 0 0 4px rgba(99,102,241,.18);
        }

        .cardsGrid{ display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; }
        @media(max-width:1100px){ .cardsGrid{ grid-template-columns:1fr; } }
        .cardMini{
          border-radius:16px; border:1px solid rgba(148,163,184,.14);
          background: rgba(2,6,23,.14);
          padding:12px; display:grid; gap:12px;
        }
        .cardMiniTitle{ font-weight:950; opacity:.92; }
      `}</style>
    </div>
  );
}
