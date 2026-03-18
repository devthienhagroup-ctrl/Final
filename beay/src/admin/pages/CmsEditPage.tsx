import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  adminDeleteCmsImage,
  adminGetPage,
  adminPublish,
  adminSaveDraft,
  adminUploadCmsImage,
  type CmsLocale,
  type CmsPageDetail,
  type CmsSection,
  type CmsSectionLocale,
} from "../api/cms.api";
import { useAuth } from "../../app/auth";
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
  const descKeys = ["description", "desc", "body", "subtitle", "paragraphs", "content", "template"];
  return descKeys.some((dk) => key.toLowerCase().includes(dk));
}

function isImageKey(key: string | number): boolean {
  if (typeof key !== "string") return false;
  const imageKeys = ["img", "image", "bgurl", "logourl", "logosrc"];
  return imageKeys.some((ik) => key.toLowerCase().includes(ik));
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

function normalizeSearch(value: any) {
  return String(value ?? "").toLowerCase().trim();
}

function pathLabel(path: (string | number)[]) {
  return path.length ? path.join(".") : "root";
}

function valueMatchesSearch(value: any, keyword: string): boolean {
  const q = normalizeSearch(keyword);
  if (!q) return true;
  if (value === null || value === undefined) return false;

  if (Array.isArray(value)) {
    return value.some((item) => valueMatchesSearch(item, q));
  }

  if (typeof value === "object") {
    return Object.entries(value).some(([k, v]) => normalizeSearch(k).includes(q) || valueMatchesSearch(v, q));
  }

  return normalizeSearch(value).includes(q);
}

function fieldMatchesSearch(data: any, form: any, path: (string | number)[], keyword: string): boolean {
  const q = normalizeSearch(keyword);
  if (!q) return true;

  const pathText = normalizeSearch(pathLabel(path));
  if (pathText.includes(q)) return true;

  const lastKey = path[path.length - 1];
  if (normalizeSearch(lastKey).includes(q)) return true;

  return valueMatchesSearch(form, q) || valueMatchesSearch(data, q);
}

function sectionMatchesSearch(section: CmsSection, keyword: string): boolean {
  const q = normalizeSearch(keyword);
  if (!q) return true;

  if (normalizeSearch(section.key).includes(q)) return true;

  return (section.locales ?? []).some(
      (loc) => valueMatchesSearch(loc.draftData, q) || valueMatchesSearch(loc.publishedData, q)
  );
}


function countLeafFields(value: any): number {
  if (value === null || value === undefined) return 0;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countLeafFields(item), 0);
  if (typeof value === "object") return Object.values(value).reduce((sum, item) => sum + countLeafFields(item), 0);
  return 1;
}

// =====================
// Image Field Component – hiện tại dùng input text để nhập link
// =====================
function ImageField({
                      value,
                      disabled,
                      busy,
                      onUpload,
                      onRemove,
                    }: {
  value: string;
  disabled?: boolean;
  busy?: boolean;
  onUpload: (file: File, prevUrl: string) => Promise<void>;
  onRemove: (url: string) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerPick = () => {
    if (busy || disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await onUpload(file, value || "");
  };

  const handleRemove = async () => {
    if (!value || busy || disabled) return;
    await onRemove(value);
  };

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
              readOnly
              placeholder="URL hình ảnh"
          />
          <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
          />
          <button className="btn" type="button" onClick={triggerPick} disabled={busy || disabled}>
            {busy ? "Uploading..." : value ? "Replace" : "Upload"}
          </button>
          {value && (
              <button className="btn" type="button" onClick={handleRemove} disabled={busy || disabled}>
                {busy ? "Deleting..." : "Remove"}
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
  onImageUpload: (path: (string | number)[], file: File, prevUrl: string) => Promise<void>;
  onImageRemove: (path: (string | number)[], url: string) => Promise<void>;
  isImageBusy: (path: (string | number)[]) => boolean;
  searchTerm?: string;
}

function DynamicField({
                        data,
                        form,
                        path,
                        onFormChange,
                        onImageUpload,
                        onImageRemove,
                        isImageBusy,
                        searchTerm = "",
                      }: DynamicFieldProps) {
  if (data === null || data === undefined) {
    return <div className="muted">(no data)</div>;
  }

  if (!fieldMatchesSearch(data, form, path, searchTerm)) {
    return null;
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
                    <div className="array-item-meta">
                      <span className="array-item-index">#{idx + 1}</span>
                      <span className="field-path">{pathLabel([...path, idx])}</span>
                    </div>
                    <button className="btn array-remove" onClick={() => removeItem(idx)} type="button">
                      ✕
                    </button>
                  </div>
                  <DynamicField
                      data={data[idx] ?? data[0] ?? {}}
                      form={item}
                      path={[...path, idx]}
                      onFormChange={onFormChange}
                      onImageUpload={onImageUpload}
                      onImageRemove={onImageRemove}
                      isImageBusy={isImageBusy}
                      searchTerm={searchTerm}
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
                  <div className="field-head">
                    <div className="field-label">{key}</div>
                    <div className="field-path">{pathLabel([...path, key])}</div>
                  </div>
                  <DynamicField
                      data={childData}
                      form={childForm}
                      path={[...path, key]}
                      onFormChange={onFormChange}
                      onImageUpload={onImageUpload}
                      onImageRemove={onImageRemove}
                      isImageBusy={isImageBusy}
                      searchTerm={searchTerm}
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
          <ImageField
              value={inputValue}
              busy={isImageBusy(path)}
              onUpload={(file, prevUrl) => onImageUpload(path, file, prevUrl)}
              onRemove={(url) => onImageRemove(path, url)}
          />
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

function isManagedCloudImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes(".s3.cloudfly.vn/") || url.includes("/ayanavita-dev/");
}

function pathToKey(path: (string | number)[]) {
  return path.join(".");
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
  const [imageBusyMap, setImageBusyMap] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");


  const section = useMemo(() => page?.sections?.find((s) => s.id === sectionId) || null, [page, sectionId]);
  const key = section?.key || "unknown";

  const locInfo = useMemo(() => (section ? pickLocale(section, locale) || null : null), [section, locale]);
  const effectiveData = useMemo(() => locInfo?.draftData ?? locInfo?.publishedData ?? {}, [locInfo]);

  const sectionsSorted = useMemo(() => (page?.sections || []).slice().sort((a, b) => a.sortOrder - b.sortOrder), [page]);
  const filteredSections = useMemo(
      () => sectionsSorted.filter((s) => sectionMatchesSearch(s, searchTerm)),
      [sectionsSorted, searchTerm]
  );

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

  const withImageBusy = async (path: (string | number)[], work: () => Promise<void>) => {
    const k = pathToKey(path);
    setImageBusyMap((prev) => ({ ...prev, [k]: true }));
    try {
      await work();
    } finally {
      setImageBusyMap((prev) => ({ ...prev, [k]: false }));
    }
  };

  const handleImageUpload = async (path: (string | number)[], file: File, prevUrl: string) => {
    if (!token) {
      toast.push({ kind: "err", title: "Chưa có token", detail: "Vui lòng đăng nhập lại." });
      nav("/login", { replace: true });
      return;
    }

    await withImageBusy(path, async () => {
      const uploaded = await adminUploadCmsImage(token, file);
      setForm((prev: any) => setIn(prev, path, uploaded.url));

      if (prevUrl && prevUrl !== uploaded.url && isManagedCloudImageUrl(prevUrl)) {
        try {
          await adminDeleteCmsImage(token, prevUrl);
        } catch (e) {
          console.warn("delete old cms image failed", e);
        }
      }
    });
  };

  const handleImageRemove = async (path: (string | number)[], url: string) => {
    if (!token) {
      toast.push({ kind: "err", title: "Chưa có token", detail: "Vui lòng đăng nhập lại." });
      nav("/login", { replace: true });
      return;
    }

    await withImageBusy(path, async () => {
      if (url && isManagedCloudImageUrl(url)) {
        await adminDeleteCmsImage(token, url);
      }
      setForm((prev: any) => setIn(prev, path, ""));
    });
  };

  const isImageBusy = (path: (string | number)[]) => Boolean(imageBusyMap[pathToKey(path)]);

  const statusBadge = useMemo(() => {
    const st = (locInfo?.status || "").toUpperCase();
    if (!st) return <span className="badge off">NO LOCALE</span>;
    if (st.includes("PUBLISH")) return <span className="badge ok">PUBLISHED</span>;
    if (st.includes("DRAFT")) return <span className="badge warn">DRAFT</span>;
    return <span className="badge">{st}</span>;
  }, [locInfo]);

  const selectedIndex = useMemo(() => filteredSections.findIndex((s) => s.id === sectionId), [filteredSections, sectionId]);
  const totalFieldCount = useMemo(() => countLeafFields(effectiveData), [effectiveData]);
  const matchedSectionCount = filteredSections.length;
  const pageTitle = slug ? String(slug).replace(/[-_]/g, " ") : "CMS";

  return (
      <div className="aya-editor">
        <div className="aya-shell">
          <aside className="sidebar glass">
            <div className="sidebar-top">
              <div className="eyebrow">CMS Editor</div>
              <div className="page-title">{pageTitle}</div>
              <div className="page-subtitle">
                Tập trung vào section, key và nội dung để tìm nhanh hơn, sửa ít bị lạc hơn.
              </div>
            </div>

            <div className="search-panel">
              <label className="panel-label">Tìm kiếm key</label>
              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                    className="search-input"
                    type="text"
                    placeholder="hero, title, image, button..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button className="search-clear" type="button" onClick={() => setSearchTerm("")}>
                      Xóa
                    </button>
                )}
              </div>
              <div className="search-meta">
                {searchTerm
                    ? `${matchedSectionCount}/${sectionsSorted.length} section khớp • lọc theo key + nội dung`
                    : "Tìm theo section key, field path, field key và cả text hiện có."}
              </div>
            </div>

            {/*<div className="sidebar-stats">*/}
            {/*  <div className="stat-card">*/}
            {/*    <div className="stat-label">Sections</div>*/}
            {/*    <div className="stat-value">{sectionsSorted.length}</div>*/}
            {/*  </div>*/}
            {/*  <div className="stat-card">*/}
            {/*    <div className="stat-label">Kết quả</div>*/}
            {/*    <div className="stat-value">{matchedSectionCount}</div>*/}
            {/*  </div>*/}
            {/*  <div className="stat-card">*/}
            {/*    <div className="stat-label">Field</div>*/}
            {/*    <div className="stat-value">{totalFieldCount}</div>*/}
            {/*  </div>*/}
            {/*  <div className="stat-card">*/}
            {/*    <div className="stat-label">Trạng thái</div>*/}
            {/*    <div className={`stat-pill ${dirty ? "warn" : "ok"}`}>{dirty ? "Unsaved" : "Saved"}</div>*/}
            {/*  </div>*/}
            {/*</div>*/}

            <div className="locale-switcher">
              {(["vi", "en", "de"] as CmsLocale[]).map((l) => {
                const active = locale === l;
                return (
                    <button
                        key={l}
                        className={`locale-chip ${active ? "active" : ""}`}
                        onClick={() => guardedSwitch(l)}
                        type="button"
                    >
                      {l.toUpperCase()}
                    </button>
                );
              })}
            </div>

            <div className="sections-head">
              <div>Danh sách section</div>
              <div className="muted">{selectedIndex >= 0 ? `Đang chọn ${selectedIndex + 1}` : "Chưa chọn"}</div>
            </div>

            <div className="section-list">
              {filteredSections.length ? (
                  filteredSections.map((s, idx) => {
                    const active = s.id === sectionId;
                    const secLoc = pickLocale(s, locale);
                    const secStatus = String(secLoc?.status || "NO LOCALE").toUpperCase();
                    return (
                        <button
                            key={s.id}
                            className={`section-item ${active ? "active" : ""}`}
                            onClick={() => guardedSwitch(locale, s.id)}
                            type="button"
                        >
                          <div className="section-item-top">
                            <span className="section-index">{String(idx + 1).padStart(2, "0")}</span>
                            <span className={`mini-status ${secStatus.includes("PUBLISH") ? "ok" : secStatus.includes("DRAFT") ? "warn" : "off"}`}>
                        {secStatus.replace("_", " ")}
                      </span>
                          </div>
                          <div className="section-key">{s.key}</div>
                          <div className="section-meta-row">
                            <span>#{s.sortOrder}</span>
                            <span>{countLeafFields((pickLocale(s, locale)?.draftData ?? pickLocale(s, locale)?.publishedData ?? {}))} field</span>
                          </div>
                        </button>
                    );
                  })
              ) : (
                  <div className="empty-search">
                    <div className="empty-search-title">Không có section phù hợp</div>
                    <div className="muted">Thử key ngắn hơn như hero, title, button, image…</div>
                  </div>
              )}
            </div>
          </aside>

          <main className="main-pane">
            <div className="topbar glass">
              <div className="topbar-left">
                <button className="btn" onClick={() => nav(-1)} type="button">
                  Quay lại
                </button>
                <button className="btn" onClick={load} disabled={loading}>
                  {loading ? "Loading…" : "Refresh"}
                </button>
                {statusBadge}
              </div>

              <div className="topbar-right">
                <button className="btn" onClick={onCopyPublishedToDraft} disabled={!section}>
                  Copy Published
                </button>
                <button className="btn" onClick={onReset} disabled={!dirty}>
                  Reset
                </button>
                <button className="btn btn-primary" onClick={onSaveDraft} disabled={!section || saving}>
                  {saving ? "Saving…" : "Save Draft"}
                </button>
                <button className="btn btn-success" onClick={onPublish} disabled={!section || publishing}>
                  {publishing ? "Publishing…" : "Publish"}
                </button>
              </div>
            </div>

            <div className="hero glass">
              <div>
                <div className="eyebrow">Đang chỉnh sửa</div>
                <div className="hero-title">
                  {section ? section.key : "Chưa có section"}
                  {saving ? (
                      <span className="dirty">● Saving…</span>
                  ) : dirty ? (
                      <span className="dirty">● Unsaved</span>
                  ) : (
                      <span className="saved">✓ Saved</span>
                  )}
                </div>
                <div className="page-subtitle">
                  {AUTOSAVE ? "Đang dùng auto-save." : "Đang dùng save thủ công."} Tập trung chỉnh nội dung theo field path để đỡ lạc key.
                </div>
              </div>
              <div className="hero-grid">
                <div className="hero-chip">
                  <span>Locale</span>
                  <strong>{locale.toUpperCase()}</strong>
                </div>
                <div className="hero-chip">
                  <span>Published</span>
                  <strong>{fmtDate((locInfo as any)?.publishedAt)}</strong>
                </div>
                <div className="hero-chip">
                  <span>Updated</span>
                  <strong>{fmtDate((locInfo as any)?.updatedAt)}</strong>
                </div>
                <div className="hero-chip">
                  <span>Status</span>
                  <strong>{locInfo?.status || "NO LOCALE"}</strong>
                </div>
              </div>
            </div>

            <div className="editor-panel glass">
              {!section ? (
                  <div className="pad muted">Chưa có section để chỉnh.</div>
              ) : (
                  <>
                    <div className="editor-header">
                      <div>
                        <div className="h2">{key.toUpperCase()} CONTENT</div>
                        <div className="muted">
                          Hiển thị field path rõ hơn để bạn nhìn ra key nhanh.
                          {searchTerm ? ` • đang lọc: "${searchTerm}"` : ""}
                        </div>
                      </div>
                      <div className="editor-badges">
                        <span className="badge">{totalFieldCount} fields</span>
                        {saving && <span className="badge warn">SAVING…</span>}
                        <span className={`badge ${dirty ? "warn" : "ok"}`}>
                      {dirty ? "UNSAVED" : "SAVED"}
                    </span>
                      </div>
                    </div>
                    <div className="editor-tip">
                      <span>Gợi ý:</span> tìm bằng <b>title</b>, <b>description</b>, <b>button</b>, <b>image</b>, <b>hero</b> để nhảy đúng vùng nhanh hơn.
                    </div>
                    <div className="pad dynamic-editor">
                      {fieldMatchesSearch(effectiveData, form, [], searchTerm) ? (
                          <DynamicField
                              data={effectiveData}
                              form={form}
                              path={[]}
                              onFormChange={handleFormChange}
                              onImageUpload={handleImageUpload}
                              onImageRemove={handleImageRemove}
                              isImageBusy={isImageBusy}
                              searchTerm={searchTerm}
                          />
                      ) : (
                          <div className="empty-search">
                            <div className="empty-search-title">Không thấy field nào khớp</div>
                            <div className="muted">Thử tìm bằng key ngắn hơn như title, hero, image, description…</div>
                          </div>
                      )}
                    </div>
                  </>
              )}
            </div>
          </main>
        </div>
        <style>{`
        .aya-editor {
          min-height: 100vh;
          color: #1e293b;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 30%),
            radial-gradient(circle at top right, rgba(16, 185, 129, 0.08), transparent 26%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 52%, #f8fafc 100%);
          padding: 24px;
        }
        .aya-shell {
          max-width: 1520px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 340px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }
        .glass {
          border-radius: 24px;
          border: 1px solid rgba(203, 213, 225, 0.9);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
        }
        .sidebar {
          position: sticky;
          top: 24px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(100vh - 48px);
          overflow: hidden;
        }
        .sidebar-top {
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 8px;
        }
        .page-title {
          font-size: 28px;
          font-weight: 900;
          line-height: 1.05;
          color: #0f172a;
        }
        .page-subtitle {
          margin-top: 8px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
        }
        .panel-label, .sections-head {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #475569;
        }
        .search-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-radius: 18px;
          border: 1px solid #cbd5e1;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        .search-box:focus-within {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }
        .search-icon {
          color: #94a3b8;
          font-size: 18px;
          flex: 0 0 auto;
        }
        .search-input {
          flex: 1;
          min-width: 0;
          height: 50px;
          border: 0;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
        }
        .search-clear {
          border: 0;
          background: #eef2ff;
          color: #4338ca;
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .search-meta, .muted {
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }
        .sidebar-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .stat-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
        .stat-label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
        }
        .stat-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          border-radius: 999px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 900;
        }
        .stat-pill.ok { background: #dcfce7; color: #166534; }
        .stat-pill.warn { background: #fef3c7; color: #92400e; }
        .locale-switcher {
          display: flex;
          gap: 8px;
        }
        .locale-chip {
          flex: 1;
          height: 40px;
          border-radius: 14px;
          border: 1px solid #dbeafe;
          background: #f8fafc;
          font-weight: 800;
          color: #334155;
          cursor: pointer;
        }
        .locale-chip.active {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff;
          border-color: #4338ca;
          box-shadow: 0 10px 24px rgba(79, 70, 229, 0.22);
        }
        .sections-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 4px;
        }
        .section-list {
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }
        .section-item {
          text-align: left;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          cursor: pointer;
          transition: 0.18s ease;
        }
        .section-item:hover {
          transform: translateY(-1px);
          border-color: #c7d2fe;
          box-shadow: 0 10px 26px rgba(99, 102, 241, 0.12);
        }
        .section-item.active {
          border-color: #818cf8;
          background: linear-gradient(180deg, #eef2ff 0%, #ffffff 100%);
          box-shadow: 0 12px 28px rgba(99, 102, 241, 0.16);
        }
        .section-item-top, .section-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .section-index {
          font-size: 11px;
          font-weight: 900;
          color: #94a3b8;
        }
        .section-key {
          margin: 10px 0 8px;
          font-size: 16px;
          font-weight: 850;
          color: #0f172a;
          word-break: break-word;
        }
        .section-meta-row {
          font-size: 12px;
          color: #64748b;
        }
        .mini-status {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-radius: 999px;
          padding: 4px 8px;
          border: 1px solid transparent;
        }
        .mini-status.ok { background: #dcfce7; color: #166534; }
        .mini-status.warn { background: #fef3c7; color: #92400e; }
        .mini-status.off { background: #e2e8f0; color: #475569; }

        .main-pane {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .topbar {
          position: sticky;
          top: 24px;
          z-index: 10;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .topbar-left, .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #0f172a;
          cursor: pointer;
          transition: all 0.15s ease;
          line-height: 1;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #a5b4fc;
          background: #eef2ff;
        }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-primary { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #fff; border-color: #4338ca; }
        .btn-success { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #fff; border-color: #047857; }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        }
        .badge.ok { background: #dcfce7; border-color: #86efac; color: #166534; }
        .badge.warn { background: #fef3c7; border-color: #fde68a; color: #92400e; }
        .badge.off { background: #e2e8f0; border-color: #cbd5e1; color: #475569; }
        .dirty, .saved {
          display: inline-flex;
          align-items: center;
          margin-left: 10px;
          font-size: 12px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
        }
        .dirty { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .saved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
          gap: 16px;
          padding: 20px;
        }
        .hero-title {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 32px;
          font-weight: 950;
          color: #0f172a;
          line-height: 1.08;
          margin-bottom: 8px;
          word-break: break-word;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .hero-chip {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
        .hero-chip span {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .hero-chip strong {
          display: block;
          font-size: 14px;
          color: #0f172a;
          word-break: break-word;
        }
        .editor-panel { overflow: hidden; }
        .editor-header {
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid #e2e8f0;
        }
        .h2 {
          font-size: 14px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .editor-badges { display: flex; gap: 8px; flex-wrap: wrap; }
        .editor-tip {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 12px 22px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #475569;
          font-size: 13px;
          flex-wrap: wrap;
        }
        .editor-tip span { font-weight: 800; color: #0f172a; }
        .pad { padding: 22px; }

        .dynamic-editor {
          background: linear-gradient(180deg, rgba(248, 250, 252, 0.72) 0%, rgba(255,255,255,0.96) 100%);
        }
        .dynamic-object {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .object-field {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
        }
        .field-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .field-label {
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #334155;
        }
        .field-path {
          font-size: 11px;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 5px 10px;
          line-height: 1.2;
          word-break: break-word;
        }
        .dynamic-array {
          border: 1px solid #dbeafe;
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }
        .array-header, .array-item-header, .array-item-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .array-label, .array-item-index {
          font-weight: 900;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0f172a;
        }
        .array-add { height: 34px; font-size: 12px; }
        .array-items { display: flex; flex-direction: column; gap: 14px; margin-top: 10px; }
        .array-item {
          border: 1px solid #dbeafe;
          border-radius: 16px;
          padding: 12px;
          background: #fff;
        }
        .array-remove {
          height: 32px;
          padding: 0 10px;
          background: #fee2e2;
          border-color: #fecaca;
          color: #991b1b;
        }
        .array-empty { text-align: center; padding: 10px; }
        .dynamic-primitive { width: 100%; }
        .input2, .textarea2 {
          width: 100%;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #0f172a;
          outline: none;
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.55;
          transition: 0.15s ease;
        }
        .input2:focus, .textarea2:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }
        .textarea2 { min-height: 120px; resize: vertical; }
        .image-field { display: flex; flex-direction: column; gap: 12px; }
        .image-preview img {
          display: block;
          width: 100%;
          max-width: 360px;
          max-height: 220px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid #dbeafe;
          background: #f8fafc;
        }
        .image-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .empty-search {
          border: 1px dashed #cbd5e1;
          border-radius: 18px;
          padding: 22px;
          text-align: center;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
        .empty-search-title {
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 6px;
          color: #0f172a;
        }

        @media (max-width: 1180px) {
          .aya-shell { grid-template-columns: 1fr; }
          .sidebar { position: static; max-height: none; }
          .topbar { position: static; }
        }
        @media (max-width: 860px) {
          .aya-editor { padding: 14px; }
          .hero { grid-template-columns: 1fr; }
          .hero-grid, .sidebar-stats { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .page-title { font-size: 24px; }
          .hero-title { font-size: 24px; }
          .hero-grid, .sidebar-stats { grid-template-columns: 1fr; }
          .pad, .editor-header, .editor-tip, .topbar, .sidebar { padding-left: 14px; padding-right: 14px; }
          .image-actions, .topbar-right, .topbar-left { align-items: stretch; }
          .btn { width: 100%; }
          .topbar-left, .topbar-right { width: 100%; }
        }
      `}</style>
      </div>
  );
}
