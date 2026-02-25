import React from "react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-7xl px-4 pt-8 pb-2">
                <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 shadow-sm md:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                        Liên hệ AYANAVITA
                    </p>
                    <h1 className="mt-2 text-2xl font-extrabold md:text-4xl">
                        Kết nối với đội ngũ tư vấn trong 24 giờ
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
                        Nếu bạn cần tư vấn dịch vụ spa, khoá học hoặc hợp tác nhượng quyền,
                        hãy để lại thông tin. Đội ngũ AYANAVITA sẽ liên hệ để hỗ trợ lộ trình
                        phù hợp nhất cho bạn.
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="mx-auto max-w-7xl px-4 pb-16">
                <div className="mt-8 grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 md:p-10">

                    {/* Form */}
                    <form
                        className="space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log("Form submitted");
                        }}
                    >
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder="Nhập họ và tên của bạn"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder="Nhập số điện thoại"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder="Nhập email (không bắt buộc)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Nội dung cần tư vấn
                            </label>
                            <textarea
                                rows={4}
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder="Mô tả nhu cầu của bạn..."
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Gửi thông tin
                        </button>
                    </form>

                    {/* Info */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold">
                                Thông tin liên hệ
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                Hotline: 0900 000 000
                            </p>
                            <p className="text-sm text-slate-600">
                                Email: contact@ayanavita.vn
                            </p>
                            <p className="text-sm text-slate-600">
                                Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM
                            </p>
                        </div>

                        <div className="rounded-2xl bg-indigo-50 p-5 text-sm text-slate-700">
                            Đội ngũ tư vấn sẽ phản hồi trong vòng 24 giờ làm việc.
                            Vui lòng đảm bảo thông tin chính xác để được hỗ trợ nhanh nhất.
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}