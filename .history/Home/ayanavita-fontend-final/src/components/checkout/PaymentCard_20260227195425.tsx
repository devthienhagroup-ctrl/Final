import React, { useState } from "react";
import type { PayMethod } from "../../services/checkout.storage";

// Định nghĩa kiểu dữ liệu cho CMS (chỉ chứa nội dung, không chứa style)
export interface CmsData {
  stepLabel: string;                       // "Bước 2"
  mainTitle: string;                        // "Phương thức thanh toán"
  description: string;                       // "Mô phỏng: Card / Chuyển khoản / Ví."
  chipText: string;                          // "Payments"

  // Phương thức thẻ
  cardMethodTitle: string;                   // "Thẻ (Card) – Stripe/PayOS (demo)"
  cardHelperText: string;                     // "Thanh toán ngay để xác nhận đơn."
  cardNumberLabel: string;                    // "Số thẻ (demo)"
  cardNumberPlaceholder: string;               // "4242 4242 4242 4242"
  cardExpLabel: string;                        // "Hết hạn"
  cardExpPlaceholder: string;                   // "MM/YY"
  cardCvcLabel: string;                         // "CVC"
  cardCvcPlaceholder: string;                    // "123"

  // Phương thức chuyển khoản
  bankMethodTitle: string;                      // "Chuyển khoản ngân hàng"
  bankHelperText: string;                        // "Xác nhận sau khi nhận tiền (demo)."
  bankInfoTitle: string;                         // "Thông tin nhận chuyển khoản (demo)"
  bankInfo: {                                    // Thông tin ngân hàng
    bankName: string;                            // "Vietcombank"
    accountNumber: string;                        // "0123 456 789"
    accountHolder: string;                         // "AYANAVITA"
  };
  bankContentLabel: string;                       // "Nội dung:"

  // Phương thức ví
  walletMethodTitle: string;                      // "Ví điện tử (MoMo/ZaloPay)"
  walletHelperText: string;                        // "Chuyển hướng sang ví để thanh toán (demo)."
  walletQrTitle: string;                            // "Mô phỏng QR"
  walletQrDescription: string;                       // "Quét QR để thanh toán (demo)."
  walletOrderCodeLabel: string;                      // "Mã đơn:"

  // Điều khoản
  agreeTextBeforeLink: string;                       // "Tôi đồng ý với "
  termsLinkText: string;                             // "điều khoản"
  termsLinkHref: string;                             // "#"
  andText: string;                                   // " và "
  policiesLinkText: string;                          // "chính sách"
  policiesLinkHref: string;                          // "#"
  agreeSuffix: string;                               // "."
  prototypeNote: string;                              // "Prototype: khi làm thật, bạn log consent + version điều khoản."
}

// Nội dung mặc định (lấy từ giao diện hiện tại)
const defaultCmsData: CmsData = {
  stepLabel: "Bước 2",
  mainTitle: "Phương thức thanh toán",
  description: "Mô phỏng: Card / Chuyển khoản / Ví.",
  chipText: "Payments",
  cardMethodTitle: "Thẻ (Card) – Stripe/PayOS (demo)",
  cardHelperText: "Thanh toán ngay để xác nhận đơn.",
  cardNumberLabel: "Số thẻ (demo)",
  cardNumberPlaceholder: "4242 4242 4242 4242",
  cardExpLabel: "Hết hạn",
  cardExpPlaceholder: "MM/YY",
  cardCvcLabel: "CVC",
  cardCvcPlaceholder: "123",
  bankMethodTitle: "Chuyển khoản ngân hàng",
  bankHelperText: "Xác nhận sau khi nhận tiền (demo).",
  bankInfoTitle: "Thông tin nhận chuyển khoản (demo)",
  bankInfo: {
    bankName: "Vietcombank",
    accountNumber: "0123 456 789",
    accountHolder: "AYANAVITA",
  },
  bankContentLabel: "Nội dung:",
  walletMethodTitle: "Ví điện tử (MoMo/ZaloPay)",
  walletHelperText: "Chuyển hướng sang ví để thanh toán (demo).",
  walletQrTitle: "Mô phỏng QR",
  walletQrDescription: "Quét QR để thanh toán (demo).",
  walletOrderCodeLabel: "Mã đơn:",
  agreeTextBeforeLink: "Tôi đồng ý với ",
  termsLinkText: "điều khoản",
  termsLinkHref: "#",
  andText: " và ",
  policiesLinkText: "chính sách",
  policiesLinkHref: "#",
  agreeSuffix: ".",
  prototypeNote: "Prototype: khi làm thật, bạn log consent + version điều khoản.",
};

function RadioCard({
                     active,
                     onClick,
                     children,
                     name,
                   }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  name: string;
}) {
  return (
      <label className={`radio ${active ? "active" : ""}`} onClick={onClick}>
        <input type="radio" name={name} checked={active} readOnly className="mt-1" />
        <div className="w-full">{children}</div>
      </label>
  );
}

export function PaymentCard({
                              payMethod,
                              onPayMethodChange,
                              agree,
                              onAgreeChange,
                              orderCodePreview,
                              onStep2Seen,
                              cmsData,                                   // nhận dữ liệu CMS từ bên ngoài
                            }: {
  payMethod: PayMethod;
  onPayMethodChange: (m: PayMethod) => void;
  agree: boolean;
  onAgreeChange: (v: boolean) => void;
  orderCodePreview: string; // AYA-ORDER or last order code
  onStep2Seen: () => void;
  cmsData?: CmsData;                          // optional
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Sử dụng dữ liệu CMS nếu có, nếu không thì dùng mặc định
  const data = cmsData ?? defaultCmsData;

  const isCard = payMethod === "card";
  const isBank = payMethod === "bank";
  const isWallet = payMethod === "wallet";

  // Helper text được lấy trực tiếp từ data thay vì useMemo
  const helper = isCard
      ? data.cardHelperText
      : isBank
          ? data.bankHelperText
          : data.walletHelperText;

  function setPay(m: PayMethod) {
    onPayMethodChange(m);
    onStep2Seen();
  }

  return (
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-extrabold muted">{data.stepLabel}</div>
            <div className="text-2xl font-extrabold">{data.mainTitle}</div>
            <div className="mt-1 text-sm text-slate-700">{data.description}</div>
          </div>
          <span className="chip">
          <i className="fa-solid fa-credit-card text-indigo-600" />
            {data.chipText}
        </span>
        </div>

        <div className="mt-5 grid gap-2">
          <RadioCard name="pay" active={isCard} onClick={() => setPay("card")}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-extrabold">{data.cardMethodTitle}</div>
              <div className="flex gap-2 text-slate-500">
                <i className="fa-brands fa-cc-visa" />
                <i className="fa-brands fa-cc-mastercard" />
                <i className="fa-brands fa-cc-amex" />
              </div>
            </div>
            <div className="text-sm muted mt-1">{helper}</div>

            {isCard && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-extrabold text-slate-700">{data.cardNumberLabel}</label>
                    <input
                        className="field mt-2"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder={data.cardNumberPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-slate-700">{data.cardExpLabel}</label>
                    <input
                        className="field mt-2"
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        placeholder={data.cardExpPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-extrabold text-slate-700">{data.cardCvcLabel}</label>
                    <input
                        className="field mt-2"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder={data.cardCvcPlaceholder}
                    />
                  </div>
                </div>
            )}
          </RadioCard>

          <RadioCard name="pay" active={isBank} onClick={() => setPay("bank")}>
            <div className="font-extrabold">{data.bankMethodTitle}</div>
            <div className="text-sm muted mt-1">{helper}</div>

            {isBank && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm">
                  <div className="font-extrabold">{data.bankInfoTitle}</div>
                  <div className="mt-2 text-slate-700">
                    • Ngân hàng: <b>{data.bankInfo.bankName}</b>
                    <br />
                    • STK: <b>{data.bankInfo.accountNumber}</b>
                    <br />
                    • Chủ TK: <b>{data.bankInfo.accountHolder}</b>
                    <br />
                    • {data.bankContentLabel} <b>{orderCodePreview}</b>
                  </div>
                </div>
            )}
          </RadioCard>

          <RadioCard name="pay" active={isWallet} onClick={() => setPay("wallet")}>
            <div className="font-extrabold">{data.walletMethodTitle}</div>
            <div className="text-sm muted mt-1">{helper}</div>

            {isWallet && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm">
                  <div className="font-extrabold">{data.walletQrTitle}</div>
                  <div className="mt-2 text-slate-700 flex items-center gap-3">
                    <div className="h-20 w-20 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                      <i className="fa-solid fa-qrcode text-2xl text-slate-700" />
                    </div>
                    <div>
                      {data.walletQrDescription}
                      <br />
                      {data.walletOrderCodeLabel} <b>{orderCodePreview}</b>
                    </div>
                  </div>
                </div>
            )}
          </RadioCard>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <label className="flex items-start gap-2">
            <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={agree}
                onChange={(e) => onAgreeChange(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
            {data.agreeTextBeforeLink}
              <a className="underline font-extrabold" href={data.termsLinkHref}>
              {data.termsLinkText}
            </a>
              {data.andText}
              <a className="underline font-extrabold" href={data.policiesLinkHref}>
              {data.policiesLinkText}
            </a>
              {data.agreeSuffix}
          </span>
          </label>
          <div className="mt-2 text-xs muted">{data.prototypeNote}</div>
        </div>
      </div>
  );
}