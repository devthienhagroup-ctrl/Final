import React from "react";
import { motion } from "framer-motion";

const cmsData = {
    hero: {
        badge: "About AYANAVITA",
        title: "About AYANAVITA",
        description:
            "AYANAVITA là một thương hiệu wellness được xây dựng với mong muốn giúp con người hiểu rõ cơ thể của mình và tìm lại sự cân bằng trong cuộc sống.",
        subdescription:
            "Khi cuộc sống ngày càng bận rộn và nhiều áp lực, việc chăm sóc sức khỏe và tinh thần trở nên quan trọng hơn bao giờ hết. AYANAVITA được tạo ra để mang đến những trải nghiệm wellness giúp con người tái tạo năng lượng, chăm sóc bản thân và xây dựng một lối sống lành mạnh hơn.",
        tags: ["Trusted Wellness", "Personalized Care", "Balanced Living"],
        stats: [
            { label: "Approach", value: "Holistic" },
            { label: "Experience", value: "Personalized" },
            { label: "Focus", value: "Sustainable" },
        ],
    },
    intro: {
        badge: "Introduction",
        title: "A wellness brand built for deeper care and lasting balance",
        paragraphs: [
            "AYANAVITA là một thương hiệu wellness được xây dựng với mong muốn giúp con người hiểu rõ cơ thể của mình và tìm lại sự cân bằng trong cuộc sống.",
            "Khi cuộc sống ngày càng bận rộn và nhiều áp lực, việc chăm sóc sức khỏe và tinh thần trở nên quan trọng hơn bao giờ hết. AYANAVITA được tạo ra để mang đến những trải nghiệm wellness giúp con người tái tạo năng lượng, chăm sóc bản thân và xây dựng một lối sống lành mạnh hơn.",
        ],
    },
    approach: {
        badge: "Our Approach",
        title: "Professional, thoughtful, and centered around each individual",
        paragraphs: [
            "AYANAVITA tin rằng mỗi người đều có nhu cầu và hành trình sức khỏe riêng. Vì vậy, thay vì áp dụng một phương pháp chung cho tất cả, chúng tôi hướng tới việc tạo ra những trải nghiệm wellness được thiết kế phù hợp với từng cá nhân.",
            "Thông qua sự kết hợp giữa các phương pháp chăm sóc hiện đại và một góc nhìn toàn diện về sức khỏe và lối sống, AYANAVITA mang đến những trải nghiệm giúp khách hàng cảm thấy thư giãn, cân bằng và được tiếp thêm năng lượng.",
        ],
        points: [
            {
                title: "Personalized Wellness",
                description: "Mỗi trải nghiệm được định hướng để phù hợp hơn với nhu cầu và trạng thái riêng của từng người.",
            },
            {
                title: "Modern Care Methods",
                description: "Kết hợp cách tiếp cận hiện đại với tiêu chuẩn trải nghiệm chỉn chu và chuyên nghiệp.",
            },
            {
                title: "Holistic Perspective",
                description: "Không chỉ nhìn vào một nhu cầu đơn lẻ mà xem xét tổng thể sức khỏe, tinh thần và lối sống.",
            },
            {
                title: "Restorative Experience",
                description: "Hướng tới cảm giác thư giãn, tái tạo năng lượng và cân bằng bền vững hơn mỗi ngày.",
            },
        ],
    },
    vision: {
        badge: "Our Vision",
        title: "Creating a trusted wellness ecosystem for modern life",
        paragraphs: [
            "Tầm nhìn của AYANAVITA là xây dựng một hệ sinh thái wellness nơi con người có thể khám phá những cách chăm sóc sức khỏe tự nhiên, bền vững và phù hợp với cuộc sống hiện đại.",
            "Chúng tôi tin rằng wellness không chỉ là một dịch vụ, mà là một hành trình lâu dài giúp mỗi người sống khỏe mạnh, cân bằng và trọn vẹn hơn.",
        ],
        quote:
            "Wellness is not only about feeling better today, but about building a more balanced life over time.",
    },
    community: {
        badge: "Our Community",
        title: "A community connected by care, wellbeing, and healthy living",
        paragraphs: [
            "AYANAVITA hướng tới việc kết nối những con người cùng quan tâm đến sức khỏe và phong cách sống lành mạnh.",
            "Thông qua các trải nghiệm wellness, các chương trình chăm sóc cá nhân hóa và sự hợp tác với các chuyên gia và đối tác trong lĩnh vực wellness, AYANAVITA mong muốn tạo ra một cộng đồng nơi mọi người có thể cùng nhau khám phá và nuôi dưỡng sức khỏe toàn diện.",
        ],
        highlights: [
            "Wellness experiences",
            "Personalized care programs",
            "Expert collaboration",
            "Healthy lifestyle connection",
        ],
    },
    closing: {
        badge: "Closing",
        title: "More than a place for beauty and wellness care",
        paragraphs: [
            "AYANAVITA không chỉ là một địa điểm chăm sóc sức khỏe và sắc đẹp.",
            "Đó là một không gian nơi con người có thể dừng lại, lắng nghe cơ thể mình và bắt đầu một hành trình wellness bền vững.",
        ],
    },
    founder: {
        badge: "Founder Message",
        title: "A Message from the Founder",
        paragraphs: [
            "AYANAVITA được hình thành từ một niềm tin rất đơn giản: sức khỏe thật sự bắt đầu khi chúng ta biết lắng nghe cơ thể và chăm sóc bản thân một cách ý thức.",
            "Trong một thế giới chuyển động rất nhanh, nhiều người dần mất kết nối với sức khỏe, sự cân bằng và năng lượng bên trong của mình.",
            "Tầm nhìn của tôi khi xây dựng AYANAVITA là tạo ra một nơi giúp con người kết nối lại với chính mình — nơi wellness không chỉ là một dịch vụ, mà là một hành trình hướng tới cuộc sống cân bằng và trọn vẹn hơn.",
            "Tôi hy vọng rằng mỗi người khi đến với AYANAVITA sẽ tìm thấy cảm hứng, sự hỗ trợ và một cảm giác khỏe mạnh mới.",
        ],
        signature: "— Nguyễn Thanh Vân",
        role: "Founder, AYANAVITA",
    },
    logoPlaceholder: {
        title: "AYANAVITA Logo",
        hint: "",
    },
};

type SectionProps = {
    badge: string;
    title: string;
    paragraphs: string[];
};

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0 },
};

const stagger = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.12,
        },
    },
};

function SectionHeader({ badge, title }: { badge: string; title: string }) {
    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
        >
      <span className="inline-flex rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur-sm">
        {badge}
      </span>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-[3.35rem]">
                {title}
            </h2>
        </motion.div>
    );
}

function TextSection({ badge, title, paragraphs }: SectionProps) {
    return (
        <section className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <SectionHeader badge={badge} title={title} />
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                    className="mt-8 max-w-4xl space-y-5"
                >
                    {paragraphs.map((paragraph) => (
                        <motion.p
                            key={paragraph}
                            variants={fadeUp}
                            transition={{ duration: 0.55, ease: "easeOut" }}
                            className="text-lg leading-8 text-slate-600"
                        >
                            {paragraph}
                        </motion.p>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-[1.75rem] border border-white/60 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

export default function AboutAYANAVITAPage() {
    return (
        <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.10),transparent_24%),radial-gradient(circle_at_top_left,rgba(34,197,94,0.09),transparent_20%),linear-gradient(180deg,#fcfdfd_0%,#f5f8f6_55%,#f7f6ff_100%)] text-slate-900">
            <section className="relative overflow-hidden px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
                <div className="mx-auto max-w-7xl">
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_30%),linear-gradient(135deg,rgba(79,70,229,0.96),rgba(124,58,237,0.93)_55%,rgba(8,145,178,0.78)_100%)] shadow-[0_30px_80px_rgba(15,23,42,0.14)] lg:rounded-[2.75rem]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.18),transparent_18%),radial-gradient(circle_at_85%_28%,rgba(251,191,36,0.15),transparent_16%),radial-gradient(circle_at_70%_78%,rgba(34,197,94,0.14),transparent_22%)]" />
                        <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute right-8 top-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
                        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />

                        <div className="relative z-10 grid min-h-[760px] items-center gap-10 px-6 py-8 sm:px-8 md:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-14 lg:py-16">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="max-w-2xl text-white"
                            >
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/95 shadow-sm backdrop-blur-md">
                  {cmsData.hero.badge}
                </span>

                                <h1 className="mt-6 text-5xl font-semibold leading-[0.94] tracking-[-0.045em] sm:text-6xl lg:text-[5.3rem]">
                                    {cmsData.hero.title}
                                </h1>

                                <p className="mt-6 max-w-xl text-base leading-8 text-white/88 sm:text-lg">
                                    {cmsData.hero.description}
                                </p>
                                <p className="mt-4 max-w-xl text-base leading-8 text-white/74 sm:text-lg">
                                    {cmsData.hero.subdescription}
                                </p>

                                <motion.div
                                    variants={stagger}
                                    initial="hidden"
                                    animate="show"
                                    className="mt-10 flex flex-wrap gap-3"
                                >
                                    {cmsData.hero.tags.map((tag) => (
                                        <motion.span
                                            key={tag}
                                            variants={fadeUp}
                                            transition={{ duration: 0.45, ease: "easeOut" }}
                                            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/92 backdrop-blur-md"
                                        >
                                            {tag}
                                        </motion.span>
                                    ))}
                                </motion.div>

                                <motion.div
                                    variants={stagger}
                                    initial="hidden"
                                    animate="show"
                                    className="mt-10 grid gap-4 sm:grid-cols-3"
                                >
                                    {cmsData.hero.stats.map((item) => (
                                        <motion.div
                                            key={item.label}
                                            variants={fadeUp}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-5 backdrop-blur-md"
                                        >
                                            <div className="text-xs uppercase tracking-[0.18em] text-white/65">{item.label}</div>
                                            <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
                                className="relative flex min-h-[540px] items-center justify-center lg:min-h-[640px]"
                            >
                                <div className="absolute inset-3 rounded-[2.2rem] border border-white/15 bg-white/8 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl" />
                                <motion.div
                                    animate={{ y: [0, -10, 0], rotate: [0, 1.2, 0] }}
                                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute right-8 top-10 h-24 w-24 rounded-full border border-white/15 bg-white/10 blur-[1px]"
                                />
                                <motion.div
                                    animate={{ y: [0, 12, 0] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute bottom-12 left-8 h-28 w-28 rounded-full bg-amber-300/15 blur-2xl"
                                />

                                <GlassCard className="relative z-10 w-full max-w-[500px] p-5 sm:p-7">
                                    <div className="rounded-[1.9rem] bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.76))] p-6 sm:p-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700/80">Brand Presence</div>
                                                <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{cmsData.logoPlaceholder.title}</div>
                                            </div>
                                            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                                                Reserved Area
                                            </div>
                                        </div>

                                        <div className="mt-6 flex h-[360px] items-center justify-center rounded-[1.8rem] border border-dashed border-indigo-200 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.08),transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)] text-center shadow-inner sm:h-[420px]">
                                            <div>
                                                <motion.img
                                                    src="/imgs/logo.png"
                                                    alt="AYANAVITA logo"
                                                    animate={{ scale: [1, 1.04, 1] }}
                                                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                                                    className="mx-auto h-32 w-auto rounded-xl object-contain drop-shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
                                                />
                                                <div className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-slate-950">
                                                    {cmsData.logoPlaceholder.title}
                                                </div>
                                                <p className="mt-3 text-sm uppercase tracking-[0.24em] text-slate-500">
                                                    {cmsData.logoPlaceholder.hint}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <TextSection badge={cmsData.intro.badge} title={cmsData.intro.title} paragraphs={cmsData.intro.paragraphs} />

            <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(221,235,221,0.42),rgba(241,237,255,0.48))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,197,94,0.10),transparent_24%),radial-gradient(circle_at_82%_30%,rgba(245,158,11,0.10),transparent_18%),radial-gradient(circle_at_75%_78%,rgba(79,70,229,0.08),transparent_22%)] opacity-70" />
                <div className="relative mx-auto max-w-7xl grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
                    <div>
                        <SectionHeader badge={cmsData.approach.badge} title={cmsData.approach.title} />
                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.25 }}
                            className="mt-8 max-w-3xl space-y-5"
                        >
                            {cmsData.approach.paragraphs.map((paragraph) => (
                                <motion.p
                                    key={paragraph}
                                    variants={fadeUp}
                                    transition={{ duration: 0.55, ease: "easeOut" }}
                                    className="text-lg leading-8 text-slate-600"
                                >
                                    {paragraph}
                                </motion.p>
                            ))}
                        </motion.div>
                    </div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid gap-4 sm:grid-cols-2"
                    >
                        {cmsData.approach.points.map((point) => (
                            <motion.div key={point.title} variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }}>
                                <GlassCard className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
                                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-lg font-semibold text-white shadow-lg">
                                        ✦
                                    </div>
                                    <div className="text-lg font-semibold text-slate-950">{point.title}</div>
                                    <div className="mt-3 leading-7 text-slate-600">{point.description}</div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
                        <GlassCard className="p-8 sm:p-10">
                            <SectionHeader badge={cmsData.vision.badge} title={cmsData.vision.title} />
                            <motion.div
                                variants={stagger}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.25 }}
                                className="mt-8 space-y-5"
                            >
                                {cmsData.vision.paragraphs.map((paragraph) => (
                                    <motion.p
                                        key={paragraph}
                                        variants={fadeUp}
                                        transition={{ duration: 0.55, ease: "easeOut" }}
                                        className="text-lg leading-8 text-slate-600"
                                    >
                                        {paragraph}
                                    </motion.p>
                                ))}
                            </motion.div>
                        </GlassCard>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        >
                            <div className="relative h-full overflow-hidden rounded-[2rem] border border-indigo-100 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.10),transparent_30%),linear-gradient(180deg,#ffffff,#f7fafc)] p-8 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-10">
                                <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
                                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-700">Vision Note</div>
                                <blockquote className="mt-8 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                    “{cmsData.vision.quote}”
                                </blockquote>
                                <div className="mt-10 h-px w-full bg-gradient-to-r from-indigo-200 via-slate-200 to-transparent" />
                                <p className="mt-6 max-w-lg leading-8 text-slate-600">
                                    AYANAVITA theo đuổi một định hướng wellness đáng tin cậy, lâu dài và phù hợp với nhịp sống hiện đại.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(221,235,221,0.35),rgba(241,237,255,0.42))]" />
                <div className="relative mx-auto max-w-7xl">
                    <SectionHeader badge={cmsData.community.badge} title={cmsData.community.title} />
                    <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.25 }}
                            className="space-y-5"
                        >
                            {cmsData.community.paragraphs.map((paragraph) => (
                                <motion.p
                                    key={paragraph}
                                    variants={fadeUp}
                                    transition={{ duration: 0.55, ease: "easeOut" }}
                                    className="text-lg leading-8 text-slate-600"
                                >
                                    {paragraph}
                                </motion.p>
                            ))}
                        </motion.div>

                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.15 }}
                            className="grid gap-4 sm:grid-cols-2"
                        >
                            {cmsData.community.highlights.map((item, index) => (
                                <motion.div key={item} variants={fadeUp} transition={{ duration: 0.5, ease: "easeOut" }}>
                                    <GlassCard className="h-full px-5 py-6 transition duration-300 hover:-translate-y-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">AYANAVITA</div>
                                                <div className="mt-2 text-lg font-semibold text-slate-950">{item}</div>
                                            </div>
                                            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                                                {String(index + 1).padStart(2, "0")}
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <GlassCard className="overflow-hidden p-8 sm:p-10 lg:p-12">
                        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                            <div>
                                <SectionHeader badge={cmsData.closing.badge} title={cmsData.closing.title} />
                            </div>
                            <motion.div
                                variants={stagger}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.25 }}
                                className="space-y-5"
                            >
                                {cmsData.closing.paragraphs.map((paragraph) => (
                                    <motion.p
                                        key={paragraph}
                                        variants={fadeUp}
                                        transition={{ duration: 0.55, ease: "easeOut" }}
                                        className="text-lg leading-8 text-slate-600"
                                    >
                                        {paragraph}
                                    </motion.p>
                                ))}
                            </motion.div>
                        </div>
                    </GlassCard>
                </div>
            </section>

            <section className="px-4 pb-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.75, ease: "easeOut" }}
                        className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.16),transparent_24%),linear-gradient(135deg,rgba(11,18,32,0.98),rgba(30,41,59,0.96))] px-6 py-12 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-10 lg:px-14 lg:py-14"
                    >
                        <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                        <div className="absolute right-10 bottom-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

                        <div className="relative z-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                            <div className="rounded-[1.9rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {cmsData.founder.badge}
                </span>
                                <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.3rem]">
                                    {cmsData.founder.title}
                                </h2>
                            </div>

                            <motion.div
                                variants={stagger}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.2 }}
                                className="space-y-5 text-white/80"
                            >
                                {cmsData.founder.paragraphs.map((paragraph) => (
                                    <motion.p
                                        key={paragraph}
                                        variants={fadeUp}
                                        transition={{ duration: 0.55, ease: "easeOut" }}
                                        className="text-lg leading-8"
                                    >
                                        {paragraph}
                                    </motion.p>
                                ))}

                                <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }} className="pt-4">
                                    <div className="text-xl font-semibold text-white">{cmsData.founder.signature}</div>
                                    <div className="mt-1 text-sm uppercase tracking-[0.18em] text-white/60">{cmsData.founder.role}</div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
