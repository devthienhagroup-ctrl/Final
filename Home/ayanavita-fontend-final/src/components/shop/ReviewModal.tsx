import React, { useMemo, useState } from "react";
import { Modal } from "../common/Modal";

export type ReviewModalCmsData = {
  modalSubTitle: string;
  titleDefault: string;
  titleWithProductTemplate: string; // e.g. "Đánh giá: {productName}"

  labelName: string;
  placeholderName: string;

  labelStars: string;
  starsValues: number[];
  starIconClass: string; // fontawesome class
  chosenPrefix: string;
  chosenSuffix: string;

  labelText: string;
  placeholderText: string;

  submitText: string;
  submitIconClass: string; // fontawesome class

  alertMissingText: string;
  submitSuccessMessage: string;
};

export const defaultReviewModalCmsData: ReviewModalCmsData = {
  modalSubTitle: "Viết đánh giá",
  titleDefault: "Viết đánh giá",
  titleWithProductTemplate: "Đánh giá: {productName}",

  labelName: "Tên của bạn",
  placeholderName: "Ví dụ: Minh Anh",

  labelStars: "Số sao",
  starsValues: [1, 2, 3, 4, 5],
  starIconClass: "fa-solid fa-star",
  chosenPrefix: "Bạn chọn:",
  chosenSuffix: "★",

  labelText: "Nội dung",
  placeholderText: "Kết cấu, mùi, hiệu quả...",

  submitText: "Gửi đánh giá",
  submitIconClass: "fa-solid fa-paper-plane",

  alertMissingText: "Vui lòng nhập nội dung đánh giá.",
  submitSuccessMessage: "Đã gửi đánh giá (demo). Cảm ơn bạn.",
};

export function ReviewModal({
                              open,
                              onClose,
                              productName,
                              onSubmit,
                              cmsData,
                            }: {
  open: boolean;
  onClose: () => void;
  productName: string;
  onSubmit: (x: { name: string; stars: number; text: string }) => void;
  cmsData?: Partial<ReviewModalCmsData>;
}) {
  const [name, setName] = useState("");
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const cms = useMemo<ReviewModalCmsData>(() => {
    // cmsData chỉ chứa nội dung; merge nhẹ tay với default
    return {
      ...defaultReviewModalCmsData,
      ...(cmsData ?? {}),
    };
  }, [cmsData]);

  const title = useMemo(() => {
    if (productName) return cms.titleWithProductTemplate.replaceAll("{productName}", productName);
    return cms.titleDefault;
  }, [cms.titleDefault, cms.titleWithProductTemplate, productName]);

  function submit() {
    if (!text.trim()) {
      window.alert(cms.alertMissingText);
      return;
    }
    onSubmit({ name: name.trim(), stars, text: text.trim() });
    setMsg(cms.submitSuccessMessage);
    setTimeout(() => setMsg(""), 2000);
  }

  return (
      <Modal
          open={open}
          onClose={onClose}
          subTitle={cms.modalSubTitle}
          title={title}
          maxWidthClass="max-w-xl"
          zIndexClass="z-[90]"
      >
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.labelName}</label>
            <input
                className="field mt-2"
                placeholder={cms.placeholderName}
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.labelStars}</label>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {cms.starsValues.map((s) => (
                  <button
                      key={s}
                      className={`btn w-11 h-11 p-0 ${stars >= s ? "ring-2 ring-amber-200" : ""}`}
                      type="button"
                      onClick={() => setStars(s)}
                  >
                    <i className={cms.starIconClass} />
                  </button>
              ))}
              <span className="chip">
              {cms.chosenPrefix} <span className="ml-1">{stars}</span>
                {cms.chosenSuffix}
            </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.labelText}</label>
            <textarea
                className="field mt-2"
                rows={4}
                placeholder={cms.placeholderText}
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
          </div>

          <button className="btn btn-primary w-full" type="button" onClick={submit}>
            <i className={`${cms.submitIconClass} mr-2`} /> {cms.submitText}
          </button>

          {msg ? (
              <div className="rounded-2xl bg-emerald-50 text-emerald-800 p-4 ring-1 ring-emerald-200 text-sm font-extrabold">
                {msg}
              </div>
          ) : null}
        </div>
      </Modal>
  );
}