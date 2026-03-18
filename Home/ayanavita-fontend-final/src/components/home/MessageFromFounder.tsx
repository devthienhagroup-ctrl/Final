import React from "react";
import { motion } from "framer-motion";

const cmsDataDefault = {
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

type FounderMessageCMS = typeof cmsDataDefault;

type FounderMessageSectionProps = {
    cmsData?: FounderMessageCMS;
};

export default function FounderMessageSection({
                                                  cmsData = cmsDataDefault,
                                              }: FounderMessageSectionProps) {
    const founder = cmsData.founder;

    return (
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
                                {founder.badge}
                            </span>
                            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.3rem]">
                                {founder.title}
                            </h2>
                        </div>

                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.2 }}
                            className="space-y-5 text-white/80"
                        >
                            {founder.paragraphs.map((paragraph) => (
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
                                <div className="text-xl font-semibold text-white">{founder.signature}</div>
                                <div className="mt-1 text-sm uppercase tracking-[0.18em] text-white/60">{founder.role}</div>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
