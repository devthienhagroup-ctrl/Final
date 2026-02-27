import React, { useMemo, useState } from "react";
import type { PayMethod } from "../../services/checkout.storage";

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
}: {
  payMethod: PayMethod;
  onPayMethodChange: (m: PayMethod) => void;
  agree: boolean;
  onAgreeChange: (v: boolean) => void;
  orderCodePreview: string; // AYA-ORDER or last order code
  onStep2Seen: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const isCard = payMethod === "card";
  const isBank = payMethod === "bank";
  const isWallet = payMethod === "wallet";

  const helper = useMemo(() => {
    if (isCard) return "Thanh toán ngay để xác nhận đơn.";
    if (isBank) return "Xác nhận sau khi nhận tiền (demo).";
    return "Chuyển hướng sang ví để thanh toán (demo).";
  }, [isCard, isBank]);

  function setPay(m: PayMethod) {
    onPayMethodChange(m);
    onStep2Seen();
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-extrabold muted">Bước 2</div>
          <div className="text-2xl font-extrabold">Phương thức thanh toán</div>
          <div className="mt-1 text-sm text-slate-700">Mô phỏng: Card / Chuyển khoản / Ví.</div>
        </div>
        <span className="chip">
          <i className="fa-solid fa-credit-card text-indigo-600" />
          Payments
        </span>
      </div>

      <div className="mt-5 grid gap-2">
        <RadioCard name="pay" active={isCard} onClick={() => setPay("card")}>
          <div className="flex items-center justify-between gap-2">
            <div className="font-extrabold">Thẻ (Card) – Stripe/PayOS (demo)</div>
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
                <label className="text-sm font-extrabold text-slate-700">Số thẻ (demo)</label>
                <input className="field mt-2" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
              </div>
              <div>
                <label className="text-sm font-extrabold text-slate-700">Hết hạn</label>
                <input className="field mt-2" value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/YY" />
              </div>
              <div>
                <label className="text-sm font-extrabold text-slate-700">CVC</label>
                <input className="field mt-2" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" />
              </div>
            </div>
          )}
        </RadioCard>

        <RadioCard name="pay" active={isBank} onClick={() => setPay("bank")}>
          <div className="font-extrabold">Chuyển khoản ngân hàng</div>
          <div className="text-sm muted mt-1">{helper}</div>

          {isBank && (
            <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm">
              <div className="font-extrabold">Thông tin nhận chuyển khoản (demo)</div>
              <div className="mt-2 text-slate-700">
                • Ngân hàng: <b>Vietcombank</b>
                <br />
                • STK: <b>0123 456 789</b>
                <br />
                • Chủ TK: <b>AYANAVITA</b>
                <br />
                • Nội dung: <b>{orderCodePreview}</b>
              </div>
            </div>
          )}
        </RadioCard>

        <RadioCard name="pay" active={isWallet} onClick={() => setPay("wallet")}>
          <div className="font-extrabold">Ví điện tử (MoMo/ZaloPay)</div>
          <div className="text-sm muted mt-1">{helper}</div>

          {isWallet && (
            <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm">
              <div className="font-extrabold">Mô phỏng QR</div>
              <div className="mt-2 text-slate-700 flex items-center gap-3">
                <div className="h-20 w-20 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                  <i className="fa-solid fa-qrcode text-2xl text-slate-700" />
                </div>
                <div>
                  Quét QR để thanh toán (demo).
                  <br />
                  Mã đơn: <b>{orderCodePreview}</b>
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
            Tôi đồng ý với{" "}
            <a className="underline font-extrabold" href="#">
              điều khoản
            </a>{" "}
            và{" "}
            <a className="underline font-extrabold" href="#">
              chính sách
            </a>
            .
          </span>
        </label>
        <div className="mt-2 text-xs muted">Prototype: khi làm thật, bạn log consent + version điều khoản.</div>
      </div>
    </div>
  );
}
