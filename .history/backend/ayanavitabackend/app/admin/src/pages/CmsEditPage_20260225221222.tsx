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
} from "../api/cms.api";
import { useAuth } from "../app/auth.store";
import { useToast } from "../components/Toast";

// =====================
// HARD SWITCH: AUTOSAVE
// =====================
const AUTOSAVE = (import.meta as any)?.env?.VITE_CMS_AUTOSAVE === "1";

// ===== helpers (giữ nguyên) =====
function pickLocale(sec: CmsSection, locale: CmsLocale): CmsSectionLocale | undefined {
  return sec.locales?.find((x) => x.locale === locale);
}

function fmtDate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleString();
}

function is401(e: any) {
  const status = e?.status ?? e?.response?.status ?? e?.cause?.status;
  if (status === 401) return true;
  const msg = String(e?.message || e || "");
  return msg.includes("401") || msg.toLowerCase().includes("unauthorized");
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function setIn(obj: any, path: (string | number)[], value: any): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const index = head as number;
    const newArr = [...obj];
    newArr[index] = setIn(obj[index], rest, value);
    return newArr;
  } else {
    return { ...obj, [head]: setIn(obj[head] ?? {}, rest, value) };
  }
}

function cleanData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(cleanData).filter((v) => v !== undefined);
  } else if (data && typeof data === "object") {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(data)) {
      const cleanedVal = cleanData(v);
      if (cleanedVal !== undefined && cleanedVal !== null && cleanedVal !== "") {
        cleaned[k] = cleanedVal;
      }
    }
    return Object.keys(cleaned).length ? cleaned : undefined;
  } else if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed === "" ? undefined : trimmed;
  } else {
    return data;
  }
}

function isDescriptionKey(key: string | number): boolean {
  if (typeof key !== "string") return false;
  const descKeys = ["description", "desc", "body", "subtitle", "paragraphs", "content"];
  return descKeys.some((dk) => key.toLowerCase().includes(dk));
}

function isImageKey(key: string | number): boolean {
  if (typeof key !== "string") return false;
  return key.toLowerCase().includes("img") || key.toLowerCase().includes("image") || key.toLowerCase().includes("logourl");
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

// =====================
// Image Field Component – hiện tại dùng input text để nhập link
// =====================
function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
      <div className="image-field">
        {value && (
            <div className="image-preview">
              <img src={value} alt="preview" />
            </div>
        )}
        <div className="image-actions">
          <input
              type="text"
              className="input2"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Nhập URL hình ảnh..."
          />
          {value && (
              <button className="btn" type="button" onClick={() => onChange("")}>
                Remove
              </button>
          )}
        </div>
      </div>
  );
}

// =====================
// Dynamic Field Renderer (giữ nguyên, dùng CSS class)
// =====================
interface DynamicFieldProps {
  data: any;
  form: any;
  path: (string | number)[];
  onFormChange: (path: (string | number)[], value: any) => void;
}

function DynamicField({ data, form, path, onFormChange }: DynamicFieldProps) {
  if (data === null || data === undefined) {
    return <div className="muted">(no data)</div>;
  }

  // ARRAY
  if (Array.isArray(data)) {
    const arrayForm = Array.isArray(form) ? form : [];

    const addItem = () => {
      const template = data.length > 0 ? data[0] : {};
      const newItem = deepClone(template);
      if (typeof newItem === "object" && newItem !== null) {
        Object.keys(newItem).forEach((k) => {
          if (typeof newItem[k] === "string") newItem[k] = "";
        });
      }
      onFormChange(path, [...arrayForm, newItem]);
    };

    const removeItem = (index: number) => {
      onFormChange(path, arrayForm.filter((_, i) => i !== index));
    };

    return (
        <div className="dynamic-array">
          <div className="array-header">
            <span className="array-label">{path[path.length - 1]?.toString() || "Array"}</span>
            <button className="btn array-add" onClick={addItem} type="button">
              + Add
            </button>
          </div>
          <div className="array-items">
            {arrayForm.map((item, idx) => (
                <div key={idx} className="array-item">
                  <div className="array-item-header">
                    <span className="array-item-index">#{idx + 1}</span>
                    <button className="btn array-remove" onClick={() => removeItem(idx)} type="button">
                      ✕
                    </button>
                  </div>
                  <DynamicField
                      data={data[idx] ?? data[0] ?? {}}
                      form={item}
                      path={[...path, idx]}
                      onFormChange={onFormChange}
                  />
                </div>
            ))}
            {arrayForm.length === 0 && (
                <div className="muted array-empty">(empty)</div>
            )}
          </div>
        </div>
    );
  }

  // OBJECT
  if (typeof data === "object" && data !== null) {
    const objectForm = (form && typeof form === "object") ? form : {};

    return (
        <div className="dynamic-object">
          {Object.keys(data).map((key) => {
            const childData = data[key];
            const childForm = objectForm[key];
            return (
                <div key={key} className="object-field">
                  <div className="field-label">{key}</div>
                  <DynamicField
                      data={childData}
                      form={childForm}
                      path={[...path, key]}
                      onFormChange={onFormChange}
                  />
                </div>
            );
          })}
        </div>
    );
  }

  // PRIMITIVE
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onFormChange(path, e.target.value);
  };

  const lastKey = path[path.length - 1];
  const inputValue = form ?? data ?? "";

  if (isImageKey(lastKey) && typeof data === "string") {
    return (
        <div className="dynamic-primitive">
          <ImageField value={inputValue} onChange={(v) => onFormChange(path, v)} />
        </div>
    );
  }

  const useTextArea = typeof data === "string" && isDescriptionKey(lastKey);

  return (
      <div className="dynamic-primitive">
        {useTextArea ? (
            <textarea
                className="textarea2"
                value={inputValue}
                onChange={handleChange}
                rows={5}
            />
        ) : (
            <input
                type="text"
                className="input2"
                value={inputValue}
                onChange={handleChange}
            />
        )}
      </div>
  );
}

// =====================
// Main Component - Layout mới với toolbar trên cùng, CSS tùy chỉnh
// =====================
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
  const [form, setForm] = useState<any>({});

  const section = useMemo(() => page?.sections?.find((s) => s.id === sectionId) || null, [page, sectionId]);
  const key = section?.key || "unknown";

  const locInfo = useMemo(() => (section ? pickLocale(section, locale) || null : null), [section, locale]);
  const effectiveData = useMemo(() => locInfo?.draftData ?? locInfo?.publishedData ?? {}, [locInfo]);

  const sectionsSorted = useMemo(() => (page?.sections || []).slice().sort((a, b) => a.sortOrder - b.sortOrder), [page]);

  const baselineRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  const cleanedForm = useMemo(() => cleanData(form), [form]);
  const draftSig = useMemo(() => stableStringify(cleanedForm), [cleanedForm]);
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
  }, [slug]);

  const dataSig = useMemo(() => `${sectionId ?? ""}|${locale}`, [sectionId, locale]);
  useEffect(() => {
    if (!section) return;
    setForm(() => {
      const newForm = deepClone(effectiveData);
      baselineRef.current = stableStringify(cleanData(newForm));
      return newForm;
    });
  }, [dataSig, section?.id]);

  // Auto-save effect
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
        await adminSaveDraft(token, section.id, locale, cleanedForm);
        baselineRef.current = stableStringify(cleanedForm);
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
  }, [dirty, token, section?.id, locale, cleanedForm, saving, publishing, nav, toast]);

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
      await adminSaveDraft(token, section.id, locale, cleanedForm);
      baselineRef.current = stableStringify(cleanedForm);
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
    setForm(deepClone(pub));
  }

  const handleFormChange = (path: (string | number)[], value: any) => {
    setForm((prev: any) => setIn(prev, path, value));
  };

  const statusBadge = useMemo(() => {
    const st = (locInfo?.status || "").toUpperCase();
    if (!st) return <span className="badge off">NO LOCALE</span>;
    if (st.includes("PUBLISH")) return <span className="badge ok">PUBLISHED</span>;
    if (st.includes("DRAFT")) return <span className="badge warn">DRAFT</span>;
    return <span className="badge">{st}</span>;
  }, [locInfo]);

  return (
      <div className="aya-editor">
        {/* Toolbar container - card glass */}
        <div className="toolbar glass">
          {/* Header row */}
          <div className="toolbar-header">
            <div>
              <div className="h1">
                Edit CMS: <span className="g-text">{slug}</span>
                {saving ? (
                    <span className="dirty">● Saving…</span>
                ) : dirty ? (
                    <span className="dirty">● Unsaved</span>
                ) : (
                    <span className="saved">✓ Saved</span>
                )}
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

          {/* Controls row */}
          <div className="toolbar-controls">
            {/* Locale selector */}
            <div className="control-group">
              <span className="control-label">Locale:</span>
              <div className="btn-group">
                {(["vi", "en", "de"] as CmsLocale[]).map((l) => {
                  const active = locale === l;
                  return (
                      <button
                          key={l}
                          className={`btn ${active ? "btn-primary" : ""}`}
                          onClick={() => guardedSwitch(l)}
                          type="button"
                      >
                        {l.toUpperCase()}
                      </button>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="control-group actions-group">
              <button
                  className="btn"
                  onClick={onCopyPublishedToDraft}
                  disabled={!section}
              >
                Copy Published
              </button>
              <button
                  className="btn"
                  onClick={onReset}
                  disabled={!dirty}
              >
                Reset
              </button>
            </div>

            {/* Save & Publish */}
            <div className="control-group primary-actions">
              <button
                  className="btn btn-primary"
                  onClick={onSaveDraft}
                  disabled={!section || saving}
              >
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button
                  className="btn btn-success"
                  onClick={onPublish}
                  disabled={!section || publishing}
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
          <div className="toolbar-controls">
            {/* Sections tabs */}
            <div className="control-group sections-tabs">
              <div className="tabs-scroll">
                {sectionsSorted.map((s) => {
                  const active = s.id === sectionId;
                  return (
                      <button
                          key={s.id}
                          className={`tab ${active ? "active" : ""}`}
                          onClick={() => guardedSwitch(locale, s.id)}
                          type="button"
                      >
                        <span>{s.key}</span>
                        <span className="tab-order">#{s.sortOrder}</span>
                      </button>
                  );
                })}
                {!sectionsSorted.length && (
                    <span className="muted">Không có sections.</span>
                )}
              </div>
            </div>
          </div>
          {/* Status info row (optional) */}
          {locInfo && (
              <div className="toolbar-status">
                <div><span className="muted">locale:</span> <b>{locInfo.locale}</b></div>
                <div><span className="muted">status:</span> <b>{locInfo.status}</b></div>
                <div><span className="muted">published:</span> <b>{fmtDate((locInfo as any)?.publishedAt)}</b></div>
                <div><span className="muted">updated:</span> <b>{fmtDate((locInfo as any)?.updatedAt)}</b></div>
              </div>
          )}
        </div>

        {/* Editor Panel */}
        <div className="editor-panel glass">
          {!section ? (
              <div className="pad muted">Chưa có section để chỉnh.</div>
          ) : (
              <>
                <div className="editor-header">
                  <div>
                    <div className="h2">{key.toUpperCase()} CONTENT</div>
                    <div className="muted">Dynamic fields • click để chỉnh sửa</div>
                  </div>
                  <div className="editor-badges">
                    {saving && <span className="badge warn">SAVING…</span>}
                    <span className={`badge ${dirty ? "warn" : "ok"}`}>
                  {dirty ? "UNSAVED" : "SAVED"}
                </span>
                  </div>
                </div>
                <div className="pad dynamic-editor">
                  <DynamicField
                      data={effectiveData}
                      form={form}
                      path={[]}
                      onFormChange={handleFormChange}
                  />
                </div>
              </>
          )}
        </div>

        {/* CSS (phỏng theo file gốc, điều chỉnh cho layout mới) */}
        <style>{`
        .aya-editor {
          padding: 14px;
          min-height: 100vh;
          color: #1e293b;
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 48%, #f8fafc 100%);
          border-radius: 20px;
        }
        .glass {
          border-radius: 18px;
          border: 1px solid #dbe7ff;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          box-shadow: 0 14px 38px rgba(37, 99, 235, 0.08);
        }
        .toolbar {
          margin-bottom: 20px;
        }
        .toolbar-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .h1 {
          font-size: 22px;
          font-weight: 950;
          letter-spacing: 0.2px;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .h2 {
          font-size: 14px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.92;
        }
        .g-text {
          color: #4f46e5;
        }
        .dirty, .saved {
          font-size: 12px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
        }
        .dirty {
          border: 1px solid #facc15;
          background: #fef9c3;
          color: #854d0e;
        }
        .saved {
          border: 1px solid #86efac;
          background: #dcfce7;
          color: #166534;
        }
        .muted {
          opacity: 1;
          color: #64748b;
          font-size: 14px;
        }
        .sub {
          margin-top: 6px;
        }
        .hdrRight {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: inherit;
          cursor: pointer;
          transition: all 0.1s ease;
          text-decoration: none;
          line-height: 1;
        }
        .btn:hover:not(:disabled) {
          background: #eef2ff;
          border-color: #818cf8;
          transform: translateY(-1px);
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .btn-primary {
          background: #4f46e5;
          border-color: #4338ca;
          color: #ffffff;
        }
        .btn-primary:hover:not(:disabled) {
          background: #4338ca;
        }
        .btn-success {
          background: #059669;
          border-color: #047857;
          color: #ffffff;
        }
        .btn-success:hover:not(:disabled) {
          background: #047857;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.06em;
          border: 1px solid #dbeafe;
          background: #eff6ff;
        }
        .badge.ok {
          border-color: #86efac;
          background: #dcfce7;
          color: #166534;
        }
        .badge.off {
          border-color: #fca5a5;
          background: #fee2e2;
          color: #991b1b;
        }
        .badge.warn {
          border-color: #fcd34d;
          background: #fef3c7;
          color: #92400e;
        }

        /* Toolbar controls */
        .toolbar-controls {
          padding: 16px 20px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .control-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }
        .btn-group {
          display: flex;
          gap: 4px;
        }
        .btn-group .btn {
          padding: 6px 12px;
          font-size: 13px;
        }

        /* Sections tabs */
        .sections-tabs {
          flex: 1;
          min-width: 200px;
        }
        .tabs-scroll {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.3) transparent;
        }
        .tabs-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .tabs-scroll::-webkit-scrollbar-thumb {
          background: rgba(100,116,139,0.3);
          border-radius: 4px;
        }
        .tab {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid transparent;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
          transition: all 0.1s ease;
          white-space: nowrap;
        }
        .tab:hover {
          background: #eef2ff;
          border-color: #c7d2fe;
        }
        .tab.active {
          background: #e0e7ff;
          border-color: #818cf8;
          color: #3730a3;
        }
        .tab-order {
          font-size: 11px;
          opacity: 0.6;
          font-weight: 500;
        }

        .actions-group {
          display: flex;
          gap: 4px;
        }
        .primary-actions {
          display: flex;
          gap: 8px;
        }

        /* Toolbar status row */
        .toolbar-status {
          padding: 12px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .toolbar-status div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Editor panel */
        .editor-panel {
          margin-top: 20px;
        }
        .editor-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .editor-badges {
          display: flex;
          gap: 8px;
        }
        .pad {
          padding: 20px;
        }

        /* Dynamic field styles (giữ nguyên từ file cũ) */
        .dynamic-object {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-left: 8px;
          border-left: 1px dashed #cbd5e1;
          padding-left: 12px;
        }
        .object-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .field-label {
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .dynamic-array {
          border: 1px solid #dbeafe;
          border-radius: 16px;
          padding: 12px;
          background: #f8fbff;
        }
        .array-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .array-label {
          font-weight: 950;
          font-size: 13px;
          text-transform: uppercase;
        }
        .array-add {
          font-size: 12px;
          padding: 4px 10px;
        }
        .array-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .array-item {
          border: 1px solid #dbeafe;
          border-radius: 14px;
          padding: 12px;
          background: #ffffff;
        }
        .array-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .array-item-index {
          font-weight: 950;
          font-size: 12px;
        }
        .array-remove {
          font-size: 12px;
          padding: 2px 8px;
          background: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
        }
        .array-empty {
          padding: 8px;
          text-align: center;
        }
        .dynamic-primitive {
          width: 100%;
        }
        .input2, .textarea2 {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: inherit;
          outline: none;
          padding: 12px;
        }
        .input2:focus, .textarea2:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.15);
        }
        .image-field {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .image-preview img {
          max-width: 100%;
          max-height: 150px;
          border-radius: 12px;
          border: 1px solid #dbeafe;
          background: #f8fafc;
          object-fit: cover;
        }
        .image-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
      `}</style>
      </div>
  );
}
