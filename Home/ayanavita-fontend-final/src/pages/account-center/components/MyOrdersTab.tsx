import React from "react";

type Props = {
  cms: any;
  orderKeyword: string;
  setOrderKeyword: React.Dispatch<React.SetStateAction<string>>;
  orderStatusFilter: string;
  setOrderStatusFilter: React.Dispatch<React.SetStateAction<any>>;
  ordersLoading: boolean;
  filteredOrders: any[];
  payingOrderId: number | null;
  selectedOrder: any;
  setSelectedOrder: React.Dispatch<React.SetStateAction<any>>;
  qrModalOrder: any;
  setQrModalOrder: React.Dispatch<React.SetStateAction<any>>;
  qrPayload: any;
  setQrPayload: React.Dispatch<React.SetStateAction<any>>;
  qrCountdown: { expired: boolean; remainingSec: number | null; text: string };
  qrExpiresAt: string | null;
  cancelRequestingOrderId: number | null;
  onPayPendingOrder: (order: any) => void | Promise<void>;
  onRequestCancelOrder: (order: any) => void | Promise<void>;
  onViewOrder: (order: any) => void | Promise<void>;
  formatDate: (date: string | null) => string;
  formatDateTime: (date: string | null | undefined) => string;
  formatMoney: (amount: number) => string;
  orderStatusStyles: Record<string, string>;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Field({
  label,
  iconClass,
  children,
  helper,
}: {
  label: string;
  iconClass: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <i className={classNames(iconClass, "text-slate-400")} />
        {label}
      </span>
      {children}
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}

export default function MyOrdersTab({
  cms,
  orderKeyword,
  setOrderKeyword,
  orderStatusFilter,
  setOrderStatusFilter,
  ordersLoading,
  filteredOrders,
  payingOrderId,
  selectedOrder,
  setSelectedOrder,
  qrModalOrder,
  setQrModalOrder,
  qrPayload,
  setQrPayload,
  qrCountdown,
  qrExpiresAt,
  cancelRequestingOrderId,
  onPayPendingOrder,
  onRequestCancelOrder,
  onViewOrder,
  formatDate,
  formatDateTime,
  formatMoney,
  orderStatusStyles,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Field label={cms.tabs.myOrders.filters.keyword.label} iconClass={cms.tabs.myOrders.filters.keyword.iconClass}>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            type="text"
            placeholder={cms.tabs.myOrders.filters.keyword.placeholder}
            value={orderKeyword}
            onChange={(e) => setOrderKeyword(e.target.value)}
          />
        </Field>

        <Field label={cms.tabs.myOrders.filters.status.label} iconClass={cms.tabs.myOrders.filters.status.iconClass}>
          <select
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
          >
            <option value="all">{cms.tabs.myOrders.filters.status.all}</option>
            <option value="PENDING">{cms.tabs.myOrders.statuses.PENDING}</option>
            <option value="PENDING_PAYMENT">{cms.tabs.myOrders.statuses.PENDING_PAYMENT}</option>
            <option value="CANCEL_REQUESTED">{cms.tabs.myOrders.statuses.CANCEL_REQUESTED}</option>
            <option value="PAID">{cms.tabs.myOrders.statuses.PAID}</option>
            <option value="SHIPPING">{cms.tabs.myOrders.statuses.SHIPPING}</option>
            <option value="SUCCESS">{cms.tabs.myOrders.statuses.SUCCESS}</option>
            <option value="CANCELLED">{cms.tabs.myOrders.statuses.CANCELLED}</option>
            <option value="EXPIRED">{cms.tabs.myOrders.statuses.EXPIRED}</option>
          </select>
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-bold text-slate-700">{cms.tabs.myOrders.list.title}</p>
      </div>

      {ordersLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">{cms.common.loadingText}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">{cms.tabs.myOrders.emptyText}</div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const firstItem = order.items[0];
            return (
              <article key={order.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {firstItem ? (
                    <img src={firstItem.image} alt={firstItem.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <i className="fa-solid fa-box-open text-2xl" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{order.code}</h3>
                    <span className={classNames("inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-bold", orderStatusStyles[order.status])}>
                      {cms.tabs.myOrders.statuses[order.status]}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(order.createdAt)} • {order.payment.method}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-extrabold text-slate-900">{formatMoney(order.pricing.total)}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === "PENDING_PAYMENT" && (
                        <button
                          type="button"
                          onClick={() => void onPayPendingOrder(order)}
                          disabled={payingOrderId === order.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <i className="fa-solid fa-qrcode" />
                          {payingOrderId === order.id ? cms.tabs.myOrders.list.generatingQr : cms.tabs.myOrders.list.pay}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void onViewOrder(order)}
                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100"
                      >
                        <i className="fa-regular fa-eye" />
                        {cms.tabs.myOrders.list.seeDetail}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 px-4 py-6" onClick={() => setSelectedOrder(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{cms.tabs.myOrders.detailTitle}</p>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedOrder.code}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                  <i className="fa-regular fa-clipboard mr-2 text-slate-500" />
                  {cms.tabs.myOrders.sections.general}
                </h4>
                <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.createdAt}:</span> {formatDate(selectedOrder.createdAt)}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.branch}:</span> {selectedOrder.branch}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.status}:</span>{" "}
                    <span className={classNames("inline-flex rounded-full border px-2 py-0.5 text-xs font-bold", orderStatusStyles[selectedOrder.status])}>
                      {cms.tabs.myOrders.statuses[selectedOrder.status]}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                  <i className="fa-regular fa-credit-card mr-2 text-slate-500" />
                  {cms.tabs.myOrders.sections.payment}
                </h4>
                <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.paymentMethod}:</span> {selectedOrder.payment.method}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.paymentRef}:</span> {selectedOrder.payment.ref || cms.common.emptyValue}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.paidAt}:</span> {formatDate(selectedOrder.payment.paidAt)}
                  </p>
                </div>
                {selectedOrder.status === "PENDING" && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => onRequestCancelOrder(selectedOrder)}
                      disabled={cancelRequestingOrderId === selectedOrder.id}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelRequestingOrderId === selectedOrder.id ? cms.tabs.myOrders.actions.requestingCancel : cms.tabs.myOrders.actions.requestCancel}
                    </button>
                  </div>
                )}
                {selectedOrder.status === "PENDING_PAYMENT" && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => void onPayPendingOrder(selectedOrder)}
                      disabled={payingOrderId === selectedOrder.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <i className="fa-solid fa-qrcode" />
                      {payingOrderId === selectedOrder.id ? cms.tabs.myOrders.list.generatingQr : cms.tabs.myOrders.actions.payThisOrder}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                  <i className="fa-solid fa-truck mr-2 text-slate-500" />
                  {cms.tabs.myOrders.sections.shipping}
                </h4>
                <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.receiver}:</span> {selectedOrder.shippingInfo.receiverName}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.phone}:</span> {selectedOrder.shippingInfo.phone}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold">{cms.tabs.myOrders.fields.address}:</span>{" "}
                    {`${selectedOrder.shippingInfo.addressLine}, ${selectedOrder.shippingInfo.district}, ${selectedOrder.shippingInfo.city}`}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.carrier}:</span> {selectedOrder.shippingInfo.carrier}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.trackingCode}:</span> {selectedOrder.shippingInfo.trackingCode || cms.common.emptyValue}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.expectedDelivery}:</span> {formatDate(selectedOrder.shippingInfo.expectedDelivery)}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold">{cms.tabs.myOrders.fields.shippingNote}:</span> {selectedOrder.shippingInfo.note}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                  <i className="fa-solid fa-boxes-stacked mr-2 text-slate-500" />
                  {cms.tabs.myOrders.productsTitle}
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any) => (
                    <div
                      key={item.sku}
                      className="grid items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[64px_1fr_auto]"
                    >
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {cms.tabs.myOrders.fields.sku}: {item.sku}
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-700">
                        <p>
                          {cms.tabs.myOrders.fields.quantity}: x{item.qty}
                        </p>
                        <p className="font-bold text-slate-900">{formatMoney(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                  <i className="fa-solid fa-receipt mr-2 text-slate-500" />
                  {cms.tabs.myOrders.sections.summary}
                </h4>
                <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.subtotal}:</span> {formatMoney(selectedOrder.pricing.subtotal)}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.shipping}:</span> {formatMoney(selectedOrder.pricing.shipping)}
                  </p>
                  <p>
                    <span className="font-semibold">{cms.tabs.myOrders.fields.discount}:</span> -{formatMoney(selectedOrder.pricing.discount)}
                  </p>
                  <p className="font-extrabold text-slate-900">
                    <span>{cms.tabs.myOrders.fields.total}:</span> {formatMoney(selectedOrder.pricing.total)}
                  </p>
                </div>
              </div>

              {selectedOrder.note && selectedOrder.note !== cms.common.emptyValue && (
                <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    <i className="fa-regular fa-note-sticky mr-2 text-slate-500" />
                    {cms.tabs.myOrders.fields.orderNote}:
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{selectedOrder.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {qrModalOrder && qrPayload && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            setQrModalOrder(null);
            setQrPayload(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{cms.tabs.myOrders.qrModal.title}</h3>
              <div className="flex items-center gap-2">
                <span
                  className={"rounded-full px-2 py-1 text-[11px] font-semibold " + (qrCountdown.expired ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700")}
                  title={qrExpiresAt ? `${cms.tabs.myOrders.qrModal.expiresAtTitle}: ${formatDateTime(qrExpiresAt)}` : undefined}
                >
                  <i className="fa-regular fa-clock mr-1" />
                  {qrCountdown.text}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQrModalOrder(null);
                    setQrPayload(null);
                  }}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {cms.common.actions.close}
                </button>
              </div>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {cms.tabs.myOrders.fields.orderCode}: {qrModalOrder.code}
            </p>

            <div className="relative mx-auto mt-4 h-64 w-64">
              <img
                src={qrPayload.qrUrl}
                alt={cms.tabs.myOrders.qrModal.qrAlt}
                className={"h-64 w-64 rounded-xl border border-slate-200 transition " + (qrCountdown.expired ? "opacity-40 blur-[2px]" : "")}
              />

              {qrCountdown.expired && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/40">
                  <div className="rounded-xl bg-white/90 px-4 py-3 text-center shadow">
                    <p className="text-sm font-bold text-slate-900">{cms.tabs.myOrders.qrModal.expiredTitle}</p>
                    <p className="mt-1 text-xs text-slate-600">{cms.tabs.myOrders.qrModal.expiredSubtitle}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold">{cms.tabs.myOrders.fields.amount}:</span> {formatMoney(Number(qrPayload.amount || 0))}
              </p>
              <p>
                <span className="font-semibold">{cms.tabs.myOrders.fields.transferContent}:</span> {qrPayload.transferContent || cms.common.emptyValue}
              </p>
            </div>

            {!qrCountdown.expired ? (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {cms.tabs.myOrders.qrModal.activeHint}
                <br />
                {cms.tabs.myOrders.fields.timeLeft}: <span className="font-semibold">{qrCountdown.text}</span>. {cms.tabs.myOrders.fields.expiresAt}:{" "}
                <span className="font-semibold">{formatDateTime(qrExpiresAt)}</span>.
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <div className="font-semibold">{cms.tabs.myOrders.qrModal.expiredBoxTitle}</div>
                <div className="mt-1">{cms.tabs.myOrders.qrModal.expiredBoxSubtitle}</div>
              </div>
            )}

            <p className="mt-3 text-xs text-slate-500">{cms.tabs.myOrders.qrModal.autoUpdateNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
