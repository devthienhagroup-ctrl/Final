import React from "react";
import Swal from "sweetalert2";

type Props = {
    cms: any;
    subscriptionLoading: boolean;
    subscriptionError: string | null;
    currentPass: any;
    publicPlans: any[];
    focusedPlanId: number | null;
    subscriptionActionPlanId: number | null;
    passHistory: any[];
    paymentHistory: any[];
    planPaymentModal: any;
    planQrCountdown: { expired: boolean; text: string };
    planQrExpiresAt: string | null;
    setPlanPaymentModal: React.Dispatch<React.SetStateAction<any>>;
    onStartPlanCheckout: (plan: any, method: any) => void | Promise<void>;
    openPlanPaymentModal: (payment: any) => void;
    onCancelAutoRenewal?: (pass: any) => void | Promise<void>;
    onResumeAutoRenewal?: (pass: any) => boolean | void | Promise<boolean | void>;
    formatDate: (date: string | null) => string;
    formatDateTime: (date: string | null | undefined) => string;
    formatMoney: (amount: number) => string;
    formatDurationDays: (days: number, durationUnits: any) => string;
    getPassStatusLabel: (status: any, labels: any) => string;
    getPaymentStatusLabel: (status: any, labels: any) => string;
    passStatusStyles: Record<string, string>;
    planPaymentStatusStyles: Record<string, string>;
};

function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function toTime(value: string | null | undefined) {
    if (!value) return null;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
}

function isPassEffectiveNow(pass: any, now: number) {
    const start = toTime(pass?.startAt);
    const end = toTime(pass?.endAt);
    const graceUntil = toTime(pass?.graceUntil);

    if (start == null) return false;
    if (now < start) return false;

    const activeEnd = graceUntil ?? end;
    if (activeEnd == null) return false;

    return now <= activeEnd;
}

function getDisplayPassStatus(pass: any, now = Date.now()) {
    const start = toTime(pass?.startAt);
    if (!pass?.canceledAt && start != null && start > now) return "SCHEDULED";
    return pass?.computedStatus;
}

function getCurrentEffectivePass(currentPass: any, passHistory: any[]) {
    const now = Date.now();
    const allPasses = [currentPass, ...(passHistory || [])].filter(Boolean);

    const effective = allPasses
        .filter((pass) => isPassEffectiveNow(pass, now))
        .sort((a, b) => {
            const aStart = toTime(a?.startAt) ?? 0;
            const bStart = toTime(b?.startAt) ?? 0;
            return bStart - aStart;
        });

    return effective[0] || null;
}

type PassRenewalState = "AUTO_RENEW_ACTIVE" | "AUTO_RENEW_CANCELED" | "NONE";
type RenewalMode = "none" | "scheduled_cancel" | "auto_renew_on";

function getScheduledPass(currentPass: any, passHistory: any[]) {
    const now = Date.now();
    const allPasses = [currentPass, ...(passHistory || [])].filter(Boolean);

    const scheduled = allPasses
        .filter((pass) => {
            const start = toTime(pass?.startAt);
            return start != null && start > now && !pass?.canceledAt;
        })
        .sort((a, b) => (toTime(a?.startAt) ?? 0) - (toTime(b?.startAt) ?? 0));

    return scheduled[0] || null;
}

function getRelatedPayments(pass: any, paymentHistory: any[]) {
    return (paymentHistory || []).filter((payment) => {
        if (!payment || !pass) return false;

        if (pass.purchaseId && payment.id && String(pass.purchaseId) === String(payment.id)) return true;
        if (pass.purchaseId && payment.code && String(pass.purchaseId) === String(payment.code)) return true;
        if (pass.paymentId && payment.id && String(pass.paymentId) === String(payment.id)) return true;

        return false;
    });
}

function getPassRenewalState(pass: any, paymentHistory: any[]): PassRenewalState {
    const relatedPayments = getRelatedPayments(pass, paymentHistory)
        .slice()
        .sort((a, b) => {
            const aTime = toTime(a?.paidAt) ?? toTime(a?.createdAt) ?? 0;
            const bTime = toTime(b?.paidAt) ?? toTime(b?.createdAt) ?? 0;
            return bTime - aTime;
        });

    const latestSubscriptionPayment = relatedPayments.find(
        (payment) => Boolean(payment?.stripeSubscriptionId || payment?.subscriptionId),
    );

    if (latestSubscriptionPayment) {
        const status = String(
            latestSubscriptionPayment?.subscriptionStatus || latestSubscriptionPayment?.subscription?.status || "",
        ).toLowerCase();

        const cancelAtPeriodEnd = Boolean(
            latestSubscriptionPayment?.cancelAtPeriodEnd ?? latestSubscriptionPayment?.subscription?.cancelAtPeriodEnd,
        );

        if (cancelAtPeriodEnd || status === "canceled") {
            return "AUTO_RENEW_CANCELED";
        }

        return "AUTO_RENEW_ACTIVE";
    }

    const source = [pass, ...relatedPayments]
        .flatMap((x) => [
            x?.paymentMethod,
            x?.method,
            x?.paymentType,
            x?.checkoutMethod,
            x?.provider,
            x?.purpose,
            x?.stripeMode,
            x?.source,
            x?.channel,
            x?.kind,
            x?.type,
            x?.stripeSubscriptionId ? "STRIPE_SUBSCRIPTION" : null,
            x?.subscriptionId ? "STRIPE_SUBSCRIPTION" : null,
            x?.sepay ? "SEPAY" : null,
        ])
        .filter(Boolean)
        .map((x) => String(x).toUpperCase());

    if (source.some((x) => x.includes("SUBSCRIPTION") || x.includes("RECURRING"))) {
        return "AUTO_RENEW_ACTIVE";
    }

    return "NONE";
}

function getRenewalMode(pass: any, paymentHistory: any[]): RenewalMode {
    const state = getPassRenewalState(pass, paymentHistory);
    if (state === "AUTO_RENEW_ACTIVE") return "auto_renew_on";
    if (state === "AUTO_RENEW_CANCELED") return "scheduled_cancel";
    return "none";
}

function getDialogBaseOptions() {
    return {
        width: 760,
        showConfirmButton: true,
        showCancelButton: true,
        focusConfirm: false,
        reverseButtons: false,
        buttonsStyling: false,
        customClass: {
            popup: "rounded-[24px] text-left",
            title: "text-slate-900 text-xl font-extrabold",
            htmlContainer: "m-0",
            confirmButton:
                "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
            cancelButton:
                "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none",
            actions: "w-full flex gap-3 justify-end mt-6 pe-6",
        },
    } as const;
}

function getDialogSharedStyle() {
    return `
      <style>
        .aya-dialog {
          font-family: inherit;
        }

        .aya-dialog .aya-plan-box {
          border: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }

        .aya-dialog .aya-plan-name {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .aya-dialog .aya-plan-price {
          font-size: 14px;
          font-weight: 700;
          color: #475569;
        }

        .aya-dialog .aya-segment {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }

        .aya-dialog .aya-segment-btn,
        .aya-dialog .aya-radio-card,
        .aya-dialog .aya-warning-card {
          width: 100%;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          border-radius: 14px;
          padding: 14px 16px;
          text-align: left;
          cursor: pointer;
          transition: all .18s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .aya-dialog .aya-segment-btn:hover,
        .aya-dialog .aya-radio-card:hover {
          border-color: #818cf8;
          background: #f8faff;
        }

        .aya-dialog .aya-segment-btn.active,
        .aya-dialog .aya-radio-card.active {
          border-color: #6366f1;
          background: #eef2ff;
          color: #312e81;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .aya-dialog .aya-segment-title,
        .aya-dialog .aya-radio-title,
        .aya-dialog .aya-warning-title,
        .aya-dialog .aya-panel-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .aya-dialog .aya-segment-desc,
        .aya-dialog .aya-radio-desc,
        .aya-dialog .aya-warning-desc {
          font-size: 13px;
          line-height: 1.55;
          color: #64748b;
        }

        .aya-dialog .aya-submethods {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .aya-dialog .aya-panel {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 18px;
          padding: 16px;
          margin-top: 14px;
        }

        .aya-dialog .aya-list {
          margin: 0;
          padding-left: 18px;
          color: #475569;
          font-size: 13px;
          line-height: 1.7;
        }

        .aya-dialog .aya-list li + li {
          margin-top: 4px;
        }

        .aya-dialog .aya-hidden {
          display: none;
        }

        .aya-dialog .aya-note {
          margin-top: 12px;
          font-size: 12px;
          color: #64748b;
        }

        .aya-dialog .aya-warning-stack {
          display: grid;
          gap: 12px;
        }

        .aya-dialog .aya-warning-card {
          cursor: default;
        }

        .aya-dialog .aya-warning-card.warning {
          border-color: #fdba74;
          background: linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%);
        }

        .aya-dialog .aya-warning-card.info {
          border-color: #c7d2fe;
          background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
        }

        .aya-dialog .aya-muted {
          font-size: 13px;
          line-height: 1.6;
          color: #475569;
        }
      </style>
    `;
}

export default function SubscriptionsTab({
                                             cms,
                                             subscriptionLoading,
                                             subscriptionError,
                                             currentPass,
                                             publicPlans,
                                             focusedPlanId,
                                             subscriptionActionPlanId,
                                             passHistory,
                                             paymentHistory,
                                             planPaymentModal,
                                             planQrCountdown,
                                             planQrExpiresAt,
                                             setPlanPaymentModal,
                                             onStartPlanCheckout,
                                             openPlanPaymentModal,
                                             onCancelAutoRenewal,
                                             onResumeAutoRenewal,
                                             formatDate,
                                             formatDateTime,
                                             formatMoney,
                                             formatDurationDays,
                                             getPassStatusLabel,
                                             getPaymentStatusLabel,
                                             passStatusStyles,
                                             planPaymentStatusStyles,
                                         }: Props) {
    const effectiveCurrentPass = getCurrentEffectivePass(currentPass, passHistory);
    const scheduledPass = getScheduledPass(currentPass, passHistory);
    const hasScheduledPass = Boolean(scheduledPass);
    const currentPlanId = effectiveCurrentPass?.plan?.id ?? null;
    const currentPassRenewalState = effectiveCurrentPass ? getPassRenewalState(effectiveCurrentPass, paymentHistory) : "NONE";
    const renewalMode: RenewalMode = effectiveCurrentPass ? getRenewalMode(effectiveCurrentPass, paymentHistory) : "none";
    const currentPlanPrice = effectiveCurrentPass?.plan?.price != null ? Number(effectiveCurrentPass.plan.price) : null;

    async function ensureLoggedIn() {
        if (!localStorage.getItem("aya_access_token")) {
            window.location.href = "/login";
            return false;
        }
        return true;
    }

    async function openCheckoutMethodDialog(plan: any) {
        const ok = await ensureLoggedIn();
        if (!ok) return;

        const title = cms?.tabs?.subscriptions?.actions?.choosePaymentMethodTitle || "Chọn phương thức thanh toán";
        const oneTimeLabel = cms?.tabs?.subscriptions?.actions?.oneTimeLabel || "Đăng ký 1 lần";
        const recurringLabel = cms?.tabs?.subscriptions?.actions?.recurringLabel || "Đăng ký gia hạn tự động";
        const qrLabel = cms?.tabs?.subscriptions?.actions?.chooseQr || "QR code";
        const cardLabel = cms?.tabs?.subscriptions?.actions?.chooseStripeOneTime || "Card";
        const payBtnLabel = cms?.tabs?.subscriptions?.actions?.payNow || "Thanh toán ngay";
        const cancelBtnLabel = cms?.common?.actions?.close || "Đóng";

        const recurringInfoTitle =
            cms?.tabs?.subscriptions?.actions?.recurringInfoTitle || "Đăng ký tự động gia hạn tiện lợi";
        const recurringInfoItems: string[] =
            cms?.tabs?.subscriptions?.actions?.recurringInfoItems || [
                "Thanh toán nhanh chóng bằng thẻ qua Stripe.",
                "Gói sử dụng được tự động gia hạn vào cuối kỳ.",
                "Không cần thao tác thanh toán mỗi lần.",
                "Dễ dàng quản lý và hủy tự động gia hạn khi cần.",
                "Thanh toán an toàn, bảo mật qua Stripe.",
                "Phù hợp nếu bạn muốn duy trì dịch vụ liên tục.",
            ];

        const priceText = formatMoney(plan?.price || 0);

        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title,
            confirmButtonText: payBtnLabel,
            cancelButtonText: cancelBtnLabel,
            html: `
      <div id="aya-checkout-dialog" class="aya-dialog text-left">
        ${getDialogSharedStyle()}

        <div class="aya-plan-box">
          <div class="aya-plan-name">
            <i class="fa-solid fa-crown" style="margin-right:8px;color:#6366f1;"></i>
            ${plan?.name || ""}
          </div>
          <div class="aya-plan-price">
            ${priceText}
          </div>
        </div>

        <div class="aya-segment">
          <button type="button" class="aya-segment-btn" id="aya-mode-one-time" data-mode="ONE_TIME">
            <div class="aya-segment-title">
              <i class="fa-regular fa-credit-card"></i>
              ${oneTimeLabel}
            </div>
            <div class="aya-segment-desc">
              Thanh toán một lần, không tự động gia hạn. Phù hợp khi bạn muốn chủ động quyết định mỗi kỳ sử dụng.
            </div>
          </button>

          <button type="button" class="aya-segment-btn active" id="aya-mode-recurring" data-mode="SUBSCRIPTION">
            <div class="aya-segment-title">
              <i class="fa-solid fa-arrows-rotate"></i>
              ${recurringLabel}
            </div>
            <div class="aya-segment-desc">
              Tự động gia hạn theo chu kỳ để trải nghiệm không bị gián đoạn và không cần thao tác thanh toán lại mỗi tháng.
            </div>
          </button>
        </div>

        <div id="aya-one-time-panel" class="aya-panel aya-hidden">
          <div class="aya-panel-title">
            <i class="fa-solid fa-wallet" style="color:#6366f1;"></i>
            Chọn phương thức thanh toán 1 lần
          </div>

          <div class="aya-submethods">
            <button type="button" class="aya-radio-card active" id="aya-method-qr" data-method="SEPAY">
              <div class="aya-radio-title">
                <i class="fa-solid fa-qrcode" style="color:#059669;"></i>
                ${qrLabel}
              </div>
              <div class="aya-radio-desc">
                Quét mã QR để chuyển khoản nhanh qua ngân hàng. Phù hợp nếu bạn muốn thanh toán thủ công ngay tại thời điểm này.
              </div>
            </button>

            <button type="button" class="aya-radio-card" id="aya-method-card" data-method="STRIPE_ONE_TIME">
              <div class="aya-radio-title">
                <i class="fa-solid fa-credit-card" style="color:#2563eb;"></i>
                ${cardLabel}
              </div>
              <div class="aya-radio-desc">
                Thanh toán một lần bằng thẻ qua Stripe, nhanh gọn và an toàn.
              </div>
            </button>
          </div>

          <div class="aya-note">
            Bạn chỉ thanh toán cho một kỳ sử dụng này. Khi hết hạn, bạn có thể chủ động gia hạn lại nếu cần.
          </div>
        </div>

        <div id="aya-recurring-panel" class="aya-panel">
          <div class="aya-panel-title">
            <i class="fa-solid fa-shield-heart" style="color:#7c3aed;"></i>
            ${recurringInfoTitle}
          </div>

          <ul class="aya-list">
            ${recurringInfoItems.map((item) => `<li>${item}</li>`).join("")}
          </ul>

          <div class="aya-note">
            Hình thức thanh toán định kỳ được xử lý qua Stripe subscription và sẽ tự động thu tiền vào đầu kỳ mới.
          </div>
        </div>
      </div>
    `,
            didOpen: () => {
                const root = document.getElementById("aya-checkout-dialog");
                if (!root) return;

                let selectedMode: "ONE_TIME" | "SUBSCRIPTION" = "SUBSCRIPTION";
                let selectedOneTimeMethod: "SEPAY" | "STRIPE_ONE_TIME" = "SEPAY";

                const btnOneTime = root.querySelector<HTMLButtonElement>("#aya-mode-one-time");
                const btnRecurring = root.querySelector<HTMLButtonElement>("#aya-mode-recurring");
                const oneTimePanel = root.querySelector<HTMLElement>("#aya-one-time-panel");
                const recurringPanel = root.querySelector<HTMLElement>("#aya-recurring-panel");
                const btnQr = root.querySelector<HTMLButtonElement>("#aya-method-qr");
                const btnCard = root.querySelector<HTMLButtonElement>("#aya-method-card");

                const setMode = (mode: "ONE_TIME" | "SUBSCRIPTION") => {
                    selectedMode = mode;

                    btnOneTime?.classList.toggle("active", mode === "ONE_TIME");
                    btnRecurring?.classList.toggle("active", mode === "SUBSCRIPTION");

                    oneTimePanel?.classList.toggle("aya-hidden", mode !== "ONE_TIME");
                    recurringPanel?.classList.toggle("aya-hidden", mode !== "SUBSCRIPTION");
                };

                const setOneTimeMethod = (method: "SEPAY" | "STRIPE_ONE_TIME") => {
                    selectedOneTimeMethod = method;

                    btnQr?.classList.toggle("active", method === "SEPAY");
                    btnCard?.classList.toggle("active", method === "STRIPE_ONE_TIME");
                };

                btnOneTime?.addEventListener("click", () => setMode("ONE_TIME"));
                btnRecurring?.addEventListener("click", () => setMode("SUBSCRIPTION"));
                btnQr?.addEventListener("click", () => setOneTimeMethod("SEPAY"));
                btnCard?.addEventListener("click", () => setOneTimeMethod("STRIPE_ONE_TIME"));

                (window as any).__ayaCheckoutSelection = {
                    getMode: () => selectedMode,
                    getMethod: () => selectedOneTimeMethod,
                };
            },
            willClose: () => {
                delete (window as any).__ayaCheckoutSelection;
            },
            preConfirm: async () => {
                const selection = (window as any).__ayaCheckoutSelection;
                const mode = selection?.getMode?.() || "SUBSCRIPTION";
                const oneTimeMethod = selection?.getMethod?.() || "SEPAY";

                const checkoutMethod = mode === "SUBSCRIPTION" ? "STRIPE_SUBSCRIPTION" : oneTimeMethod;

                await onStartPlanCheckout(plan, checkoutMethod);
                return checkoutMethod;
            },
        });

        return result;
    }

    async function openOneTimeRenewDialog(plan: any) {
        const ok = await ensureLoggedIn();
        if (!ok) return;

        const title = cms?.tabs?.subscriptions?.actions?.renewNow || "Gia hạn";
        const payBtnLabel = cms?.tabs?.subscriptions?.actions?.payNow || "Thanh toán ngay";
        const cancelBtnLabel = cms?.common?.actions?.close || "Đóng";
        const qrLabel = cms?.tabs?.subscriptions?.actions?.chooseQr || "QR code";
        const cardLabel = cms?.tabs?.subscriptions?.actions?.chooseStripeOneTime || "Card";
        const priceText = formatMoney(plan?.price || 0);

        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title,
            confirmButtonText: payBtnLabel,
            cancelButtonText: cancelBtnLabel,
            html: `
      <div id="aya-renew-one-time-dialog" class="aya-dialog text-left">
        ${getDialogSharedStyle()}

        <div class="aya-plan-box">
          <div class="aya-plan-name">
            <i class="fa-solid fa-rotate-right" style="margin-right:8px;color:#6366f1;"></i>
            ${plan?.name || ""}
          </div>
          <div class="aya-plan-price">
            ${priceText}
          </div>
        </div>

        <div class="aya-panel" style="margin-top:0;">
          <div class="aya-panel-title">
            <i class="fa-solid fa-wallet" style="color:#6366f1;"></i>
            Chọn phương thức thanh toán 1 lần
          </div>

          <div class="aya-submethods">
            <button type="button" class="aya-radio-card active" id="aya-renew-method-qr" data-method="SEPAY">
              <div class="aya-radio-title">
                <i class="fa-solid fa-qrcode" style="color:#059669;"></i>
                ${qrLabel}
              </div>
              <div class="aya-radio-desc">
                Quét mã QR để chuyển khoản nhanh qua ngân hàng cho lần gia hạn này.
              </div>
            </button>

            <button type="button" class="aya-radio-card" id="aya-renew-method-card" data-method="STRIPE_ONE_TIME">
              <div class="aya-radio-title">
                <i class="fa-solid fa-credit-card" style="color:#2563eb;"></i>
                ${cardLabel}
              </div>
              <div class="aya-radio-desc">
                Thanh toán một lần bằng thẻ qua Stripe, thao tác nhanh và bảo mật.
              </div>
            </button>
          </div>

          <div class="aya-note">
            Đây là gia hạn cho một kỳ sử dụng. Hệ thống sẽ không tự động gia hạn các kỳ tiếp theo.
          </div>
        </div>
      </div>
    `,
            didOpen: () => {
                const root = document.getElementById("aya-renew-one-time-dialog");
                if (!root) return;

                let selectedMethod: "SEPAY" | "STRIPE_ONE_TIME" = "SEPAY";
                const btnQr = root.querySelector<HTMLButtonElement>("#aya-renew-method-qr");
                const btnCard = root.querySelector<HTMLButtonElement>("#aya-renew-method-card");

                const setMethod = (method: "SEPAY" | "STRIPE_ONE_TIME") => {
                    selectedMethod = method;
                    btnQr?.classList.toggle("active", method === "SEPAY");
                    btnCard?.classList.toggle("active", method === "STRIPE_ONE_TIME");
                };

                btnQr?.addEventListener("click", () => setMethod("SEPAY"));
                btnCard?.addEventListener("click", () => setMethod("STRIPE_ONE_TIME"));

                (window as any).__ayaRenewOneTimeSelection = {
                    getMethod: () => selectedMethod,
                };
            },
            willClose: () => {
                delete (window as any).__ayaRenewOneTimeSelection;
            },
            preConfirm: async () => {
                const method = (window as any).__ayaRenewOneTimeSelection?.getMethod?.() || "SEPAY";
                await onStartPlanCheckout(plan, method);
                return method;
            },
        });

        return result;
    }

    async function openUpgradeConfirmDialog(plan: any) {
        const continueLabel = cms?.tabs?.subscriptions?.actions?.continue || "Tiếp tục nâng cấp";
        const cancelBtnLabel = cms?.common?.actions?.close || "Đóng";
        const currentPlanName = effectiveCurrentPass?.plan?.name || "Gói hiện tại";
        const newPlanName = plan?.name || "Gói mới";

        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title: cms?.tabs?.subscriptions?.actions?.upgrade || "Nâng cấp gói",
            confirmButtonText: continueLabel,
            cancelButtonText: cancelBtnLabel,
            html: `
      <div class="aya-dialog text-left">
        ${getDialogSharedStyle()}

        <div class="aya-warning-stack">
          <div class="aya-warning-card warning">
            <div class="aya-warning-title">
              <i class="fa-solid fa-triangle-exclamation" style="color:#ea580c;"></i>
              Lưu ý trước khi nâng cấp
            </div>
            <div class="aya-warning-desc">
              Khi bạn nâng cấp, <b>${newPlanName}</b> sẽ được kích hoạt ngay sau khi thanh toán thành công.
              Gói hiện tại <b>${currentPlanName}</b> sẽ dừng hiệu lực và không tiếp tục dùng song song.
            </div>
          </div>

          <div class="aya-warning-card info">
            <div class="aya-warning-title">
              <i class="fa-solid fa-circle-info" style="color:#4f46e5;"></i>
              Xác nhận tiếp tục
            </div>
            <div class="aya-warning-desc">
              Hãy chỉ tiếp tục khi bạn đồng ý chuyển sang gói mới ngay tại thời điểm này.
            </div>
          </div>
        </div>
      </div>
    `,
        });

        return result.isConfirmed;
    }

    async function handleRenewCurrentPass() {
        if (!effectiveCurrentPass?.plan) return;
        if (hasScheduledPass) {
            await Swal.fire({
                icon: "info",
                title: "Đã có gói chờ kỳ sau",
                text: "Bạn đã có pass scheduled cho kỳ tiếp theo, nên chưa thể gia hạn thêm.",
            });
            return;
        }

        await openOneTimeRenewDialog(effectiveCurrentPass.plan);
    }

    async function handleSubscribeRecurringCurrentPass() {
        if (!effectiveCurrentPass?.plan) return;
        const ok = await ensureLoggedIn();
        if (!ok) return;

        if (hasScheduledPass) {
            await Swal.fire({
                icon: "info",
                title: "Đã có gói chờ kỳ sau",
                text: "Bạn đã có pass scheduled cho kỳ tiếp theo, chưa thể đăng ký thêm tự động gia hạn.",
            });
            return;
        }

        if (currentPassRenewalState === "AUTO_RENEW_CANCELED" && onResumeAutoRenewal) {
            const resumed = await onResumeAutoRenewal(effectiveCurrentPass);
            if (resumed) return;
        }

        const confirm = await Swal.fire({
            ...getDialogBaseOptions(),
            title: "Đăng ký tự động gia hạn",
            confirmButtonText: "Tiếp tục",
            cancelButtonText: cms?.common?.actions?.close || "Đóng",
            html: `
        <div class="aya-dialog text-left">
          ${getDialogSharedStyle()}

          <div class="aya-warning-stack">
            <div class="aya-warning-card info">
              <div class="aya-warning-title">
                <i class="fa-solid fa-arrows-rotate" style="color:#7c3aed;"></i>
                Tự động gia hạn cho các kỳ tiếp theo
              </div>
              <div class="aya-warning-desc">
                Bạn sẽ thanh toán trước cho kỳ kế tiếp. Từ các kỳ sau, hệ thống sẽ tự động gia hạn hàng tháng qua Stripe để tránh gián đoạn dịch vụ.
              </div>
            </div>

            <div class="aya-warning-card">
              <div class="aya-warning-title">
                <i class="fa-solid fa-shield-heart" style="color:#4f46e5;"></i>
                Phù hợp khi
              </div>
              <div class="aya-warning-desc">
                Bạn muốn tiếp tục sử dụng ổn định và không muốn thao tác thanh toán lại mỗi tháng.
              </div>
            </div>
          </div>
        </div>
      `,
        });

        if (!confirm.isConfirmed) return;

        await onStartPlanCheckout(effectiveCurrentPass.plan, "STRIPE_SUBSCRIPTION");
    }

    async function handleCancelAutoRenewal() {
        if (!effectiveCurrentPass || !onCancelAutoRenewal) return;

        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title: cms?.tabs?.subscriptions?.actions?.cancelAutoRenewalConfirmTitle || "Hủy tự động gia hạn",
            confirmButtonText:
                cms?.tabs?.subscriptions?.actions?.cancelAutoRenewalConfirmButton ||
                cms?.tabs?.subscriptions?.actions?.cancelAutoRenewal ||
                "Xác nhận hủy",
            cancelButtonText: cms?.common?.actions?.close || "Đóng",
            customClass: {
                ...getDialogBaseOptions().customClass,
                confirmButton:
                    "inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-rose-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
            },
            html: `
        <div class="aya-dialog text-left">
          ${getDialogSharedStyle()}

          <div class="aya-warning-stack">
            <div class="aya-warning-card warning">
              <div class="aya-warning-title">
                <i class="fa-solid fa-ban" style="color:#dc2626;"></i>
                Sau khi hủy tự động gia hạn
              </div>
              <div class="aya-warning-desc">
                Gói của bạn vẫn tiếp tục sử dụng đến hết chu kỳ hiện tại. Sau đó hệ thống sẽ không tự động tạo kỳ mới nữa.
              </div>
            </div>

            <div class="aya-warning-card info">
              <div class="aya-warning-title">
                <i class="fa-solid fa-circle-info" style="color:#4f46e5;"></i>
                Bạn vẫn có thể đăng ký lại sau
              </div>
              <div class="aya-warning-desc">
                Khi cần, bạn vẫn có thể bật lại tự động gia hạn hoặc thanh toán gia hạn thủ công cho các kỳ tiếp theo.
              </div>
            </div>
          </div>
        </div>
      `,
        });

        if (!result.isConfirmed) return;
        await onCancelAutoRenewal(effectiveCurrentPass);
    }

    async function handleUpgradePlan(plan: any) {
        const currentPlanId = effectiveCurrentPass?.plan?.id ?? null;
        const shouldShowUpgradeWarning = currentPlanId != null && currentPlanId !== plan?.id;

        if (shouldShowUpgradeWarning) {
            const agreed = await openUpgradeConfirmDialog(plan);
            if (!agreed) return;
        }

        await openCheckoutMethodDialog(plan);
    }

    return (
        <div className="space-y-4">
            {subscriptionLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                    {cms.common.loadingText}
                </div>
            ) : null}

            {subscriptionError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{subscriptionError}</div>
            ) : null}

            {!subscriptionLoading ? (
                <>
                    {effectiveCurrentPass ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                                        {cms.tabs.subscriptions.summary.currentPlanTitle}
                                    </p>
                                    <p className="mt-1 text-lg font-extrabold text-slate-900">{effectiveCurrentPass.plan.name}</p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {cms.tabs.subscriptions.summary.cycleLabel}: {formatDate(effectiveCurrentPass.startAt)} -{" "}
                                        {formatDate(effectiveCurrentPass.endAt)} | {cms.tabs.subscriptions.summary.graceUntilLabel}{" "}
                                        {formatDate(effectiveCurrentPass.graceUntil)}
                                    </p>
                                </div>
                                <span
                                    className={classNames(
                                        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                        passStatusStyles[getDisplayPassStatus(effectiveCurrentPass)],
                                    )}
                                >
                                    {getPassStatusLabel(getDisplayPassStatus(effectiveCurrentPass), cms.tabs.subscriptions.statuses.pass)}
                                </span>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border border-white/60 bg-white px-3 py-3">
                                    <p className="text-xs text-slate-500">{cms.tabs.subscriptions.summary.remainingQuota}</p>
                                    <p className="mt-1 text-xl font-extrabold text-slate-900">{effectiveCurrentPass.remainingUnlocks}</p>
                                </div>
                                <div className="rounded-xl border border-white/60 bg-white px-3 py-3">
                                    <p className="text-xs text-slate-500">{cms.tabs.subscriptions.summary.unlockedCount}</p>
                                    <p className="mt-1 text-xl font-extrabold text-slate-900">{effectiveCurrentPass.unlockCount}</p>
                                </div>
                                <div className="rounded-xl border border-white/60 bg-white px-3 py-3">
                                    <p className="text-xs text-slate-500">{cms.tabs.subscriptions.summary.unlockNew}</p>
                                    <p className="mt-1 text-xl font-extrabold text-slate-900">
                                        {(effectiveCurrentPass.computedStatus === "ACTIVE" || effectiveCurrentPass.computedStatus === "GRACE") &&
                                        effectiveCurrentPass.remainingUnlocks > 0
                                            ? cms.tabs.subscriptions.summary.canUnlockYes
                                            : cms.tabs.subscriptions.summary.canUnlockNo}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                                    Renewal mode: {renewalMode}
                                </span>
                                {currentPassRenewalState === "AUTO_RENEW_ACTIVE" ? (
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                        disabled={!onCancelAutoRenewal || subscriptionActionPlanId === effectiveCurrentPass.plan.id}
                                        onClick={() => void handleCancelAutoRenewal()}
                                    >
                                        {cms?.tabs?.subscriptions?.actions?.cancelAutoRenewal || "Hủy tự động gia hạn"}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                            disabled={hasScheduledPass || subscriptionActionPlanId === effectiveCurrentPass.plan.id}
                                            onClick={() => void handleRenewCurrentPass()}
                                        >
                                            {subscriptionActionPlanId === effectiveCurrentPass.plan.id
                                                ? cms.tabs.subscriptions.actions.processing
                                                : cms?.tabs?.subscriptions?.actions?.renewNow || "Gia hạn"}
                                        </button>

                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-extrabold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
                                            disabled={hasScheduledPass || subscriptionActionPlanId === effectiveCurrentPass.plan.id || !effectiveCurrentPass.plan.currentStripePriceId}
                                            title={
                                                !effectiveCurrentPass.plan.currentStripePriceId
                                                    ? cms.tabs.subscriptions.actions.stripeRecurringUnavailableTitle
                                                    : undefined
                                            }
                                            onClick={() => void handleSubscribeRecurringCurrentPass()}
                                        >
                                            {cms?.tabs?.subscriptions?.actions?.registerAutoRenewal || "Đăng ký tự động gia hạn"}
                                        </button>
                                    </>
                                )}
                            </div>

                            {hasScheduledPass ? (
                                <p className="mt-3 text-xs font-semibold text-amber-700">
                                    Bạn đã có pass scheduled từ {formatDate(scheduledPass?.startAt)}. Hệ thống tạm khóa gia hạn thêm để tránh tạo dư pass.
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            {cms.tabs.subscriptions.summary.noActivePass}
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-bold text-slate-700">{cms.tabs.subscriptions.planList.title}</p>
                    </div>

                    {publicPlans.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                            {cms.tabs.subscriptions.planList.emptyText}
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {publicPlans.map((plan) => {
                                const highlighted = focusedPlanId === plan.id;
                                const isCurrentPlan = currentPlanId != null && currentPlanId === plan.id;
                                const planPrice = Number(plan?.price || 0);
                                const isLowerThanCurrentPlan = currentPlanPrice != null && planPrice < currentPlanPrice;

                                return (
                                    <div
                                        key={plan.id}
                                        className={classNames(
                                            "rounded-2xl border bg-white p-4",
                                            highlighted ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200",
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{plan.code}</p>
                                                <p className="mt-1 text-base font-extrabold text-slate-900">{plan.name}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700">{formatMoney(plan.price)}</p>
                                        </div>

                                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                                            <p>
                                                - {cms.tabs.subscriptions.planCard.quotaLabel}: {plan.maxUnlocks}{" "}
                                                {cms.tabs.subscriptions.planCard.perCycleLabel}
                                            </p>
                                            <p>
                                                - {cms.tabs.subscriptions.planCard.durationLabel}:{" "}
                                                {formatDurationDays(plan.durationDays, cms.tabs.subscriptions.planCard.durationUnits)} +{" "}
                                                {cms.tabs.subscriptions.planCard.graceLabel} {plan.graceDays}{" "}
                                                {cms.tabs.subscriptions.planCard.durationUnits.day}
                                            </p>
                                            <p>
                                                - {cms.tabs.subscriptions.planCard.maxCoursePriceLabel}:{" "}
                                                {plan.maxCoursePrice != null
                                                    ? formatMoney(plan.maxCoursePrice)
                                                    : cms.tabs.subscriptions.planCard.unlimited}
                                            </p>
                                            <p>
                                                - {cms.tabs.subscriptions.planCard.blockedTagsLabel}:{" "}
                                                {plan.excludedTags.length > 0
                                                    ? plan.excludedTags.map((tag: any) => tag.code).join(", ")
                                                    : cms.tabs.subscriptions.planCard.noBlockedTags}
                                            </p>
                                        </div>

                                        <div className="mt-3">
                                            {isCurrentPlan ? (
                                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                                                    {cms?.tabs?.subscriptions?.planCard?.currentPlanBadge || "Gói hiện tại của bạn"}
                                                </span>
                                            ) : !isLowerThanCurrentPlan ? (
                                                <button
                                                    type="button"
                                                    className="inline-flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                                    disabled={hasScheduledPass || subscriptionActionPlanId === plan.id}
                                                    onClick={() => void handleUpgradePlan(plan)}
                                                >
                                                    {subscriptionActionPlanId === plan.id
                                                        ? cms.tabs.subscriptions.actions.processing
                                                        : cms?.tabs?.subscriptions?.actions?.upgrade || "Nâng cấp"}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-bold text-slate-700">{cms.tabs.subscriptions.history.passTitle}</p>
                    </div>

                    {passHistory.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                            {cms.tabs.subscriptions.history.passEmptyText}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {passHistory.map((pass) => (
                                <article key={pass.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900">{pass.plan.name}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {formatDate(pass.startAt)} - {formatDate(pass.endAt)} |{" "}
                                                {cms.tabs.subscriptions.summary.graceUntilLabel} {formatDate(pass.graceUntil)}
                                            </p>
                                        </div>
                                        <span
                                            className={classNames(
                                                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                                passStatusStyles[getDisplayPassStatus(pass)],
                                            )}
                                        >
                                            {getPassStatusLabel(getDisplayPassStatus(pass), cms.tabs.subscriptions.statuses.pass)}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                                        <p>
                                            {cms.tabs.subscriptions.history.remainingQuota}:{" "}
                                            <span className="font-bold text-slate-800">{pass.remainingUnlocks}</span>
                                        </p>
                                        <p>
                                            {cms.tabs.subscriptions.history.unlockCount}:{" "}
                                            <span className="font-bold text-slate-800">{pass.unlockCount}</span>
                                        </p>
                                        <p>
                                            {cms.tabs.subscriptions.history.paymentCode}:{" "}
                                            <span className="font-bold text-slate-800">{pass.purchaseId || cms.common.emptyValue}</span>
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-bold text-slate-700">{cms.tabs.subscriptions.history.paymentTitle}</p>
                    </div>

                    {paymentHistory.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                            {cms.tabs.subscriptions.history.paymentEmptyText}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paymentHistory.map((payment) => (
                                <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900">{payment.plan.name}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {cms.tabs.subscriptions.history.amount}: {formatMoney(payment.amount)} |{" "}
                                                {cms.tabs.subscriptions.history.createdAt} {formatDateTime(payment.createdAt)}
                                            </p>
                                        </div>
                                        <span
                                            className={classNames(
                                                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                                planPaymentStatusStyles[payment.computedStatus],
                                            )}
                                        >
                                            {getPaymentStatusLabel(payment.computedStatus, cms.tabs.subscriptions.statuses.payment)}
                                        </span>
                                    </div>

                                    <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                                        <p>
                                            {cms.tabs.subscriptions.history.transferContent}:{" "}
                                            <span className="font-bold text-slate-800">{payment.transferContent}</span>
                                        </p>
                                        <p>
                                            Payment source:{" "}
                                            <span className="font-bold text-slate-800">{payment.paymentSource || payment.provider || "-"}</span>
                                        </p>
                                        <p>
                                            {cms.tabs.subscriptions.history.paidAt}:{" "}
                                            <span className="font-bold text-slate-800">{formatDateTime(payment.paidAt)}</span>
                                        </p>
                                    </div>

                                    {payment.computedStatus === "PENDING" && payment.sepay ? (
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100"
                                                onClick={() => openPlanPaymentModal(payment)}
                                            >
                                                <i className="fa-solid fa-qrcode" />
                                                {cms.tabs.subscriptions.actions.openPaymentQr}
                                            </button>
                                        </div>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </>
            ) : null}

            {planPaymentModal?.sepay ? (
                <div className="fixed inset-0 z-[135] flex items-center justify-center bg-black/60 px-4" onClick={() => setPlanPaymentModal(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-slate-900">{cms.tabs.subscriptions.qrModal.title}</h3>
                            <button
                                type="button"
                                onClick={() => setPlanPaymentModal(null)}
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                                {cms.common.actions.close}
                            </button>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                            {cms.tabs.subscriptions.qrModal.planLabel}: {planPaymentModal.plan.name}
                        </p>

                        <div className="relative mx-auto mt-4 h-64 w-64">
                            <img
                                src={planPaymentModal.sepay.qrUrl}
                                alt={cms.tabs.subscriptions.qrModal.qrAlt}
                                className={"h-64 w-64 rounded-xl border border-slate-200 transition " + (planQrCountdown.expired ? "opacity-40 blur-[2px]" : "")}
                            />
                        </div>

                        <div className="mt-4 space-y-1 text-sm text-slate-700">
                            <p>
                                <span className="font-semibold">{cms.tabs.subscriptions.qrModal.amount}:</span>{" "}
                                {formatMoney(Number(planPaymentModal.sepay.amount || 0))}
                            </p>
                            <p>
                                <span className="font-semibold">{cms.tabs.subscriptions.qrModal.transferContent}:</span>{" "}
                                {planPaymentModal.sepay.transferContent}
                            </p>
                            <p>
                                <span className="font-semibold">{cms.tabs.subscriptions.qrModal.timeLeft}:</span> {planQrCountdown.text}
                            </p>
                            <p>
                                <span className="font-semibold">{cms.tabs.subscriptions.qrModal.expiresAt}:</span>{" "}
                                {formatDateTime(planQrExpiresAt)}
                            </p>
                        </div>

                        {planQrCountdown.expired ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                {cms.tabs.subscriptions.qrModal.expiredMessage}
                            </div>
                        ) : (
                            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                {cms.tabs.subscriptions.qrModal.waitingMessage}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}