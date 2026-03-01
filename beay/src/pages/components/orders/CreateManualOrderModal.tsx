import { useState } from "react";
import type { OrderStatus } from "../../admin/AdminOrdersPage";

const DEFAULTS = {
  student: "",
  email: "",
  course: "Flutter LMS App",
  total: 799000,
  status: "PENDING" as OrderStatus,
};

export function CreateManualOrderModal(props: {
  open: boolean;
  onClose: () => void;
  onCreate: (v: {
    student: string;
    email: string;
    course: string;
    total: number;
    status: OrderStatus;
  }) => void;
}) {
  // Mỗi lần open=true, tăng "session" để remount form
  const [openSession, setOpenSession] = useState(0);

  // Khi props.open chuyển từ false->true: ta bump session ngay trong render-safe way:
  // Dùng memo để phát hiện edge và cập nhật session bằng callback sync (không cần effect).
  // NOTE: Đây là pattern an toàn vì setState chỉ xảy ra khi open vừa bật.

  // Khi click mở modal từ parent, parent sẽ set open=true.
  // Ta muốn bump openSession đúng lúc modal bắt đầu mở.
  // Cách đơn giản/ổn định hơn: bump session khi overlay chuyển sang open bằng onAnimationStart/onTransitionStart,
  // nhưng bạn đang dùng hidden/grid, nên mình làm cách "bump khi render open lần đầu" ngay dưới đây.

  // ---- Bump session on open edge (không dùng useEffect)
  // Ta giữ một ref-like state để biết previous open
  const [wasOpen, setWasOpen] = useState(false);
  if (props.open && !wasOpen) {
    // vừa mở
    setWasOpen(true);
    setOpenSession((s) => s + 1);
  } else if (!props.open && wasOpen) {
    // vừa đóng
    setWasOpen(false);
  }

  // Remount form theo openSession => reset state sạch
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 ${
          props.open ? "" : "hidden"
        }`}
        onClick={props.onClose}
      />

      <div
        className={`fixed inset-0 z-50 place-items-center p-4 ${
          props.open ? "grid" : "hidden"
        }`}
      >
        {props.open ? (
          <ModalForm
            key={`manual-order-${openSession}`}
            onClose={props.onClose}
            onCreate={props.onCreate}
          />
        ) : null}
      </div>
    </>
  );
}

function ModalForm(props: {
  onClose: () => void;
  onCreate: (v: {
    student: string;
    email: string;
    course: string;
    total: number;
    status: OrderStatus;
  }) => void;
}) {
  const [student, setStudent] = useState(DEFAULTS.student);
  const [email, setEmail] = useState(DEFAULTS.email);
  const [course, setCourse] = useState(DEFAULTS.course);
  const [total, setTotal] = useState<number>(DEFAULTS.total);
  const [status, setStatus] = useState<OrderStatus>(DEFAULTS.status);

  return (
    <div className="card w-full max-w-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Tạo đơn</div>
          <div className="text-lg font-extrabold">Đơn hàng thủ công</div>
        </div>
        <button className="btn h-10 w-10 p-0 rounded-2xl" onClick={props.onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Học viên</div>
          <input
            className="input w-full mt-2"
            value={student}
            onChange={(e) => setStudent(e.target.value)}
            placeholder="Tên học viên..."
          />
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-500">Email</div>
          <input
            className="input w-full mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@..."
          />
        </div>

        <div className="md:col-span-2">
          <div className="text-xs font-extrabold text-slate-500">Khoá học</div>
          <select
            className="input w-full mt-2"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option>Flutter LMS App</option>
            <option>NestJS + Prisma (LMS API)</option>
            <option>React UI Systems</option>
            <option>Marketing bán khoá</option>
          </select>
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-500">Tổng</div>
          <input
            className="input w-full mt-2"
            value={String(total)}
            onChange={(e) => setTotal(Number(e.target.value || "0"))}
            placeholder="799000"
            inputMode="numeric"
          />
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-500">Trạng thái</div>
          <select
            className="input w-full mt-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            <option value="PENDING">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button className="btn" onClick={props.onClose}>
          Đóng
        </button>

        <button
          className="btn btn-primary"
          onClick={() =>
            props.onCreate({
              student: student.trim(),
              email: email.trim(),
              course,
              total: Number(total || 0),
              status,
            })
          }
        >
          Tạo đơn
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        API: POST /admin/orders/manual (body: student, email, courseId, total,
        status)
      </div>
    </div>
  );
}