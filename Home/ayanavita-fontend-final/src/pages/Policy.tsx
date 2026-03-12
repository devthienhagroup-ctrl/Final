import React from "react";

export default function LegalPageTemplate() {
    return (
        <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <a
                            href="/"
                            className="text-sm font-extrabold uppercase tracking-[0.24em] text-slate-950"
                        >
                        </a>

                        <nav className="hidden flex-wrap items-center gap-5 text-sm text-slate-600 md:flex">
                            <a href="#" className="transition hover:text-indigo-600">
                                Impressum
                            </a>
                            <a href="#" className="transition hover:text-indigo-600">
                                Datenschutzerklärung
                            </a>
                            <a href="#" className="transition hover:text-indigo-600">
                                AGB
                            </a>
                            <a href="#" className="transition hover:text-indigo-600">
                                Disclaimer
                            </a>
                            <a href="#" className="transition hover:text-indigo-600">
                                Payment &amp; Refund
                            </a>
                            <a href="#" className="transition hover:text-indigo-600">
                                Cookies
                            </a>
                        </nav>
                    </div>
                </header>

                {/* Main */}
                <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
                    {/* Hero */}
                    <section className="mb-8 sm:mb-10">
                        <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
                            Legal Information
                        </div>

                        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                            Privacy Policy
                        </h1>

                        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                            This page explains how AYANAVITA collects, uses, stores, and
                            protects personal information when users access our website and
                            services.
                        </p>
                    </section>

                    {/* Card */}
                    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-400" />

                        <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                            <div className="mb-6 text-sm text-slate-500">
                                Last updated: March 12, 2026
                            </div>

                            <article className="max-w-none text-[15px] leading-8 text-slate-700 sm:text-base">
                                <section className="border-t border-transparent first:border-t-0">
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">
                                        1. Information We Collect
                                    </h2>
                                    <p className="mb-4">
                                        We may collect personal information such as your name, email
                                        address, account details, payment-related details, and
                                        information about how you use our website.
                                    </p>
                                    <p className="mb-4">
                                        This information may be collected when you create an
                                        account, purchase a service, subscribe to updates, or
                                        interact with our platform.
                                    </p>
                                </section>

                                <section className="mt-8 border-t border-slate-200 pt-8">
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">
                                        2. How We Use Your Information
                                    </h2>
                                    <p className="mb-4">
                                        We use your information to operate our services, process
                                        payments, improve website functionality, communicate with
                                        you, and maintain the security of our platform.
                                    </p>
                                    <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-indigo-500">
                                        <li>To provide access to content and user accounts</li>
                                        <li>To process transactions and subscriptions</li>
                                        <li>To send important service-related notifications</li>
                                        <li>To improve performance and user experience</li>
                                    </ul>
                                </section>

                                <section className="mt-8 border-t border-slate-200 pt-8">
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">
                                        3. Cookies
                                    </h2>
                                    <p className="mb-4">
                                        We may use cookies and similar technologies to ensure
                                        essential functionality, remember preferences, and better
                                        understand how users interact with our website.
                                    </p>
                                </section>

                                <section className="mt-8 border-t border-slate-200 pt-8">
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">
                                        4. Third-Party Services
                                    </h2>
                                    <p className="mb-4">
                                        Some parts of our services may rely on trusted third-party
                                        providers, including payment processors and hosting
                                        platforms. These providers may process certain data as needed
                                        to perform their services.
                                    </p>
                                </section>

                                <section className="mt-8 border-t border-slate-200 pt-8">
                                    <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">
                                        5. Contact
                                    </h2>
                                    <p className="mb-4">
                                        If you have questions regarding this page or our policies,
                                        please contact us at{" "}
                                        <a
                                            href="mailto:support@ayanavita.com"
                                            className="font-medium text-indigo-600 transition hover:text-violet-600"
                                        >
                                            support@ayanavita.com
                                        </a>
                                        .
                                    </p>
                                </section>
                            </article>
                        </div>
                    </section>
                </main>

            </div>
        </div>
    );
}