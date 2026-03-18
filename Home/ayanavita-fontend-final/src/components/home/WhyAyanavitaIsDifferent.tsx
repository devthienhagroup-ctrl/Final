import React, { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

type DifferentSectionProps = {
    logoSrc?: string;
};

export default function AyanavitaDifferentSection({
                                                      logoSrc = "/imgs/logo-full.jpg",
                                                  }: DifferentSectionProps) {
    const ref = useRef<HTMLElement | null>(null);
    const isInView = useInView(ref, { once: false, amount: 0.35 });
    const leftControls = useAnimation();
    const rightControls = useAnimation();
    const centerControls = useAnimation();
    const bottomControls = useAnimation();
    const connectorControls = useAnimation();

    useEffect(() => {
        if (isInView) {
            leftControls.start({
                opacity: 1,
                x: 18,
                transition: { duration: 0.9, ease: "easeOut" },
            });
            rightControls.start({
                opacity: 1,
                x: -18,
                transition: { duration: 0.9, ease: "easeOut" },
            });
            connectorControls.start({
                opacity: 1,
                scaleX: 1,
                transition: { duration: 0.6, delay: 0.45, ease: "easeOut" },
            });
            centerControls.start({
                opacity: 1,
                scale: 1,
                transition: { duration: 0.7, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] },
            });
            bottomControls.start({
                opacity: 1,
                y: 0,
                transition: { duration: 0.7, delay: 0.7, ease: "easeOut" },
            });
        } else {
            leftControls.start({ opacity: 0, x: -72, transition: { duration: 0.45 } });
            rightControls.start({ opacity: 0, x: 72, transition: { duration: 0.45 } });
            centerControls.start({ opacity: 0, scale: 0.88, transition: { duration: 0.35 } });
            bottomControls.start({ opacity: 0, y: 24, transition: { duration: 0.35 } });
            connectorControls.start({ opacity: 0, scaleX: 0.3, transition: { duration: 0.3 } });
        }
    }, [bottomControls, centerControls, connectorControls, isInView, leftControls, rightControls]);

    return (
        <section ref={ref} className="relative overflow-hidden py-24 md:py-32">
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]" />
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[-8%] top-0 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute right-[-5%] top-6 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="mb-3 inline-flex items-center rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur-sm">
                        Why AYANAVITA is Different
                    </p>

                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
                        Không chỉ là spa. Không chỉ là nền tảng
                    </h2>

                    <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
                        Nhiều spa và wellness center tập trung vào dịch vụ.
                        Nhiều nền tảng công nghệ tập trung vào dữ liệu.
                    </p>

                    <p className="mt-1 text-base leading-8 text-slate-600 md:text-lg">
                        AYANAVITA kết hợp trải nghiệm chăm sóc thực tế và sự thấu hiểu cá nhân hóa
                        để tạo nên một hành trình wellness dài lâu, nhẹ nhàng và có chiều sâu hơn.
                    </p>
                </div>

                <div className="relative mt-16 md:mt-20">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-3xl" />
                        <div className="absolute left-[35%] top-[46%] h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
                        <div className="absolute right-[34%] top-[52%] h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
                    </div>

                    <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_240px_1fr]">
                        <motion.div
                            initial={{ opacity: 0, x: -72 }}
                            animate={leftControls}
                            className="group relative z-20 rounded-[28px] border border-white/70 bg-white/65 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8"
                        >
                            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-cyan-400/10 opacity-80" />
                            <div className="relative">
                                <div className="mb-5 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                                    Wellness Experience
                                </div>

                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-2xl text-white shadow-lg shadow-indigo-500/20">
                                    ✦
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900">
                                    Chăm sóc thật, chạm tới cảm xúc thật
                                </h3>

                                <p className="mt-4 leading-7 text-slate-600">
                                    Từ spa, wellness check-in đến những trải nghiệm giúp khách hàng kết nối
                                    lại với cơ thể, năng lượng và nhu cầu riêng của chính mình.
                                </p>

                                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                        <span>Trải nghiệm thực tế, cá nhân và giàu cảm xúc</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500" />
                                        <span>Kết hợp sắc đẹp, sức khỏe và cân bằng tinh thần</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
                                        <span>Tập trung vào con người trước khi nói về dịch vụ</span>
                                    </li>
                                </ul>
                            </div>
                        </motion.div>

                        <div className="relative flex items-center justify-center py-10 lg:py-0">
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0.3 }}
                                animate={connectorControls}
                                className="z-0 absolute top-1/2 right-[calc(50%+82px)] hidden h-[2px] w-[110px] -translate-y-1/2 bg-gradient-to-r from-indigo-500/0 to-indigo-500/90 lg:block origin-right"
                            />
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0.3 }}
                                animate={connectorControls}
                                className="absolute top-1/2 left-[calc(50%+82px)] hidden h-[2px] w-[110px] -translate-y-1/2 bg-gradient-to-r from-amber-400/90 to-amber-400/0 lg:block origin-left"
                            />

                            <motion.div
                                animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.7, 0.35] }}
                                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute h-[180px] w-[180px] rounded-full border border-indigo-300/40"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.45, 0.18] }}
                                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                                className="absolute h-[220px] w-[220px] rounded-full border border-amber-300/30"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.88 }}
                                animate={centerControls}
                                className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/80 bg-white/65 shadow-2xl backdrop-blur-xl"
                            >
                                <div className="absolute inset-[-12%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28)_0%,transparent_65%)] blur-2xl" />
                                <div className="absolute inset-[-14%] -z-10 translate-x-3 translate-y-3 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.22)_0%,transparent_70%)] blur-2xl" />

                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative flex h-full w-full flex-col items-center justify-center text-center"
                                >


                                    <img
                                        src="/imgs/logo.png"
                                        alt="AYANAVITA logo"
                                        className="mt-2 h-20 w-auto object-contain drop-shadow-[0_6px_16px_rgba(15,23,42,0.12)]"
                                    />
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                                        CREATED BY
                                    </div>
                                    <div className="mt-1 bg-gradient-to-r from-indigo-700 via-violet-600 to-amber-500 bg-clip-text text-2xl font-extrabold tracking-[0.18em] text-transparent md:text-3xl">
                                        AYANAVITA
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 72 }}
                            animate={rightControls}
                            className="group relative rounded-[28px] border border-white/70 bg-white/65 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8"
                        >
                            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-amber-400/10 via-yellow-300/5 to-indigo-400/10" />
                            <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:22px_22px] opacity-60" />

                            <div className="relative">
                                <div className="mb-5 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                                    Insight & Personalization
                                </div>

                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-400 text-2xl text-slate-900 shadow-lg shadow-amber-400/20">
                                    ◎
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900">
                                    Dữ liệu không để đo cho vui, mà để hiểu đúng hơn
                                </h3>

                                <p className="mt-4 leading-7 text-slate-600">
                                    AYANAVITA dùng góc nhìn hệ thống để hiểu cơ thể, lối sống và hành trình
                                    riêng của từng người, từ đó cá nhân hóa trải nghiệm phù hợp hơn.
                                </p>

                                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                                        <span>Hiểu nhu cầu riêng thay vì áp dụng công thức chung</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
                                        <span>Tạo hành trình chăm sóc lâu dài, không chỉ một lần trải nghiệm</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                        <span>Kết nối trải nghiệm thực tế với nền tảng wellness hiện đại</span>
                                    </li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={bottomControls}
                        className="mx-auto mt-10 max-w-3xl rounded-[24px] border border-white/70 bg-white/60 px-6 py-5 text-center shadow-lg shadow-slate-900/5 backdrop-blur-md"
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                            The result
                        </p>
                        <p className="mt-3 text-lg leading-8 text-slate-700 md:text-xl">
                            Một nền tảng wellness giúp con người hiểu rõ cơ thể mình hơn, được chăm sóc đúng hơn
                            và sống khỏe hơn mỗi ngày.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
