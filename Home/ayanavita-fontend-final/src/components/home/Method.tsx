import React from "react";

export default function AyanavitaMethodSection() {
    return (
        <section className="relative isolate overflow-hidden bg-gradient-to-b from-white via-amber-50/30 to-orange-50/40 py-20 text-slate-800 md:py-24">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[-9%] top-4 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
                <div className="absolute right-[-7%] top-8 h-72 w-72 rounded-full bg-orange-200/25 blur-3xl" />
                <div className="absolute left-1/2 top-[48%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-200/20 blur-3xl" />
            </div>

            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto mb-2 max-w-3xl text-center">
                    <div className="mx-auto mt-6 max-w-2xl space-y-2 text-sm leading-7 text-slate-600 md:text-[15px]">
                        <p>AYANAVITA không bắt đầu từ việc bán dịch vụ. Chúng tôi bắt đầu từ việc hiểu con người.</p>
                        <p>
                            Mỗi trải nghiệm tại AYANAVITA được xây dựng theo một phương pháp
                            đơn giản nhưng hiệu quả.
                        </p>
                    </div>
                </div>

                {/* Desktop */}
                <div className="relative mx-auto hidden h-[620px] max-w-5xl md:block">
                    <div className="absolute left-1/2 top-1/2 h-px w-[60%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-200/40 via-amber-300/90 to-yellow-200/40" />
                    <div className="absolute left-1/2 top-1/2 h-[56%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-amber-200/30 via-yellow-300/80 to-orange-200/35" />

                    <div className="absolute left-1/2 top-1/2 z-20 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 shadow-[0_24px_70px_-30px_rgba(245,158,11,0.22)] backdrop-blur-xl">
                        <div className="absolute inset-2 rounded-full border border-amber-100/80" />
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.18),transparent_58%)]" />
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_72%_70%,rgba(251,146,60,0.12),transparent_64%)]" />
                        <div className="text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700/80">
                                AYANAVITA
                            </p>
                            <p className="mt-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-base font-semibold text-transparent">
                                Method
                            </p>
                        </div>
                    </div>

                    <article className="group absolute left-6 top-16 z-10 w-[400px] overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-200/90 hover:shadow-[0_24px_70px_-30px_rgba(245,158,11,0.22)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/12 via-yellow-200/6 to-orange-200/10 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                01
              </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Discover
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Hiểu cơ thể của bạn
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            Hành trình bắt đầu bằng một wellness check-in giúp bạn hiểu rõ hơn về cơ thể, làn da và lối sống của mình một cách toàn diện hơn.                 </p>
                    </article>

                    <article className="group absolute right-6 top-16 z-10 w-[400px] overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-200/90 hover:shadow-[0_24px_70px_-30px_rgba(245,158,11,0.22)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/14 via-yellow-200/8 to-orange-200/10 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                02
              </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Understand
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Phân tích và hiểu nhu cầu
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            Dựa trên thông tin và dữ liệu thu thập được, hệ thống giúp xác
                            định những yếu tố ảnh hưởng đến sức khỏe, năng lượng và sự cân
                            bằng của bạn.
                        </p>
                    </article>

                    <article className="group absolute bottom-16 left-6 z-10 w-[400px] overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-200/90 hover:shadow-[0_24px_70px_-30px_rgba(245,158,11,0.22)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/12 via-yellow-200/6 to-orange-200/10 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                03
              </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Personalize
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Chăm sóc cá nhân hóa
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            Từ đó, AYANAVITA gợi ý những chương trình wellness phù hợp với
                            từng cá nhân, kết hợp giữa chăm sóc sắc đẹp, sức khỏe và phong
                            cách sống.
                        </p>
                    </article>

                    <article className="group absolute bottom-16 right-6 z-10 w-[400px] overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-200/90 hover:shadow-[0_24px_70px_-30px_rgba(245,158,11,0.22)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/12 via-yellow-200/6 to-orange-200/10 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                04
              </span>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Support
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Đồng hành lâu dài
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            AYANAVITA không chỉ là một trải nghiệm một lần. Chúng tôi giúp bạn
                            xây dựng một hành trình chăm sóc bền vững và đồng hành cùng bạn
                            theo thời gian.
                        </p>
                    </article>

                    <span className="absolute left-[300px] top-[160px] h-3 w-3 rounded-full bg-amber-300 ring-4 ring-white/80" />
                    <span className="absolute right-[300px] top-[160px] h-3 w-3 rounded-full bg-yellow-300 ring-4 ring-white/80" />
                    <span className="absolute left-[300px] bottom-[160px] h-3 w-3 rounded-full bg-orange-200 ring-4 ring-white/80" />
                    <span className="absolute right-[300px] bottom-[160px] h-3 w-3 rounded-full bg-amber-200 ring-4 ring-white/80" />
                </div>

                {/* Mobile */}
                <div className="mx-auto max-w-xl space-y-4 md:hidden">
                    <article className="group relative overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/90 hover:shadow-[0_22px_60px_-28px_rgba(245,158,11,0.2)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/12 via-yellow-200/6 to-orange-200/10 opacity-80" />
                        <div className="relative mb-3 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                01
              </span>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Discover
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Hiểu cơ thể của bạn
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            Hành trình bắt đầu bằng một wellness check-in giúp bạn hiểu rõ hơn
                            về cơ thể, làn da và lối sống của mình.
                        </p>
                    </article>

                    <article className="group relative overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/90 hover:shadow-[0_22px_60px_-28px_rgba(245,158,11,0.2)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/14 via-yellow-200/8 to-orange-200/10 opacity-80" />
                        <div className="relative mb-3 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                02
              </span>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Understand
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Phân tích và hiểu nhu cầu
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            Dựa trên thông tin và dữ liệu thu thập được, hệ thống giúp xác
                            định những yếu tố ảnh hưởng đến sức khỏe, năng lượng và sự cân
                            bằng của bạn.
                        </p>
                    </article>

                    <div className="flex justify-center py-2">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/80 bg-white/80 shadow-[0_20px_60px_-28px_rgba(245,158,11,0.22)] backdrop-blur-xl">
                            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.18),transparent_58%)]" />
                            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_72%_70%,rgba(251,146,60,0.12),transparent_64%)]" />
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
                                    AYANAVITA
                                </p>
                                <p className="mt-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-sm font-semibold text-transparent">
                                    Method
                                </p>
                            </div>
                        </div>
                    </div>

                    <article className="group relative overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/90 hover:shadow-[0_22px_60px_-28px_rgba(245,158,11,0.2)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/12 via-yellow-200/6 to-orange-200/10 opacity-80" />
                        <div className="relative mb-3 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                03
              </span>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Personalize
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Chăm sóc cá nhân hóa
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            Từ đó, AYANAVITA gợi ý những chương trình wellness phù hợp với
                            từng cá nhân, kết hợp giữa chăm sóc sắc đẹp, sức khỏe và phong
                            cách sống.
                        </p>
                    </article>

                    <article className="group relative overflow-hidden rounded-[24px] border border-white/75 bg-white/80 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/90 hover:shadow-[0_22px_60px_-28px_rgba(245,158,11,0.2)]">
                        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-300/12 via-yellow-200/6 to-orange-200/10 opacity-80" />
                        <div className="relative mb-3 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/25">
                04
              </span>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                                    Support
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                    Đồng hành lâu dài
                                </h3>
                            </div>
                        </div>
                        <p className="relative text-sm leading-7 text-slate-600">
                            AYANAVITA không chỉ là một trải nghiệm một lần. Chúng tôi giúp bạn
                            xây dựng một hành trình chăm sóc bền vững và đồng hành cùng bạn
                            theo thời gian.
                        </p>
                    </article>
                </div>

                <div className="mx-auto mt-2 max-w-2xl text-center">
                    <p className="text-base leading-8 text-slate-700 md:text-lg">
                        AYANAVITA giúp bạn hiểu cơ thể của mình,{" "}
                        <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text font-semibold text-transparent">
              để chăm sóc đúng cách và sống khỏe hơn mỗi ngày.
            </span>
                    </p>
                </div>
            </div>
        </section>
    );
}
