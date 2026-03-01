export type UserRoleRow = {
  id: number;
  email: string;
  name?: string | null;
  role: string;
  scopeType?: string | null;
};

export function AssignmentsPanel(props: {
  rows: UserRoleRow[];
  keyword: string;
  onKeywordChange: (v: string) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onEdit: (row: UserRoleRow) => void;
  onResetUserRole: (id: number) => void;
}) {
  return (
    <div className="card p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Gán role cho user</div>
          <div className="text-lg font-extrabold">Danh sách người dùng</div>
          <div className="mt-1 text-sm text-slate-600">Chọn user từ bảng, bấm Edit để gán role.</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Tìm theo tên hoặc email..."
            value={props.keyword}
            onChange={(e) => props.onKeywordChange(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-600">Trang {props.page} / {props.totalPages}</div>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">Tên</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Role hiện tại</th>
              <th className="py-3 pr-4">Scope</th>
              <th className="py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-4 font-extrabold">#{r.id}</td>
                <td className="py-3 pr-4">{r.name || "-"}</td>
                <td className="py-3 pr-4 text-slate-700">{r.email}</td>
                <td className="py-3 pr-4"><span className="chip">{r.role}</span></td>
                <td className="py-3 pr-4 text-slate-600">{r.scopeType || "-"}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="btn h-9 px-3 rounded-xl" onClick={() => props.onEdit(r)}>
                      <i className="fa-solid fa-pen mr-1" />Edit
                    </button>
                    <button className="btn h-9 px-3 rounded-xl" onClick={() => props.onResetUserRole(r.id)}>
                      <i className="fa-solid fa-rotate-left mr-1" />Reset
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!props.rows.length && (
              <tr>
                <td className="py-4 text-slate-500" colSpan={6}>Không có user phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">Page size: {props.pageSize}</div>
        <div className="flex items-center gap-2">
          <button className="btn" disabled={props.page <= 1} onClick={props.onPrevPage}>Trước</button>
          <button className="btn" disabled={props.page >= props.totalPages} onClick={props.onNextPage}>Sau</button>
        </div>
      </div>
    </div>
  );
}
