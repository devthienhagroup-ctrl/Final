import React, {useMemo, useState} from "react";

type Billing = "monthly" | "yearly";

// Định nghĩa kiểu dữ liệu cho CMS content
type CMSPricingData = {
    // Header section
    headerTitle: string;
    headerDescription: string;

    // Feature badges
    badges: string[]; // Mảng 3 badge: ["Hoàn tiền 7 ngày nếu không phù hợp", "Hỗ trợ triển khai 8:00–18:00", "Sẵn sàng chuyển sang React/NestJS sau khi chốt UI"]

    // Billing toggle section
    billingTitle: string;
    billingDescription: string;
    monthlyLabel: string;
    yearlyLabel: string;
    yearlyDiscountText: string;

    // Quick guide
    quickGuideTitle: string;
    quickGuideItems: string[]; // Mảng 3 item

    // Pricing cards notes
    starterName: string;
    starterDescription: string;
    starterFeatureNote: string;
    starterSuitableTitle: string;
    starterSuitableText: string;
    starterCtaText: string;
    starterUpgradeNote: string;

    proName: string;
    proDescription: string;
    proPopularBadge: string;
    proFeatureNote: string;
    proResultsTitle: string;
    proResultsItems: string[]; // Mảng 3 item
    proCtaText: string;
    proGiftNote: string;

    businessName: string;
    businessDescription: string;
    businessFeatureNote: string;
    businessBenefitsTitle: string;
    businessBenefitsItems: string[]; // Mảng 3 item
    businessCtaText: string;

    // Feature comparison table
    comparisonTitle: string;
    comparisonDescription: string;
    comparisonCtaText: string;
    comparisonTableHeaders: string[]; // ["Tính năng", "Starter", "Pro", "Business"]
    comparisonRows: {
        feature: string;
        starter: string;
        pro: string;
        business: string;
    }[]; // Mảng các dòng so sánh
    comparisonFooterNote: string;
    comparisonPrimaryCta: string;
    comparisonSecondaryCta: string;
};

// Props interface
interface PricingSectionProps {
    cmsData?: CMSPricingData;
}

function fmtPrice(vnd: number) {
    const k = Math.round(vnd / 1000);
    return `${k}k`;
}

// Default CMS data (nội dung mẫu hiện tại)
const defaultCmsData: CMSPricingData = {
    // Header
    headerTitle: "Bảng giá AYANAVITA",
    headerDescription: "Chọn gói phù hợp theo quy mô vận hành và mục tiêu bán khoá học. Bạn có thể bắt đầu nhỏ (Starter), nâng lên Pro khi cần tăng chuyển đổi, hoặc chọn Business nếu muốn triển khai theo mô hình trung tâm/doanh nghiệp.",

    // Badges
    badges: [
        "Hoàn tiền 7 ngày nếu không phù hợp",
        "Hỗ trợ triển khai 8:00–18:00",
        "Sẵn sàng chuyển sang React/NestJS sau khi chốt UI"
    ],

    // Billing
    billingTitle: "Chu kỳ thanh toán",
    billingDescription: "Gói năm tiết kiệm hơn, phù hợp triển khai dài hạn.",
    monthlyLabel: "Theo tháng",
    yearlyLabel: "Theo năm",
    yearlyDiscountText: "-20%",

    // Quick guide
    quickGuideTitle: "Gợi ý chọn gói nhanh",
    quickGuideItems: [
        "Mới bắt đầu bán khóa: Starter",
        "Tăng chuyển đổi, upsell: Pro",
        "Trung tâm/doanh nghiệp: Business"
    ],

    // Starter card
    starterName: "Starter",
    starterDescription: "Cho cá nhân/nhóm nhỏ bắt đầu bán khóa học.",
    starterFeatureNote: "Tập trung vào những thứ quan trọng nhất: catalog, trang chi tiết khóa học, và trải nghiệm học cơ bản. Phù hợp làm prototype HTML → chốt layout → chuyển React.",
    starterSuitableTitle: "Phù hợp nếu",
    starterSuitableText: "Bạn đang ở giai đoạn launch nhanh, cần landing + catalog + flow học đơn giản để bắt đầu bán.",
    starterCtaText: "Chọn gói Starter",
    starterUpgradeNote: "Có thể nâng cấp lên Pro bất kỳ lúc nào.",

    // Pro card
    proName: "Pro",
    proDescription: "Tối ưu chuyển đổi, phù hợp bán khóa học nghiêm túc.",
    proPopularBadge: "Phổ biến nhất",
    proFeatureNote: "Dành cho mô hình “bán khóa học”: tăng trust (review/proof), tối ưu CTA & checkout, voucher/khuyến mãi, dashboard học viên và báo cáo cơ bản để soi conversion.",
    proResultsTitle: "Kết quả thường thấy",
    proResultsItems: [
        "Tăng tỷ lệ đăng ký/lead nhờ proof",
        "Giảm bỏ giỏ nhờ checkout ít bước",
        "Tăng retention nhờ progress rõ"
    ],
    proCtaText: "Chọn gói Pro",
    proGiftNote: "Tặng bộ template landing + checklist triển khai LMS.",

    // Business card
    businessName: "Business",
    businessDescription: "Cho trung tâm/doanh nghiệp cần vận hành quy mô.",
    businessFeatureNote: "Dành cho nhu cầu tuỳ biến: nhiều giảng viên, phân quyền sâu, báo cáo/đối soát, tích hợp (CRM, payment, SSO...). Bạn sẽ nhận tư vấn giải pháp và báo giá theo scope.",
    businessBenefitsTitle: "Bạn sẽ nhận được",
    businessBenefitsItems: [
        "Roadmap triển khai + scope",
        "Đề xuất kiến trúc React/NestJS/Prisma",
        "Kế hoạch vận hành & phân quyền"
    ],
    businessCtaText: "Nhận tư vấn Business",

    // Feature comparison
    comparisonTitle: "So sánh tính năng nhanh",
    comparisonDescription: "Bảng dưới giúp bạn nhìn rõ khác biệt giữa các gói, tránh phải đoán khi ra quyết định.",
    comparisonCtaText: "Đăng ký để nhận ưu đãi",
    comparisonTableHeaders: ["Tính năng", "Starter", "Pro", "Business"],
    comparisonRows: [
        { feature: "Catalog + Search + Filter", starter: "✓", pro: "✓", business: "✓" },
        { feature: "Course Detail (proof + FAQ)", starter: "Cơ bản", pro: "✓", business: "✓" },
        { feature: "Checkout + Voucher", starter: "—", pro: "✓", business: "✓" },
        { feature: "Dashboard học viên", starter: "Cơ bản", pro: "✓", business: "✓" },
        { feature: "Admin panel + RBAC nâng cao", starter: "—", pro: "Giới hạn", business: "✓" },
        { feature: "Tích hợp (CRM/SSO/Payment)", starter: "—", pro: "Tuỳ chọn", business: "✓" }
    ],
    comparisonFooterNote: "Bạn muốn thêm gói “Team” hoặc “Enterprise”? Có thể mở rộng tuỳ theo chiến lược kinh doanh.",
    comparisonPrimaryCta: "Bắt đầu ngay",
    comparisonSecondaryCta: "Tư vấn gói phù hợp"
};

export function PricingSection({ cmsData }: PricingSectionProps) {
    const [billing, setBilling] = useState<Billing>("monthly");

    // Merge default data with props data
    const data = { ...defaultCmsData, ...cmsData };

    const prices = useMemo(() => {
        const monthly = {starter: 199_000, pro: 399_000};
        const yearly = {starter: Math.round(monthly.starter * 0.8), pro: Math.round(monthly.pro * 0.8)};
        return {monthly, yearly};
    }, []);

    const starter = billing === "monthly" ? prices.monthly.starter : prices.yearly.starter;
    const pro = billing === "monthly" ? prices.monthly.pro : prices.yearly.pro;

    return (
        <section id="pricing" className="mx-auto max-w-6xl px-4 pb-16">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        {data.headerTitle}
                    </h2>
                    <p className="mt-2 max-w-2xl text-slate-600">
                        {data.headerDescription}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                        {data.badges.map((badge, index) => {
                            const icons = [
                                <span key="shield" className="text-amber-600"><i className="fa-solid fa-shield-halved"></i></span>,
                                <span key="headphones" className="text-indigo-600"><i className="fa-solid fa-headphones"></i></span>,
                                <span key="bolt" className="text-emerald-600"><i className="fa-solid fa-bolt"></i></span>
                            ];
                            return (
                                <div key={index} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 ring-1 ring-slate-200">
                                    <span>{icons[index % icons.length]}</span>
                                    <span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: badge }} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Billing Toggle */}
                <div className="card p-4 md:p-5">
                    <div className="text-sm font-semibold text-slate-900">{data.billingTitle}</div>
                    <p className="mt-1 text-sm text-slate-600">{data.billingDescription}</p>

                    <div className="mt-3 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setBilling("monthly")}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                billing === "monthly"
                                    ? "bg-slate-900 text-white hover:opacity-90"
                                    : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {data.monthlyLabel}
                        </button>

                        <button
                            type="button"
                            onClick={() => setBilling("yearly")}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                billing === "yearly"
                                    ? "bg-slate-900 text-white hover:opacity-90"
                                    : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {data.yearlyLabel}{" "}
                            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                {data.yearlyDiscountText}
                            </span>
                        </button>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="text-xs font-semibold text-slate-500">{data.quickGuideTitle}</div>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {data.quickGuideItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="font-bold text-amber-600">•</span>
                                    <span dangerouslySetInnerHTML={{ __html: item }} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pricing Cards - Giữ nguyên phần này vì lấy từ DB */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
                {/* Starter */}
                <div className="card p-7 flex flex-col">
                    {/* ... giữ nguyên nội dung card Starter ... */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-900">{data.starterName}</div>
                            <p className="mt-1 text-sm text-slate-600">{data.starterDescription}</p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100">
                            <span className="text-indigo-700"><i className="fa-solid fa-seedling"></i></span>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="flex items-end gap-2">
                            <div className="text-4xl font-extrabold text-slate-900">{fmtPrice(starter)}</div>
                            <div className="pb-1 text-sm text-slate-600">{billing === "monthly" ? "/tháng" : "/tháng (năm)"}</div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{data.starterFeatureNote}</p>
                    </div>

                    <ul className="mt-5 space-y-2 text-sm text-slate-700">
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Catalog + lọc theo danh mục</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Course detail (outline + CTA)</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Player video + progress cơ bản</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> 1 admin, phân quyền cơ bản</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Hỗ trợ email trong giờ hành chính</li>
                    </ul>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="text-xs font-semibold text-slate-500">{data.starterSuitableTitle}</div>
                        <p className="mt-1 text-sm text-slate-700">{data.starterSuitableText}</p>
                    </div>
                    <div className="mt-auto">
                        <a href="#register" className="mt-6 inline-flex w-full justify-center rounded-2xl btn-primary px-5 py-3 text-sm font-semibold">
                            {data.starterCtaText}
                        </a>
                        <p className="mt-3 text-center text-xs text-slate-500">{data.starterUpgradeNote}</p>
                    </div>
                </div>

                {/* Pro */}
                <div className="relative rounded-3xl p-7 shadow-lg ring-2 ring-amber-300/60 gradient-primary">
                    <div className="absolute -top-3 -right-3 rounded-full px-4 py-1 text-xs font-bold text-slate-900 shadow-lg gradient-accent">
                        {data.proPopularBadge}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-white">{data.proName}</div>
                            <p className="mt-1 text-sm text-white/85">{data.proDescription}</p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/15">
                            <span className="text-yellow-300"><i className="fa-solid fa-bolt"></i></span>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="flex items-end gap-2">
                            <div className="text-4xl font-extrabold text-white">{fmtPrice(pro)}</div>
                            <div className="pb-1 text-sm text-white/80">{billing === "monthly" ? "/tháng" : "/tháng (năm)"}</div>
                        </div>
                        <p className="mt-2 text-sm text-white/90">{data.proFeatureNote}</p>
                    </div>

                    <ul className="mt-5 space-y-2 text-sm text-white/90">
                        <li className="flex items-start gap-2"><span className="font-bold text-yellow-300">•</span> Tất cả tính năng Starter</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-yellow-300">•</span> Course detail “đẩy mua”: proof, FAQ</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-yellow-300">•</span> Checkout + voucher/ưu đãi</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-yellow-300">•</span> Dashboard học viên + lịch sử học</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-yellow-300">•</span> SEO cơ bản & landing dài</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-yellow-300">•</span> Priority support</li>
                    </ul>

                    <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                        <div className="text-xs font-semibold text-white/80">{data.proResultsTitle}</div>
                        <ul className="mt-2 space-y-1 text-sm text-white/90">
                            {data.proResultsItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="font-bold text-yellow-300">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <a href="#register" className="mt-6 inline-flex w-full justify-center rounded-2xl btn-accent px-5 py-3 text-sm font-semibold">
                        {data.proCtaText}
                    </a>
                    <p className="mt-3 text-center text-xs text-white/80">{data.proGiftNote}</p>
                </div>

                {/* Business */}
                <div className="card p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-900">{data.businessName}</div>
                            <p className="mt-1 text-sm text-slate-600">{data.businessDescription}</p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
                            <span className="text-emerald-700"><i className="fa-solid fa-city"></i></span>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="text-4xl font-extrabold text-slate-900">Liên hệ</div>
                        <p className="mt-2 text-sm text-slate-600">{data.businessFeatureNote}</p>
                    </div>

                    <ul className="mt-5 space-y-2 text-sm text-slate-700">
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Tất cả tính năng Pro</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Instructor/Admin nâng cao</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> RBAC + audit log</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Báo cáo nâng cao</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> Tích hợp CRM/SSO/Payment</li>
                        <li className="flex items-start gap-2"><span className="font-bold text-amber-600">•</span> SLA theo thỏa thuận</li>
                    </ul>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="text-xs font-semibold text-slate-500">{data.businessBenefitsTitle}</div>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {data.businessBenefitsItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="font-bold text-amber-600">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <a href="#contact" className="mt-6 inline-flex w-full justify-center rounded-2xl btn-primary px-5 py-3 text-sm font-semibold">
                        {data.businessCtaText}
                    </a>
                </div>
            </div>

            {/* Feature Comparison */}
            <div className="mt-10 card p-8">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">{data.comparisonTitle}</h3>
                        <p className="mt-1 text-sm text-slate-600">{data.comparisonDescription}</p>
                    </div>
                    <a href="#register" className="text-sm font-semibold text-indigo-600 hover:underline">
                        {data.comparisonCtaText}
                    </a>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-[760px] w-full text-sm">
                        <thead>
                        <tr className="text-left text-slate-600">
                            {data.comparisonTableHeaders.map((header, index) => (
                                <th key={index} className={index === 0 ? "py-3 pr-4" : index === 3 ? "py-3 pl-3" : "py-3 px-3"}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="text-slate-700">
                        {data.comparisonRows.map((row, index) => (
                            <tr key={index} className="border-t border-slate-200">
                                <td className="py-3 pr-4 font-medium text-slate-900">{row.feature}</td>
                                <td className="py-3 px-3">{row.starter === "✓" ? <span className="text-emerald-600">✓</span> : <span className="text-slate-400">{row.starter}</span>}</td>
                                <td className="py-3 px-3">{row.pro === "✓" ? <span className="text-emerald-600">✓</span> : <span className="text-slate-400">{row.pro}</span>}</td>
                                <td className="py-3 pl-3">{row.business === "✓" ? <span className="text-emerald-600">✓</span> : <span className="text-slate-400">{row.business}</span>}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-slate-600">{data.comparisonFooterNote}</div>
                    <div className="flex gap-2">
                        <a href="#register" className="rounded-xl btn-accent px-5 py-3 text-sm font-semibold">
                            {data.comparisonPrimaryCta}
                        </a>
                        <a href="#contact" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50">
                            {data.comparisonSecondaryCta}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}