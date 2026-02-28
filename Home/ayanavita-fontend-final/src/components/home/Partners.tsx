import React, { useState } from "react";

type Partner = {
    name: string;
    logoUrl: string;
};

type PartnersCMS = {
    title?: string;
    description?: string;
    trustedText?: string;
    gridPartners?: Partner[];
    marqueePartners?: Partner[];
};

type Props = {
    cmsData?: PartnersCMS;
};

const Logo: React.FC<{ partner: Partner }> = ({ partner }) => {
    const [error, setError] = useState(false);

    const hasValidLogo =
        partner.logoUrl &&
        partner.logoUrl.trim() !== "" &&
        !error;

    if (!hasValidLogo) {
        return (
            <div className="flex items-center gap-2 px-2">
                <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                    {partner.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-sm font-extrabold text-slate-700">
                    {partner.name}
                </span>
            </div>
        );
    }

    return (
        <img
            src={partner.logoUrl}
            alt={partner.name}
            className="h-full w-auto object-contain transition"
            onError={() => setError(true)}
            loading="lazy"
        />
    );
};

export const Partners: React.FC<Props> = ({ cmsData }) => {
    // Dữ liệu mặc định (giống như code cũ)
    const defaultGridPartners: Partner[] = [
        {
            name: "Coursera",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg",
        },
        {
            name: "Udemy",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Udemy_logo.svg",
        },
        {
            name: "edX",
            logoUrl: "https://www.edx.org/trademark-logos/edx-logo-elm.svg",
        },
        {
            name: "Skillshare",
            logoUrl: "https://tinyworkshops.com/wp-content/uploads/2020/08/skillshare-logo.jpg",
        },
        {
            name: "LinkedIn Learning",
            logoUrl: "https://www.gopomelo.com/hs-fs/hubfs/LinkedIn_Learning_Logo.png?width=5000&height=681&name=LinkedIn_Learning_Logo.png",
        },
        {
            name: "Pluralsight",
            logoUrl: "https://tse4.mm.bing.net/th/id/OIP.Jlv_za4hcnfuCJYRGxp0SwHaEH?rs=1&pid=ImgDetMain&o=7&rm=3",
        },
    ];

    const defaultMarqueePartners: Partner[] = [
        ...defaultGridPartners,
        {
            name: "Teachable",
            logoUrl: "https://tse3.mm.bing.net/th/id/OIP.NVr2MsW9NE1EJLNUuedhUwHaEv?rs=1&pid=ImgDetMain&o=7&rm=3",
        },
        {
            name: "Thinkific",
            logoUrl: "https://tse4.mm.bing.net/th/id/OIP.eyMmLEd5aznP7tI7GGHpigHaFj?rs=1&pid=ImgDetMain&o=7&rm=3",
        },
        {
            name: "Kajabi",
            logoUrl: "https://brandlogo.org/wp-content/uploads/2024/10/Kajabi-Logo-2024-300x300.png",
        },
        {
            name: "MasterClass",
            logoUrl: "https://logowik.com/content/uploads/images/masterclass4801.logowik.com.webp",
        },
        {
            name: "Udacity",
            logoUrl: "https://logospng.org/download/udacity/udacity-1536.png",
        },
        {
            name: "Khan Academy",
            logoUrl: "https://e7.pngegg.com/pngimages/997/403/png-clipart-khan-academy-full-logo-tech-companies.png",
        },
    ];

    // Sử dụng dữ liệu từ CMS nếu có, nếu không thì dùng mặc định
    const title = cmsData?.title ?? "Đối tác & nền tảng bán khoá học";
    const description = cmsData?.description ?? "Nếu ảnh lỗi sẽ hiển thị tên.";
    const trustedText = cmsData?.trustedText ?? "Trusted by learners worldwide";
    const gridPartners = cmsData?.gridPartners ?? defaultGridPartners;
    const marqueePartners = cmsData?.marqueePartners ?? defaultMarqueePartners;

    // Lặp lại marquee 2 lần để tạo hiệu ứng cuộn liên tục
    const repeatedMarquee = [...marqueePartners, ...marqueePartners];

    return (
        <section className="w-full pb-6">
            <div className="mx-auto max-w-6xl px-4">
                <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {description}
                            </p>
                        </div>
                        <div className="text-sm text-slate-600">
                            {trustedText}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="mt-6 grid grid-cols-2 items-center gap-6 md:grid-cols-6">
                        {gridPartners.map((p) => (
                            <div
                                key={p.name}
                                className="flex h-16 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow"
                            >
                                <Logo partner={p} />
                            </div>
                        ))}
                    </div>

                    {/* Marquee */}
                    <div className="mt-6 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                        <div
                            className="flex w-max gap-4 p-4 animate-[ayaMarquee_28s_linear_infinite] hover:[animation-play-state:paused]"
                            style={{ willChange: "transform" }}
                        >
                            {repeatedMarquee.map((p, idx) => (
                                <div
                                    key={`${p.name}-${idx}`}
                                    className="flex-none"
                                    style={{ width: 180 }}
                                >
                                    <div className="flex h-16 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                                        <Logo partner={p} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes ayaMarquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
};