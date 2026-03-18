import React, { useEffect, useMemo, useState } from "react";
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
    onRealtimePaymentUpdate?: (event: any) => void;
};

type PassRenewalState = "AUTO_RENEW_ACTIVE" | "AUTO_RENEW_CANCELED" | "NONE";
type RenewalMode = "none" | "scheduled_cancel" | "auto_renew_on";
type HistoryTab = "passes" | "payments";

export const cmsDataDefault = {
    common: {
        loadingText: "Đang tải dữ liệu...",
        emptyValue: "-",
        actions: {
            close: "Đóng",
        },
    },
    tabs: {
        subscriptions: {
            header: {
                eyebrow: "Membership",
                title: "Gói thành viên",
                description: "",
                historyButton: "Xem lịch sử",
                historyButtonIcon: "fa-solid fa-clock-rotate-left",
                nextCycleIcon: "fa-solid fa-calendar-days",
                activityIcon: "fa-solid fa-chart-line",
                closeIcon: "fa-solid fa-xmark",
                metrics: {
                    plans: "Gói khả dụng",
                    histories: "Bản ghi lịch sử",
                    renewal: "Chế độ gia hạn",
                },
            },
            summary: {
                currentPlanTitle: "Gói đang hiệu lực",
                currentPlanFallback: "Chưa có gói hoạt động",
                cycleLabel: "Thời gian dùng",
                graceUntilLabel: "Dùng thêm đến",
                remainingQuota: "Lượt mở còn lại",
                unlockedCount: "Đã mở",
                unlockNew: "Có thể mở thêm",
                canUnlockYes: "Có",
                canUnlockNo: "Không",
                noActivePass: "Bạn chưa có gói nào đang hoạt động.",
                statusCardTitle: "Trạng thái hiện tại",
                statusCardDescription: "",
                renewalModeLabel: "Chế độ gia hạn",
            },
            insights: {
                nextCycleTitle: "Kỳ tiếp theo",
                nextCycleEmpty: "Chưa có kỳ tiếp theo được lên lịch.",
                nextCycleConfirmedLabel: "Đã xác nhận",
                nextCyclePendingLabel: "Đang chờ thanh toán",
                nextCycleDateLabel: "Bắt đầu",
                activityTitle: "Tổng quan nhanh",
                activityDescription: "",
                paymentTitle: "Thanh toán gần nhất",
                paymentEmpty: "Chưa có thanh toán nào.",
                paymentAmount: "Số tiền",
                paymentCreatedAt: "Tạo lúc",
                renewalModes: {
                    none: "Không tự động gia hạn",
                    scheduled_cancel: "Đã lên lịch hủy tự động gia hạn",
                    auto_renew_on: "Tự động gia hạn đang bật",
                },
            },
            planList: {
                title: "Danh sách gói hiện có",
                description: "",
                emptyText: "Hiện chưa có gói công khai nào.",
            },
            planCard: {
                priceLabel: "Giá",
                quotaLabel: "Lượt mở",
                perCycleLabel: "mỗi kỳ",
                durationLabel: "Thời hạn",
                durationUnits: {
                    day: "ngày",
                    week: "tuần",
                    month: "tháng",
                    year: "năm",
                },
                graceLabel: "Dùng thêm",
                maxCoursePriceLabel: "Giá khóa học tối đa",
                blockedTagsLabel: "Nhóm không áp dụng",
                noBlockedTags: "Không có",
                unlimited: "Không giới hạn",
                currentPlanBadge: "Đang dùng",
                featuredBadge: "Nổi bật",
                lowerPlanHint: "Gói này thấp hơn gói bạn đang dùng.",
            },
            history: {
                modalTitle: "Lịch sử sử dụng",
                modalDescription: "",
                passTitle: "Lịch sử pass",
                paymentTitle: "Lịch sử thanh toán",
                passEmptyText: "Chưa có lịch sử pass.",
                paymentEmptyText: "Chưa có lịch sử thanh toán.",
                remainingQuota: "Lượt còn lại",
                unlockCount: "Đã mở",
                paymentCode: "Mã đơn",
                amount: "Số tiền",
                createdAt: "Tạo lúc",
                transferContent: "Nội dung CK",
                paidAt: "Thanh toán lúc",
                paymentSource: "Nguồn thanh toán",
                passesTab: "Pass",
                paymentsTab: "Thanh toán",
                historyCountLabel: "bản ghi",
            },
            statuses: {
                pass: {},
                payment: {},
            },
            actions: {
                processing: "Đang xử lý...",
                upgrade: "Nâng cấp",
                continue: "Tiếp tục",
                renewNow: "Gia hạn ngay",
                registerAutoRenewal: "Bật tự động gia hạn",
                cancelAutoRenewal: "Hủy tự động gia hạn",
                cancelAutoRenewalConfirmTitle: "Hủy tự động gia hạn",
                cancelAutoRenewalConfirmButton: "Xác nhận hủy",
                choosePaymentMethodTitle: "Chọn phương thức thanh toán",
                oneTimeLabel: "Thanh toán 1 lần",
                recurringLabel: "Tự động gia hạn",
                chooseQr: "QR code",
                chooseStripeOneTime: "Thẻ / Stripe",
                payNow: "Thanh toán ngay",
                openPaymentQr: "Mở QR thanh toán",
                stripeRecurringUnavailableTitle: "Gói này chưa hỗ trợ Stripe recurring.",
                recurringInfoTitle: "Tiếp tục trải nghiệm liền mạch",
                recurringInfoItems: [
                    "Thanh toán định kỳ qua Stripe cho chu kỳ tiếp theo.",
                    "Giảm thao tác lặp lại mỗi lần hết hạn.",
                    "Dễ tạm dừng hoặc hủy khi không còn nhu cầu.",
                    "Phù hợp khi bạn muốn duy trì sử dụng liên tục.",
                ],
            },
            dialogs: {
                icons: {
                    crown: "fa-solid fa-crown",
                    oneTime: "fa-regular fa-credit-card",
                    recurring: "fa-solid fa-arrows-rotate",
                    qr: "fa-solid fa-qrcode",
                    card: "fa-solid fa-credit-card",
                    wallet: "fa-solid fa-wallet",
                    heartShield: "fa-solid fa-shield-heart",
                    warning: "fa-solid fa-triangle-exclamation",
                    info: "fa-solid fa-circle-info",
                    ban: "fa-solid fa-ban",
                    renew: "fa-solid fa-rotate-right",
                },
                checkout: {
                    oneTimeDescription:
                        "Thanh toán cho một chu kỳ duy nhất. Hình thức này phù hợp khi bạn muốn tự quyết định mỗi lần gia hạn.",
                    recurringDescription:
                        "Hệ thống tự gia hạn theo chu kỳ để trải nghiệm không bị gián đoạn và giảm thao tác thanh toán lặp lại.",
                    oneTimePanelTitle: "Chọn phương thức thanh toán 1 lần",
                    qrDescription:
                        "Quét mã QR để chuyển khoản nhanh qua ngân hàng ngay tại thời điểm này.",
                    cardDescription: "Thanh toán một lần bằng thẻ qua Stripe, nhanh gọn và bảo mật.",
                    oneTimeNote: "Bạn chỉ thanh toán cho chu kỳ này. Khi hết hạn, bạn có thể chủ động gia hạn lại.",
                    recurringNote:
                        "Thanh toán định kỳ được xử lý qua Stripe subscription và sẽ tự động thu tiền ở đầu chu kỳ mới.",
                },
                renew: {
                    panelTitle: "Chọn phương thức gia hạn 1 lần",
                    qrDescription: "Quét mã QR để gia hạn nhanh cho chu kỳ kế tiếp.",
                    cardDescription: "Thanh toán một lần bằng thẻ qua Stripe, thao tác nhanh và bảo mật.",
                    note: "Đây là gia hạn cho một chu kỳ sử dụng. Hệ thống sẽ không tự gia hạn các kỳ sau.",
                },
                upgrade: {
                    title: "Nâng cấp gói",
                    warningTitle: "Lưu ý trước khi nâng cấp",
                    warningDescription:
                        "Sau khi thanh toán thành công, gói mới sẽ được kích hoạt ngay và gói hiện tại sẽ dừng hiệu lực.",
                    confirmTitle: "Xác nhận tiếp tục",
                    confirmDescription: "Chỉ tiếp tục khi bạn đồng ý chuyển sang gói mới ngay lúc này.",
                },
                subscribeRecurring: {
                    title: "Đăng ký tự động gia hạn",
                    confirmButton: "Tiếp tục",
                    infoTitle: "Tự động gia hạn cho các kỳ tiếp theo",
                    infoDescription:
                        "Bạn sẽ thanh toán trước cho kỳ kế tiếp. Từ các kỳ sau, hệ thống sẽ tự động gia hạn qua Stripe để tránh gián đoạn dịch vụ.",
                    fitTitle: "Phù hợp khi",
                    fitDescription: "Bạn muốn tiếp tục sử dụng ổn định và không muốn thao tác thanh toán lại mỗi tháng.",
                },
                cancelAutoRenew: {
                    warningTitle: "Sau khi hủy tự động gia hạn",
                    warningDescription:
                        "Gói vẫn tiếp tục dùng đến hết chu kỳ hiện tại, sau đó hệ thống sẽ không tạo kỳ mới tự động nữa.",
                    infoTitle: "Bạn vẫn có thể bật lại sau",
                    infoDescription:
                        "Khi cần, bạn vẫn có thể bật lại tự động gia hạn hoặc gia hạn thủ công cho các kỳ tiếp theo.",
                },
                messages: {
                    alreadyScheduledTitle: "Đã có gói chờ kỳ sau",
                    alreadyScheduledRenewText:
                        "Bạn đã có gói cho kỳ tiếp theo nên chưa thể gia hạn thêm.",
                    alreadyScheduledRecurringText:
                        "Bạn đã có gói cho kỳ tiếp theo nên chưa thể bật tự động gia hạn thêm.",
                    scheduledConfirmedHint:
                        "Đã có gói cho kỳ tiếp theo từ {date}.",
                    scheduledPendingHint:
                        "Đã có yêu cầu cho kỳ tiếp theo từ {date}, đang chờ thanh toán.",
                },
            },
            qrModal: {
                title: "QR thanh toán",
                planLabel: "Gói",
                qrAlt: "QR thanh toán gói",
                amount: "Số tiền",
                transferContent: "Nội dung CK",
                timeLeft: "Còn lại",
                expiresAt: "Hết hạn lúc",
                expiredMessage: "Mã QR đã hết hạn. Vui lòng tạo lại thanh toán mới nếu cần.",
                waitingMessage: "Hệ thống đang chờ xác nhận thanh toán của bạn.",
            },
        },
    },
};

function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function isPlainObject(value: unknown): value is Record<string, any> {
    return Object.prototype.toString.call(value) === "[object Object]";
}

function mergeDeep<T>(base: T, override: any): T {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return (override ?? base) as T;
    }

    const output: Record<string, any> = { ...base };

    Object.keys(override).forEach((key) => {
        const baseValue = (base as any)[key];
        const overrideValue = override[key];

        if (Array.isArray(overrideValue)) {
            output[key] = overrideValue;
            return;
        }

        if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
            output[key] = mergeDeep(baseValue, overrideValue);
            return;
        }

        output[key] = overrideValue ?? baseValue;
    });

    return output as T;
}

function toTime(value: string | null | undefined) {
    if (!value) return null;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
}

function computePassStatusFromTime(pass: any, now: number) {
    const start = toTime(pass?.startAt);
    const end = toTime(pass?.endAt);
    const graceUntil = toTime(pass?.graceUntil);
    const entitlementState = String(pass?.entitlementState || "CONFIRMED").toUpperCase();

    if (pass?.canceledAt) return "CANCELED";
    if (graceUntil == null) return null;

    if (entitlementState === "PENDING_CHARGE") {
        return now < graceUntil ? "SCHEDULED" : "EXPIRED";
    }

    if (start == null || end == null) return null;
    if (now < start) return "SCHEDULED";
    if (now < end) return "ACTIVE";
    if (now < graceUntil) return "GRACE";
    return "EXPIRED";
}

function isPassEffectiveNow(pass: any, now: number) {
    const computed = computePassStatusFromTime(pass, now);
    return computed === "ACTIVE" || computed === "GRACE";
}

function getDisplayPassStatus(pass: any, now = Date.now()) {
    return pass?.computedStatus || computePassStatusFromTime(pass, now) || pass?.status;
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

function getScheduledPassByEntitlementState(currentPass: any, passHistory: any[], state: "CONFIRMED" | "PENDING_CHARGE") {
    const now = Date.now();
    const allPasses = [currentPass, ...(passHistory || [])].filter(Boolean);

    const scheduled = allPasses
        .filter((pass) => {
            const entitlementState = String(pass?.entitlementState || "CONFIRMED").toUpperCase();
            if (pass?.canceledAt || entitlementState !== state) return false;
            return getDisplayPassStatus(pass, now) === "SCHEDULED";
        })
        .sort((a, b) => (toTime(a?.startAt) ?? 0) - (toTime(b?.startAt) ?? 0));

    return scheduled[0] || null;
}

function isConfirmedScheduledPass(pass: any) {
    return String(pass?.entitlementState || "CONFIRMED").toUpperCase() === "CONFIRMED";
}

function isPendingChargeScheduledPass(pass: any) {
    return String(pass?.entitlementState || "").toUpperCase() === "PENDING_CHARGE";
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

function replaceTemplate(template: string, values: Record<string, string>) {
    return Object.entries(values).reduce((acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), value), template);
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
            popup: "rounded-[28px] text-left border border-slate-200 shadow-[0_32px_80px_rgba(15,23,42,0.18)]",
            title: "text-slate-900 text-xl font-extrabold",
            htmlContainer: "m-0",
            confirmButton:
                "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
            cancelButton:
                "inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none",
            actions: "w-full flex gap-3 justify-end mt-6 pe-6 pb-2",
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
          background:
            radial-gradient(circle at top right, rgba(99, 102, 241, 0.10), transparent 42%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 22px;
          padding: 16px 18px;
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
          border-radius: 18px;
          padding: 15px 16px;
          text-align: left;
          cursor: pointer;
          transition: all .18s ease;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
        }

        .aya-dialog .aya-segment-btn:hover,
        .aya-dialog .aya-radio-card:hover {
          border-color: #818cf8;
          background: #f8faff;
        }

        .aya-dialog .aya-segment-btn.active,
        .aya-dialog .aya-radio-card.active {
          border-color: #6366f1;
          background: linear-gradient(180deg, #eef2ff 0%, #f8faff 100%);
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
          line-height: 1.6;
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
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 22px;
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
      </style>
    `;
}

function MetricCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
    return (
        <div className="rounded-[20px] border border-white/70 bg-white/85 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <div className="mt-1.5 text-xl font-black tracking-tight text-slate-950">{value}</div>
            {hint ? <p className="mt-1 text-[11px] leading-5 text-slate-500">{hint}</p> : null}
        </div>
    );
}

function HistoryEmptyState({ title }: { title: string }) {
    return (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            {title}
        </div>
    );
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
                                             getPassStatusLabel,
                                             getPaymentStatusLabel,
                                             passStatusStyles,
                                             planPaymentStatusStyles,
                                             onRealtimePaymentUpdate,
                                         }: Props) {
    const cmsData = useMemo(() => mergeDeep(cmsDataDefault, cms || {}), [cms]);
    const subscriptionCms = cmsData.tabs.subscriptions;
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyTab, setHistoryTab] = useState<HistoryTab>("passes");

    const effectiveCurrentPass = getCurrentEffectivePass(currentPass, passHistory);
    const scheduledConfirmedPass = getScheduledPassByEntitlementState(currentPass, passHistory, "CONFIRMED");
    const scheduledPendingChargePass = getScheduledPassByEntitlementState(currentPass, passHistory, "PENDING_CHARGE");
    const hasConfirmedScheduledPass = Boolean(scheduledConfirmedPass && isConfirmedScheduledPass(scheduledConfirmedPass));
    const hasPendingChargeScheduledPass = Boolean(scheduledPendingChargePass && isPendingChargeScheduledPass(scheduledPendingChargePass));
    const effectiveCurrentPassStatus = effectiveCurrentPass ? getDisplayPassStatus(effectiveCurrentPass) : null;
    const currentPlanId = effectiveCurrentPass?.plan?.id ?? null;
    const currentPassRenewalState = effectiveCurrentPass ? getPassRenewalState(effectiveCurrentPass, paymentHistory) : "NONE";
    const renewalMode: RenewalMode = effectiveCurrentPass ? getRenewalMode(effectiveCurrentPass, paymentHistory) : "none";
    const currentPlanPrice = effectiveCurrentPass?.plan?.price != null ? Number(effectiveCurrentPass.plan.price) : null;
    const cancelAutoRenewTargetPass = scheduledPendingChargePass || effectiveCurrentPass || null;
    const showCancelAutoRenewAction = currentPassRenewalState === "AUTO_RENEW_ACTIVE" || hasPendingChargeScheduledPass;

    const sortedPassHistory = useMemo(
        () =>
            [...(passHistory || [])].sort((a, b) => {
                const aTime = toTime(a?.startAt) ?? 0;
                const bTime = toTime(b?.startAt) ?? 0;
                return bTime - aTime;
            }),
        [passHistory],
    );

    const sortedPaymentHistory = useMemo(
        () =>
            [...(paymentHistory || [])].sort((a, b) => {
                const aTime = toTime(a?.paidAt) ?? toTime(a?.createdAt) ?? 0;
                const bTime = toTime(b?.paidAt) ?? toTime(b?.createdAt) ?? 0;
                return bTime - aTime;
            }),
        [paymentHistory],
    );

    const totalHistoryCount = sortedPassHistory.length + sortedPaymentHistory.length;

    useEffect(() => {
        if (!historyModalOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setHistoryModalOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [historyModalOpen]);

    useEffect(() => {
        if (typeof onRealtimePaymentUpdate !== "function") return;

        const token = localStorage.getItem("aya_access_token") || "";
        if (!token) return;

        const apiBase = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
        const wsBase = apiBase.replace(/^http/i, "ws");
        const socket = new WebSocket(`${wsBase}/ws/payments?token=${encodeURIComponent(token)}`);

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data || "{}");
                if (payload?.event === "payment.updated") {
                    onRealtimePaymentUpdate(payload.data);
                }
            } catch (error) {
                console.warn("[subscriptions][ws] Invalid message", error);
            }
        };

        socket.onerror = (error) => {
            console.warn("[subscriptions][ws] Connection error", error);
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                socket.close();
            }
        };
    }, [onRealtimePaymentUpdate]);

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

        const actionsCms = subscriptionCms.actions;
        const dialogCms = subscriptionCms.dialogs;
        const priceText = formatMoney(plan?.price || 0);

        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title: actionsCms.choosePaymentMethodTitle,
            confirmButtonText: actionsCms.payNow,
            cancelButtonText: cmsData.common.actions.close,
            html: `
      <div id="aya-checkout-dialog" class="aya-dialog text-left">
        ${getDialogSharedStyle()}

        <div class="aya-plan-box">
          <div class="aya-plan-name">
            <i class="${dialogCms.icons.crown}" style="margin-right:8px;color:#6366f1;"></i>
            ${plan?.name || ""}
          </div>
          <div class="aya-plan-price">
            ${priceText}
          </div>
        </div>

        <div class="aya-segment">
          <button type="button" class="aya-segment-btn" id="aya-mode-one-time" data-mode="ONE_TIME">
            <div class="aya-segment-title">
              <i class="${dialogCms.icons.oneTime}"></i>
              ${actionsCms.oneTimeLabel}
            </div>
            <div class="aya-segment-desc">
              ${dialogCms.checkout.oneTimeDescription}
            </div>
          </button>

          <button type="button" class="aya-segment-btn active" id="aya-mode-recurring" data-mode="SUBSCRIPTION">
            <div class="aya-segment-title">
              <i class="${dialogCms.icons.recurring}"></i>
              ${actionsCms.recurringLabel}
            </div>
            <div class="aya-segment-desc">
              ${dialogCms.checkout.recurringDescription}
            </div>
          </button>
        </div>

        <div id="aya-one-time-panel" class="aya-panel aya-hidden">
          <div class="aya-panel-title">
            <i class="${dialogCms.icons.wallet}" style="color:#6366f1;"></i>
            ${dialogCms.checkout.oneTimePanelTitle}
          </div>

          <div class="aya-submethods">
            <button type="button" class="aya-radio-card active" id="aya-method-qr" data-method="SEPAY">
              <div class="aya-radio-title">
                <i class="${dialogCms.icons.qr}" style="color:#059669;"></i>
                ${actionsCms.chooseQr}
              </div>
              <div class="aya-radio-desc">
                ${dialogCms.checkout.qrDescription}
              </div>
            </button>

            <button type="button" class="aya-radio-card" id="aya-method-card" data-method="STRIPE_ONE_TIME">
              <div class="aya-radio-title">
                <i class="${dialogCms.icons.card}" style="color:#2563eb;"></i>
                ${actionsCms.chooseStripeOneTime}
              </div>
              <div class="aya-radio-desc">
                ${dialogCms.checkout.cardDescription}
              </div>
            </button>
          </div>

          <div class="aya-note">
            ${dialogCms.checkout.oneTimeNote}
          </div>
        </div>

        <div id="aya-recurring-panel" class="aya-panel">
          <div class="aya-panel-title">
            <i class="${dialogCms.icons.heartShield}" style="color:#7c3aed;"></i>
            ${actionsCms.recurringInfoTitle}
          </div>

          <ul class="aya-list">
            ${actionsCms.recurringInfoItems.map((item: string) => `<li>${item}</li>`).join("")}
          </ul>

          <div class="aya-note">
            ${dialogCms.checkout.recurringNote}
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

        const actionsCms = subscriptionCms.actions;
        const dialogCms = subscriptionCms.dialogs;
        const priceText = formatMoney(plan?.price || 0);

        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title: actionsCms.renewNow,
            confirmButtonText: actionsCms.payNow,
            cancelButtonText: cmsData.common.actions.close,
            html: `
      <div id="aya-renew-one-time-dialog" class="aya-dialog text-left">
        ${getDialogSharedStyle()}

        <div class="aya-plan-box">
          <div class="aya-plan-name">
            <i class="${dialogCms.icons.renew}" style="margin-right:8px;color:#6366f1;"></i>
            ${plan?.name || ""}
          </div>
          <div class="aya-plan-price">
            ${priceText}
          </div>
        </div>

        <div class="aya-panel" style="margin-top:0;">
          <div class="aya-panel-title">
            <i class="${dialogCms.icons.wallet}" style="color:#6366f1;"></i>
            ${dialogCms.renew.panelTitle}
          </div>

          <div class="aya-submethods">
            <button type="button" class="aya-radio-card active" id="aya-renew-method-qr" data-method="SEPAY">
              <div class="aya-radio-title">
                <i class="${dialogCms.icons.qr}" style="color:#059669;"></i>
                ${actionsCms.chooseQr}
              </div>
              <div class="aya-radio-desc">
                ${dialogCms.renew.qrDescription}
              </div>
            </button>

            <button type="button" class="aya-radio-card" id="aya-renew-method-card" data-method="STRIPE_ONE_TIME">
              <div class="aya-radio-title">
                <i class="${dialogCms.icons.card}" style="color:#2563eb;"></i>
                ${actionsCms.chooseStripeOneTime}
              </div>
              <div class="aya-radio-desc">
                ${dialogCms.renew.cardDescription}
              </div>
            </button>
          </div>

          <div class="aya-note">
            ${dialogCms.renew.note}
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
        const dialogCms = subscriptionCms.dialogs;
        const currentPlanName = effectiveCurrentPass?.plan?.name || subscriptionCms.summary.currentPlanFallback;
        const newPlanName = plan?.name || subscriptionCms.planList.title;

        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title: dialogCms.upgrade.title,
            confirmButtonText: subscriptionCms.actions.continue,
            cancelButtonText: cmsData.common.actions.close,
            html: `
      <div class="aya-dialog text-left">
        ${getDialogSharedStyle()}

        <div class="aya-warning-stack">
          <div class="aya-warning-card warning">
            <div class="aya-warning-title">
              <i class="${dialogCms.icons.warning}" style="color:#ea580c;"></i>
              ${dialogCms.upgrade.warningTitle}
            </div>
            <div class="aya-warning-desc">
              ${dialogCms.upgrade.warningDescription}
              <br /><br />
              <b>${currentPlanName}</b> → <b>${newPlanName}</b>
            </div>
          </div>

          <div class="aya-warning-card info">
            <div class="aya-warning-title">
              <i class="${dialogCms.icons.info}" style="color:#4f46e5;"></i>
              ${dialogCms.upgrade.confirmTitle}
            </div>
            <div class="aya-warning-desc">
              ${dialogCms.upgrade.confirmDescription}
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
        if (hasConfirmedScheduledPass) {
            await Swal.fire({
                icon: "info",
                title: subscriptionCms.dialogs.messages.alreadyScheduledTitle,
                text: subscriptionCms.dialogs.messages.alreadyScheduledRenewText,
            });
            return;
        }

        await openOneTimeRenewDialog(effectiveCurrentPass.plan);
    }

    async function handleSubscribeRecurringCurrentPass() {
        if (!effectiveCurrentPass?.plan) return;
        const ok = await ensureLoggedIn();
        if (!ok) return;

        if (hasConfirmedScheduledPass) {
            await Swal.fire({
                icon: "info",
                title: subscriptionCms.dialogs.messages.alreadyScheduledTitle,
                text: subscriptionCms.dialogs.messages.alreadyScheduledRecurringText,
            });
            return;
        }

        if (currentPassRenewalState === "AUTO_RENEW_CANCELED" && onResumeAutoRenewal) {
            const resumed = await onResumeAutoRenewal(effectiveCurrentPass);
            if (resumed) return;
        }

        const dialogCms = subscriptionCms.dialogs;
        const confirm = await Swal.fire({
            ...getDialogBaseOptions(),
            title: dialogCms.subscribeRecurring.title,
            confirmButtonText: dialogCms.subscribeRecurring.confirmButton,
            cancelButtonText: cmsData.common.actions.close,
            html: `
        <div class="aya-dialog text-left">
          ${getDialogSharedStyle()}

          <div class="aya-warning-stack">
            <div class="aya-warning-card info">
              <div class="aya-warning-title">
                <i class="${dialogCms.icons.recurring}" style="color:#7c3aed;"></i>
                ${dialogCms.subscribeRecurring.infoTitle}
              </div>
              <div class="aya-warning-desc">
                ${dialogCms.subscribeRecurring.infoDescription}
              </div>
            </div>

            <div class="aya-warning-card">
              <div class="aya-warning-title">
                <i class="${dialogCms.icons.heartShield}" style="color:#4f46e5;"></i>
                ${dialogCms.subscribeRecurring.fitTitle}
              </div>
              <div class="aya-warning-desc">
                ${dialogCms.subscribeRecurring.fitDescription}
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
        const targetPass = cancelAutoRenewTargetPass;
        if (!targetPass || !onCancelAutoRenewal) return;

        const dialogCms = subscriptionCms.dialogs;
        const result = await Swal.fire({
            ...getDialogBaseOptions(),
            title: subscriptionCms.actions.cancelAutoRenewalConfirmTitle,
            confirmButtonText: subscriptionCms.actions.cancelAutoRenewalConfirmButton,
            cancelButtonText: cmsData.common.actions.close,
            customClass: {
                ...getDialogBaseOptions().customClass,
                confirmButton:
                    "inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-rose-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
            },
            html: `
        <div class="aya-dialog text-left">
          ${getDialogSharedStyle()}

          <div class="aya-warning-stack">
            <div class="aya-warning-card warning">
              <div class="aya-warning-title">
                <i class="${dialogCms.icons.ban}" style="color:#dc2626;"></i>
                ${dialogCms.cancelAutoRenew.warningTitle}
              </div>
              <div class="aya-warning-desc">
                ${dialogCms.cancelAutoRenew.warningDescription}
              </div>
            </div>

            <div class="aya-warning-card info">
              <div class="aya-warning-title">
                <i class="${dialogCms.icons.info}" style="color:#4f46e5;"></i>
                ${dialogCms.cancelAutoRenew.infoTitle}
              </div>
              <div class="aya-warning-desc">
                ${dialogCms.cancelAutoRenew.infoDescription}
              </div>
            </div>
          </div>
        </div>
      `,
        });

        if (!result.isConfirmed) return;
        await onCancelAutoRenewal(targetPass);
    }

    async function handleUpgradePlan(plan: any) {
        const activePlanId = effectiveCurrentPass?.plan?.id ?? null;
        const shouldShowUpgradeWarning = activePlanId != null && activePlanId !== plan?.id;

        if (shouldShowUpgradeWarning) {
            const agreed = await openUpgradeConfirmDialog(plan);
            if (!agreed) return;
        }

        await openCheckoutMethodDialog(plan);
    }

    return (
        <>
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_52%,#f1f5f9_100%)] p-3 shadow-[0_24px_72px_rgba(15,23,42,0.07)] sm:p-4 lg:p-5">
                <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-amber-100/40 blur-3xl" />

                <div className="relative space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">
                                {subscriptionCms.header.eyebrow}
                            </p>
                            <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-950 sm:text-[1.625rem]">
                                {subscriptionCms.header.title}
                            </h2>
                            {subscriptionCms.header.description ? (
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    {subscriptionCms.header.description}
                                </p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={() => setHistoryModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-3.5 py-2.5 text-[13px] font-bold text-slate-800 shadow-[0_10px_22px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-white"
                        >
                            <i className={subscriptionCms.header.historyButtonIcon} />
                            <span>{subscriptionCms.header.historyButton}</span>
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                {totalHistoryCount}
                            </span>
                        </button>
                    </div>

                    {subscriptionLoading ? (
                        <div className="space-y-4">
                            <div className="min-h-[290px] animate-pulse rounded-[30px] border border-white/60 bg-white/70" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <section className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.95)_48%,rgba(51,65,85,0.92)_100%)] p-4 text-white shadow-[0_20px_56px_rgba(15,23,42,0.2)] sm:p-5">
                                <div className="pointer-events-none absolute -right-20 top-0 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
                                <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />

                                <div className="relative flex h-full flex-col gap-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">
                                                {subscriptionCms.summary.currentPlanTitle}
                                            </p>
                                            <h3 className="mt-1.5 text-xl font-black tracking-tight text-white sm:text-[1.75rem]">
                                                {effectiveCurrentPass?.plan?.name || subscriptionCms.summary.currentPlanFallback}
                                            </h3>
                                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                                                {effectiveCurrentPass
                                                    ? `${subscriptionCms.summary.cycleLabel}: ${formatDate(effectiveCurrentPass.startAt)} - ${formatDate(effectiveCurrentPass.endAt)} • ${subscriptionCms.summary.graceUntilLabel}: ${formatDate(effectiveCurrentPass.graceUntil)}`
                                                    : subscriptionCms.summary.noActivePass}
                                            </p>
                                        </div>

                                        {effectiveCurrentPass ? (
                                            <span
                                                className={classNames(
                                                    "inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-sm",
                                                    passStatusStyles[getDisplayPassStatus(effectiveCurrentPass)] ||
                                                    "border-white/20 bg-white/10 text-white",
                                                )}
                                            >
                                                {getPassStatusLabel(
                                                    getDisplayPassStatus(effectiveCurrentPass),
                                                    subscriptionCms.statuses.pass,
                                                )}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <MetricCard
                                            label={subscriptionCms.summary.remainingQuota}
                                            value={effectiveCurrentPass?.remainingUnlocks ?? 0}
                                            hint={subscriptionCms.summary.statusCardDescription}
                                        />
                                        <MetricCard
                                            label={subscriptionCms.summary.unlockedCount}
                                            value={effectiveCurrentPass?.unlockCount ?? 0}
                                        />
                                        <MetricCard
                                            label={subscriptionCms.summary.unlockNew}
                                            value={
                                                (effectiveCurrentPassStatus === "ACTIVE" || effectiveCurrentPassStatus === "GRACE") &&
                                                (effectiveCurrentPass?.remainingUnlocks || 0) > 0
                                                    ? subscriptionCms.summary.canUnlockYes
                                                    : subscriptionCms.summary.canUnlockNo
                                            }
                                            hint={`${subscriptionCms.summary.renewalModeLabel}: ${subscriptionCms.insights.renewalModes[renewalMode]}`}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-slate-100">
                                            {subscriptionCms.summary.renewalModeLabel}: {subscriptionCms.insights.renewalModes[renewalMode]}
                                        </span>

                                        {showCancelAutoRenewAction ? (
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-2.5 text-sm font-extrabold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                                                disabled={!onCancelAutoRenewal || !cancelAutoRenewTargetPass || subscriptionActionPlanId === cancelAutoRenewTargetPass.plan.id}
                                                onClick={() => void handleCancelAutoRenewal()}
                                            >
                                                {subscriptionCms.actions.cancelAutoRenewal}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    disabled={
                                                        !effectiveCurrentPass ||
                                                        hasConfirmedScheduledPass ||
                                                        subscriptionActionPlanId === effectiveCurrentPass.plan.id
                                                    }
                                                    onClick={() => void handleRenewCurrentPass()}
                                                >
                                                    {effectiveCurrentPass && subscriptionActionPlanId === effectiveCurrentPass.plan.id
                                                        ? subscriptionCms.actions.processing
                                                        : subscriptionCms.actions.renewNow}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/10 px-4 py-2.5 text-sm font-extrabold text-violet-50 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                                                    disabled={
                                                        !effectiveCurrentPass ||
                                                        hasConfirmedScheduledPass ||
                                                        subscriptionActionPlanId === effectiveCurrentPass.plan.id ||
                                                        !effectiveCurrentPass.plan.currentStripePriceId
                                                    }
                                                    title={
                                                        effectiveCurrentPass && !effectiveCurrentPass.plan.currentStripePriceId
                                                            ? subscriptionCms.actions.stripeRecurringUnavailableTitle
                                                            : undefined
                                                    }
                                                    onClick={() => void handleSubscribeRecurringCurrentPass()}
                                                >
                                                    {subscriptionCms.actions.registerAutoRenewal}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {subscriptionError ? (
                                        <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                            {subscriptionError}
                                        </div>
                                    ) : null}
                                </div>
                            </section>

                        </div>
                    )}

                    <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    {subscriptionCms.planList.title}
                                </p>
                                {subscriptionCms.planList.description ? (
                                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
                                        {subscriptionCms.planList.description}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <span className="font-semibold text-slate-500">{subscriptionCms.header.metrics.plans}:</span>{" "}
                                    <span className="font-black text-slate-950">{publicPlans.length}</span>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <span className="font-semibold text-slate-500">{subscriptionCms.header.metrics.histories}:</span>{" "}
                                    <span className="font-black text-slate-950">{totalHistoryCount}</span>
                                </div>
                            </div>
                        </div>

                        {publicPlans.length === 0 ? (
                            <div className="mt-4 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center text-sm text-slate-600">
                                {subscriptionCms.planList.emptyText}
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {publicPlans.map((plan) => {
                                    const highlighted = focusedPlanId === plan.id;
                                    const isCurrentPlan = currentPlanId != null && currentPlanId === plan.id;
                                    const planPrice = Number(plan?.price || 0);
                                    const isLowerThanCurrentPlan = currentPlanPrice != null && planPrice < currentPlanPrice;
                                    const excludedTagsText =
                                        plan.excludedTags?.length > 0
                                            ? plan.excludedTags.map((tag: any) => tag.code).join(", ")
                                            : subscriptionCms.planCard.noBlockedTags;

                                    return (
                                        <article
                                            key={plan.id}
                                            className={classNames(
                                                "rounded-[22px] border p-4 transition",
                                                highlighted
                                                    ? "border-indigo-300 bg-[linear-gradient(180deg,#ffffff_0%,#eef2ff_100%)] shadow-[0_14px_34px_rgba(79,70,229,0.10)]"
                                                    : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_10px_28px_rgba(15,23,42,0.045)]",
                                            )}
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {plan.code ? (
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                                    {plan.code}
                                                                </p>
                                                            ) : null}

                                                            {highlighted ? (
                                                                <span className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">
                                                                    {subscriptionCms.planCard.featuredBadge}
                                                                </span>
                                                            ) : null}

                                                            {isCurrentPlan ? (
                                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                                                    {subscriptionCms.planCard.currentPlanBadge}
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <h3 className="mt-1.5 text-lg font-black tracking-tight text-slate-950">
                                                            {plan.name}
                                                        </h3>
                                                    </div>

                                                    <div className="text-left md:text-right">
                                                        <p className="text-xl font-black text-slate-950">{formatMoney(plan.price)}</p>
                                                        <p className="mt-0.5 text-xs text-slate-500">{subscriptionCms.planCard.priceLabel}</p>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                                    <div className="rounded-[16px] border border-slate-200 bg-white/90 px-3 py-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                                            {subscriptionCms.planCard.quotaLabel}
                                                        </p>
                                                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                                                            {plan.maxUnlocks ?? cmsData.common.emptyValue}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-[16px] border border-slate-200 bg-white/90 px-3 py-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                                            {subscriptionCms.planCard.durationLabel}
                                                        </p>
                                                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                                                            {plan.durationDays != null
                                                                ? `${plan.durationDays} ${subscriptionCms.planCard.durationUnits.day}`
                                                                : cmsData.common.emptyValue}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-[16px] border border-slate-200 bg-white/90 px-3 py-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                                            {subscriptionCms.planCard.maxCoursePriceLabel}
                                                        </p>
                                                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                                                            {plan.maxCoursePrice != null
                                                                ? formatMoney(plan.maxCoursePrice)
                                                                : subscriptionCms.planCard.unlimited}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-[16px] border border-slate-200 bg-white/90 px-3 py-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                                            {subscriptionCms.planCard.blockedTagsLabel}
                                                        </p>
                                                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                                                            {excludedTagsText}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                                                    {!isCurrentPlan && isLowerThanCurrentPlan ? (
                                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                                            {subscriptionCms.planCard.lowerPlanHint}
                                                        </div>
                                                    ) : null}

                                                    <div className={classNames("sm:w-[180px]", !isCurrentPlan && isLowerThanCurrentPlan ? "" : "sm:ml-auto")}>
                                                        {isCurrentPlan ? (
                                                            <span className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-extrabold text-emerald-700">
                                                                {subscriptionCms.planCard.currentPlanBadge}
                                                            </span>
                                                        ) : !isLowerThanCurrentPlan ? (
                                                            <button
                                                                type="button"
                                                                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                                disabled={hasConfirmedScheduledPass || subscriptionActionPlanId === plan.id}
                                                                onClick={() => void handleUpgradePlan(plan)}
                                                            >
                                                                {subscriptionActionPlanId === plan.id
                                                                    ? subscriptionCms.actions.processing
                                                                    : subscriptionCms.actions.upgrade}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {historyModalOpen ? (
                <div
                    className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
                    onClick={() => setHistoryModalOpen(false)}
                >
                    <div
                        className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_28px_72px_rgba(15,23,42,0.24)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                                        {subscriptionCms.history.modalTitle}
                                    </p>
                                    <h3 className="mt-1.5 text-xl font-black tracking-tight text-slate-950">
                                        {subscriptionCms.header.historyButton}
                                    </h3>
                                    {subscriptionCms.history.modalDescription ? (
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                            {subscriptionCms.history.modalDescription}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <MetricCard label={subscriptionCms.history.passTitle} value={sortedPassHistory.length} />
                                        <MetricCard label={subscriptionCms.history.paymentTitle} value={sortedPaymentHistory.length} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHistoryModalOpen(false)}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                                        aria-label={cmsData.common.actions.close}
                                    >
                                        <i className={subscriptionCms.header.closeIcon} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setHistoryTab("passes")}
                                    className={classNames(
                                        "rounded-[14px] px-4 py-2.5 text-sm font-extrabold transition",
                                        historyTab === "passes"
                                            ? "bg-white text-slate-950 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900",
                                    )}
                                >
                                    {subscriptionCms.history.passesTab} ({sortedPassHistory.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHistoryTab("payments")}
                                    className={classNames(
                                        "rounded-[14px] px-4 py-2.5 text-sm font-extrabold transition",
                                        historyTab === "payments"
                                            ? "bg-white text-slate-950 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900",
                                    )}
                                >
                                    {subscriptionCms.history.paymentsTab} ({sortedPaymentHistory.length})
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-4 sm:px-5">
                            {historyTab === "passes" ? (
                                sortedPassHistory.length === 0 ? (
                                    <HistoryEmptyState title={subscriptionCms.history.passEmptyText} />
                                ) : (
                                    <div className="space-y-3">
                                        {sortedPassHistory.map((pass) => (
                                            <article
                                                key={pass.id}
                                                className="rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.045)]"
                                            >
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <p className="text-base font-black tracking-tight text-slate-950">{pass.plan?.name}</p>
                                                            <span
                                                                className={classNames(
                                                                    "inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold",
                                                                    passStatusStyles[getDisplayPassStatus(pass)] ||
                                                                    "border-slate-200 bg-slate-50 text-slate-700",
                                                                )}
                                                            >
                                                                {getPassStatusLabel(getDisplayPassStatus(pass), subscriptionCms.statuses.pass)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                                            {formatDate(pass.startAt)} - {formatDate(pass.endAt)} • {subscriptionCms.summary.graceUntilLabel}: {formatDate(pass.graceUntil)}
                                                        </p>
                                                    </div>

                                                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                                                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3.5">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                                {subscriptionCms.history.remainingQuota}
                                                            </p>
                                                            <p className="mt-1 text-base font-black text-slate-950">{pass.remainingUnlocks}</p>
                                                        </div>
                                                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3.5">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                                {subscriptionCms.history.unlockCount}
                                                            </p>
                                                            <p className="mt-1 text-lg font-black text-slate-950">{pass.unlockCount}</p>
                                                        </div>
                                                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3.5">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                                {subscriptionCms.history.paymentCode}
                                                            </p>
                                                            <p className="mt-1 truncate text-sm font-black text-slate-950">
                                                                {pass.purchaseId || cmsData.common.emptyValue}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )
                            ) : sortedPaymentHistory.length === 0 ? (
                                <HistoryEmptyState title={subscriptionCms.history.paymentEmptyText} />
                            ) : (
                                <div className="space-y-3">
                                    {sortedPaymentHistory.map((payment) => (
                                        <article
                                            key={payment.id}
                                            className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <p className="text-lg font-black tracking-tight text-slate-950">{payment.plan?.name}</p>
                                                        <span
                                                            className={classNames(
                                                                "inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold",
                                                                planPaymentStatusStyles[payment.computedStatus] ||
                                                                "border-slate-200 bg-slate-50 text-slate-700",
                                                            )}
                                                        >
                                                            {getPaymentStatusLabel(payment.computedStatus, subscriptionCms.statuses.payment)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                                        {subscriptionCms.history.amount}: {formatMoney(payment.amount)} • {subscriptionCms.history.createdAt}: {formatDateTime(payment.createdAt)}
                                                    </p>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
                                                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3.5">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            {subscriptionCms.history.transferContent}
                                                        </p>
                                                        <p className="mt-1 break-all text-sm font-black text-slate-950">
                                                            {payment.transferContent || cmsData.common.emptyValue}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3.5">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            {subscriptionCms.history.paymentSource}
                                                        </p>
                                                        <p className="mt-1 text-sm font-black text-slate-950">
                                                            {payment.paymentSource || payment.provider || cmsData.common.emptyValue}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-3.5 sm:col-span-2">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            {subscriptionCms.history.paidAt}
                                                        </p>
                                                        <p className="mt-1 text-sm font-black text-slate-950">
                                                            {formatDateTime(payment.paidAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {payment.computedStatus === "PENDING" && payment.sepay ? (
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                                                        onClick={() => openPlanPaymentModal(payment)}
                                                    >
                                                        <i className={subscriptionCms.dialogs.icons.qr} />
                                                        {subscriptionCms.actions.openPaymentQr}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {planPaymentModal?.sepay ? (
                <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={() => setPlanPaymentModal(null)}>
                    <div
                        className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.26)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-black tracking-tight text-slate-950">{subscriptionCms.qrModal.title}</h3>
                            <button
                                type="button"
                                onClick={() => setPlanPaymentModal(null)}
                                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                {cmsData.common.actions.close}
                            </button>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            {subscriptionCms.qrModal.planLabel}: <span className="font-bold text-slate-800">{planPaymentModal.plan.name}</span>
                        </p>

                        <div className="relative mx-auto mt-5 flex h-72 w-72 items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 shadow-inner">
                            <img
                                src={planPaymentModal.sepay.qrUrl}
                                alt={subscriptionCms.qrModal.qrAlt}
                                className={
                                    "h-64 w-64 rounded-[22px] border border-slate-200 bg-white p-2 transition " +
                                    (planQrCountdown.expired ? "opacity-40 blur-[2px]" : "")
                                }
                            />
                        </div>

                        <div className="mt-5 space-y-2 text-sm text-slate-700">
                            <p>
                                <span className="font-semibold">{subscriptionCms.qrModal.amount}:</span> {formatMoney(Number(planPaymentModal.sepay.amount || 0))}
                            </p>
                            <p>
                                <span className="font-semibold">{subscriptionCms.qrModal.transferContent}:</span> {planPaymentModal.sepay.transferContent}
                            </p>
                            <p>
                                <span className="font-semibold">{subscriptionCms.qrModal.timeLeft}:</span> {planQrCountdown.text}
                            </p>
                            <p>
                                <span className="font-semibold">{subscriptionCms.qrModal.expiresAt}:</span> {formatDateTime(planQrExpiresAt)}
                            </p>
                        </div>

                        {planQrCountdown.expired ? (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700">
                                {subscriptionCms.qrModal.expiredMessage}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                                {subscriptionCms.qrModal.waitingMessage}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </>
    );
}
