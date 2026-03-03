import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  getUserChangeLogs,
  resetAdminUserPassword,
  type AdminUser,
  type UserChangeLog,
  type UserGender,
  updateAdminUser,
} from './userManagement.api'

type UserFormState = {
  email: string
  name: string
  phone: string
  birthDate: string
  gender: '' | UserGender
  address: string
  isActive: boolean
}

type ToastType = 'success' | 'error' | 'info'

type ConfirmState = {
  open: boolean
  title: string
  desc: string
  onConfirm: null | (() => void)
}

function mapUserToForm(user: AdminUser): UserFormState {
  return {
    email: user.email,
    name: user.name || '',
    phone: user.phone || '',
    birthDate: user.birthDate ? new Date(user.birthDate).toISOString().slice(0, 10) : '',
    gender: user.gender || '',
    address: user.address || '',
    isActive: Boolean(user.isActive),
  }
}

function fmtDateTime(v?: string | Date | null) {
  if (!v) return '—'
  const d = typeof v === 'string' ? new Date(v) : v
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function chip(v: string) {
  return v
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .join(' ')
}

export function AdminUserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<UserChangeLog[]>([])
  const [loading, setLoading] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>('info')
  const toastTimer = useRef<number | null>(null)

  const [createForm, setCreateForm] = useState<UserFormState>({
    email: '',
    name: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    isActive: true,
  })
  const [editMap, setEditMap] = useState<Record<number, UserFormState>>({})

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedUser = useMemo(() => users.find((u) => u.id === selectedId) || null, [users, selectedId])

  // confirm
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: '', desc: '', onConfirm: null })

  // lock background scroll while drawer/confirm is open
  const scrollYRef = useRef(0)

  const showToast = (msg: string, type: ToastType = 'info') => {
    setToastMsg(msg)
    setToastType(type)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 1800)
  }

  const openConfirm = (title: string, desc: string, onConfirm: () => void) => {
    setConfirm({ open: true, title, desc, onConfirm })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 320)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  async function loadData() {
    setLoading(true)
    try {
      const [usersRes, logsRes] = await Promise.all([
        getAdminUsers({
          q: search || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          pageSize,
        }),
        getUserChangeLogs(),
      ])

      const isPaginated = !Array.isArray(usersRes) && Array.isArray((usersRes as any).items)
      const rows = isPaginated ? (usersRes as any).items : (usersRes as any)

      setUsers(rows)
      setLogs(logsRes)
      setTotal(isPaginated ? (usersRes as any).total : rows.length)
      setTotalPages(isPaginated ? Math.max((usersRes as any).totalPages, 1) : Math.max(1, Math.ceil(rows.length / pageSize)))

      const next: Record<number, UserFormState> = {}
      rows.forEach((u: AdminUser) => {
        next[u.id] = mapUserToForm(u)
      })
      setEditMap(next)

      // if selected user not in current page -> close drawer
      if (selectedId !== null && !rows.some((u: AdminUser) => u.id === selectedId)) {
        setDrawerOpen(false)
        setSelectedId(null)
      }
    } catch (e: any) {
      showToast(e?.message || 'Tải dữ liệu thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, statusFilter])

  const pagerInfo = useMemo(() => {
    const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
    const showingTo = Math.min(page * pageSize, total)
    return `Hiển thị ${showingFrom}-${showingTo} / ${total} • Trang ${page}/${Math.max(totalPages, 1)}`
  }, [page, pageSize, total, totalPages])

  const selectedLogs = useMemo(() => {
    if (!selectedUser) return []
    const targetEmail = selectedUser.email
    // best-effort: match targetUser email (or id if exists)
    return (logs || []).filter((l) => {
      const tEmail = (l as any).targetUser?.email
      const tId = (l as any).targetUser?.id
      return (tEmail && tEmail === targetEmail) || (tId && tId === selectedUser.id)
    })
  }, [logs, selectedUser])

  async function onCreateUser() {
    if (!createForm.email.trim()) return showToast('Email không được để trống', 'error')
    try {
      await createAdminUser({
        email: createForm.email.trim(),
        name: createForm.name.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        birthDate: createForm.birthDate || undefined,
        gender: createForm.gender || undefined,
        address: createForm.address.trim() || undefined,
        isActive: createForm.isActive,
      })
      setCreateForm({ email: '', name: '', phone: '', birthDate: '', gender: '', address: '', isActive: true })
      showToast('Tạo người dùng thành công', 'success')
      await loadData()
    } catch (e: any) {
      showToast(e?.message || 'Tạo người dùng thất bại', 'error')
    }
  }

  async function onUpdateUser(userId: number) {
    const row = editMap[userId]
    if (!row) return
    try {
      await updateAdminUser(userId, {
        email: row.email.trim(),
        name: row.name.trim() || undefined,
        phone: row.phone.trim() || undefined,
        birthDate: row.birthDate || undefined,
        gender: row.gender || undefined,
        address: row.address.trim() || undefined,
        isActive: row.isActive,
      })
      showToast('Đã lưu thông tin người dùng', 'success')
      await loadData()
    } catch (e: any) {
      showToast(e?.message || 'Cập nhật thất bại', 'error')
    }
  }

  async function onDeleteUser(userId: number) {
    openConfirm('Xóa người dùng', 'Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa user này?', async () => {
      try {
        await deleteAdminUser(userId)
        showToast('Đã xóa người dùng', 'success')
        if (selectedId === userId) {
          setDrawerOpen(false)
          setSelectedId(null)
        }
        await loadData()
      } catch (e: any) {
        showToast(e?.message || 'Xóa người dùng thất bại', 'error')
      }
    })
  }

  async function onResetPassword(userId: number) {
    try {
      await resetAdminUserPassword(userId)
      showToast('Đã reset mật khẩu và gửi email cho user', 'success')
      await loadData()
    } catch (e: any) {
      showToast(e?.message || 'Reset mật khẩu thất bại', 'error')
    }
  }

  function openDrawer(userId: number) {
    setSelectedId(userId)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirm.open) setConfirm((p) => ({ ...p, open: false }))
        else if (drawerOpen) closeDrawer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm.open, drawerOpen])

  useEffect(() => {
    const lock = drawerOpen || confirm.open
    if (!lock) return

    scrollYRef.current = window.scrollY || 0
    const body = document.body

    const prevOverflow = body.style.overflow
    const prevPosition = body.style.position
    const prevTop = body.style.top
    const prevWidth = body.style.width

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollYRef.current}px`
    body.style.width = '100%'

    return () => {
      body.style.overflow = prevOverflow
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.width = prevWidth
      window.scrollTo(0, scrollYRef.current)
    }
  }, [drawerOpen, confirm.open])

  const pageRows = users

  const stats = useMemo(() => {
    const all = users.length
    const active = users.filter((u) => u.isActive).length
    const inactive = users.filter((u) => !u.isActive).length
    const withRefresh = users.filter((u) => (u as any).hasRefreshToken).length
    return { all, active, inactive, withRefresh }
  }, [users])

  return (
      <div className='au-page'>
        <style>{`
        .au-page{
          --bg: #ffffff;
          --text: #0f172a;
          --muted: #64748b;
          --border: rgba(15, 23, 42, 0.08);
          --shadow: 0 20px 45px rgba(2, 6, 23, 0.12);
          --shadow-soft: 0 12px 28px rgba(2, 6, 23, 0.08);
          --radius: 18px;
          --grad: linear-gradient(135deg, #7c3aed, #06b6d4);
          --grad-2: linear-gradient(135deg, #22c55e, #06b6d4);
          --grad-warm: linear-gradient(135deg, #f97316, #ec4899);
          --danger: #ef4444;
          --chip-bg: rgba(2, 6, 23, 0.04);
          --focus: 0 0 0 4px rgba(124, 58, 237, 0.18);

          min-height: 100vh;
          color: var(--text);
          background-color: var(--bg);
          background-image:
            radial-gradient(1200px 600px at 20% -10%, rgba(124, 58, 237, 0.08), transparent 60%),
            radial-gradient(1200px 600px at 90% 0%, rgba(6, 182, 212, 0.08), transparent 55%);
          background-repeat: no-repeat;
          background-attachment: fixed;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
            "Apple Color Emoji", "Segoe UI Emoji";
        }
        .au-page *{ box-sizing:border-box; }
        .au-container{ max-width: 1200px; margin:0 auto; padding: 18px; padding-bottom: 40px; }

        .au-title{
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap: 12px;
          margin-top: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .au-title h2{ margin:0; font-size:22px; letter-spacing:-0.02em; }
        .au-hint{ margin:0; color: var(--muted); font-size:13px; }
        .au-title-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }

        .au-card{
          border:1px solid var(--border);
          border-radius: var(--radius);
          background: rgba(255,255,255,0.9);
          box-shadow: var(--shadow-soft);
        }
        .au-grid{ display: flex; gap: 12px; margin-bottom: 14px; }

        .au-stat{ flex: 1; padding: 14px 14px 12px; overflow:hidden; position:relative; }
        .au-stat-bg{ position:absolute; inset:-1px; opacity:0.12; background: var(--grad); pointer-events:none; }
        .au-stat:nth-child(2) .au-stat-bg{ background: var(--grad-2); }
        .au-stat:nth-child(3) .au-stat-bg{ background: var(--grad-warm); }
        .au-stat:nth-child(4) .au-stat-bg{ background: linear-gradient(135deg, #2563eb, #7c3aed); }
        .au-label{ margin:0 0 6px 0; font-size:12px; color: var(--muted); position:relative; }
        .au-row{ position:relative; display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .au-value{ margin:0; font-size:22px; font-weight:800; letter-spacing:-0.03em; }
        .au-badge-mini{
          position:relative;
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:8px 10px;
          border-radius:999px;
          border:1px solid var(--border);
          background: rgba(255,255,255,0.85);
          font-size:12px;
          color: rgba(15, 23, 42, 0.85);
          white-space:nowrap;
        }
        .au-spark{ width:10px; height:10px; border-radius:999px; background: var(--grad); }

        .au-panel{ padding: 14px; }
        .au-panel-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 10px; flex-wrap:wrap; }
        .au-panel-head h3{ margin:0; font-size:14px; }
        .au-panel-right{ display:flex; align-items:center; gap: 10px; color: var(--muted); font-size: 12px; flex-wrap: wrap; }

        .au-pill{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:10px 12px;
          border:1px solid var(--border);
          border-radius:999px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 10px 20px rgba(2, 6, 23, 0.06);
          transition: transform .15s ease, box-shadow .15s ease;
          cursor:pointer;
          user-select:none;
        }
        .au-pill:hover{ transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .au-pill:active{ transform: translateY(0); }

        .au-input{
          width:100%;
          border-radius:14px;
          border:1px solid var(--border);
          background: rgba(255,255,255,0.9);
          padding:10px 12px;
          outline:none;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .au-input:focus{ box-shadow: var(--focus); border-color: rgba(124, 58, 237, 0.45); }
        .au-field label{ display:block; font-size:12px; color: var(--muted); margin: 0 0 6px 2px; }

        .au-btn{
          border:1px solid var(--border);
          background: rgba(255,255,255,0.9);
          color: var(--text);
          border-radius:14px;
          padding:10px 12px;
          cursor:pointer;
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
          display:inline-flex;
          align-items:center;
          gap:8px;
          user-select:none;
          white-space:nowrap;
        }
        .au-btn:hover{ transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .au-btn:active{ transform: translateY(0); }
        .au-btn.primary{ border:none; color:white; background: var(--grad); box-shadow: 0 16px 32px rgba(124, 58, 237, 0.18); }
        .au-btn.danger{ border:none; color:white; background: linear-gradient(135deg, #ef4444, #f97316); box-shadow: 0 16px 32px rgba(239, 68, 68, 0.16); }
        .au-btn.ghost{ background: rgba(2, 6, 23, 0.02); }
        .au-btn:disabled{ opacity: .55; cursor:not-allowed; transform:none; box-shadow:none; }

        .au-filters{ display:grid; grid-template-columns: 2fr 1fr; gap: 10px; align-items:end; }
        .au-actions{ display:flex; gap: 10px; justify-content:flex-end; margin-top: 10px; flex-wrap: wrap; }

        /* table */
        .au-table-wrap{ overflow:hidden; }
        .au-table{ width:100%; border-collapse: separate; border-spacing:0; }
        .au-table th{ font-size: 12px; color: var(--muted); padding: 12px 10px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.9); text-align:left; }
        .au-table td{ padding: 12px 10px; border-bottom: 1px solid rgba(15, 23, 42, 0.06); font-size: 13px; vertical-align: middle; }
        .au-tbody tr{ transition: background .15s ease; }
        .au-tbody tr:nth-child(odd){ background: rgba(2, 6, 23, 0.012); }
        .au-tbody tr:nth-child(even){ background: rgba(255, 255, 255, 0.9); }
        .au-tbody tr:hover{ background: rgba(124, 58, 237, 0.05); }
        .au-rowlink{ cursor:pointer; }

        .au-badge{ display:inline-flex; align-items:center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--chip-bg); border: 1px solid var(--border); }
        .au-badge.active{ background: rgba(34,197,94,0.10); color: #166534; border-color: #86efac; }
        .au-badge.inactive{ background: rgba(100,116,139,0.10); color: #334155; border-color: #cbd5e1; }

        .au-mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
        .au-sub{ color: var(--muted); font-size: 12px; margin-top: 4px; }

        .au-icon-btn{
          width: 38px; height: 38px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.9);
          cursor:pointer;
          display:grid;
          place-items:center;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .au-icon-btn:hover{ transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .au-icon-btn:active{ transform: translateY(0); }

        .au-table-actions{ display:flex; gap: 8px; justify-content:flex-end; }

        .au-pager{
          margin-top: 12px;
          padding: 12px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.9);
          box-shadow: var(--shadow-soft);
          flex-wrap: wrap;
        }
        .au-pager-left{ color: var(--muted); font-size: 12px; }
        .au-pager-right{ display:flex; align-items:center; gap: 8px; }
        .au-page-btn{
          width: 40px; height: 40px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.95);
          cursor:pointer;
          display:grid;
          place-items:center;
          transition: transform .15s ease, box-shadow .15s ease;
          user-select:none;
        }
        .au-page-btn:hover{ transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
        .au-page-num{ min-width: 44px; height: 40px; padding: 0 12px; border-radius: 14px; border:1px solid var(--border); background: rgba(2, 6, 23, 0.02); display:inline-flex; align-items:center; justify-content:center; font-size: 13px; font-weight: 800; }

        /* overlay + drawer */
        .au-overlay{
          position: fixed; inset: 0;
          background: rgba(2, 6, 23, 0.35);
          opacity: 0;
          pointer-events: none;
          transition: opacity .2s ease;
          z-index: 30;
        }
        .au-overlay.show{ opacity: 1; pointer-events:auto; }

        .au-drawer{
          position: fixed;
          top: 0; right: 0;
          height: 100vh;
          width: min(45%, 560px);
          max-width: 92vw;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-left: 1px solid var(--border);
          box-shadow: var(--shadow);
          transform: translateX(102%);
          transition: transform .26s cubic-bezier(.2,.8,.2,1);
          z-index: 35;
          display:flex;
          flex-direction:column;
        }
        .au-drawer.show{ transform: translateX(0); }
        .au-drawer-head{
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
        }
        .au-drawer-title{ display:flex; flex-direction:column; gap: 2px; }
        .au-drawer-title h4{ margin:0; font-size: 14px; }
        .au-drawer-title p{ margin:0; font-size: 12px; color: var(--muted); }
        .au-drawer-body{ padding: 16px; overflow:auto; }

        .au-section{
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: rgba(255,255,255,0.9);
          box-shadow: var(--shadow-soft);
          padding: 14px;
          margin-bottom: 12px;
        }
        .au-section h5{ margin:0 0 10px 0; font-size: 13px; }
        .au-kv{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .au-k{ color: var(--muted); font-size: 12px; margin-bottom: 4px; }
        .au-v{ font-size: 13px; font-weight: 800; }
        .au-text{ margin:0; font-size: 13px; color: rgba(15, 23, 42, 0.9); line-height: 1.5; }

        .au-toast{
          position: fixed;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          color: white;
          padding: 10px 12px;
          border-radius: 999px;
          font-size: 12px;
          box-shadow: 0 18px 40px rgba(2,6,23,0.22);
          z-index: 60;
        }
        .au-toast.info{ background: rgba(15, 23, 42, 0.92); }
        .au-toast.success{ background: rgba(16, 185, 129, 0.92); }
        .au-toast.error{ background: rgba(239, 68, 68, 0.92); }

        .au-confirm{ position: fixed; inset: 0; display:none; align-items:center; justify-content:center; z-index: 55; }
        .au-confirm.show{ display:flex; }
        .au-confirm-card{
          width: min(520px, 92vw);
          border-radius: 20px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(10px);
          box-shadow: var(--shadow);
          padding: 14px;
        }
        .au-confirm-head{ display:flex; align-items:center; justify-content:space-between; gap: 10px; margin-bottom: 6px; }
        .au-confirm-head h4{ margin:0; font-size: 14px; }
        .au-confirm-desc{ margin: 0 0 12px 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
        .au-confirm-actions{ display:flex; gap: 10px; justify-content:flex-end; flex-wrap: wrap; }

        @media (max-width: 980px){
          .au-stat{ grid-column: span 6; }
          .au-filters{ grid-template-columns: 1fr; }
        }
        @media (max-width: 560px){
          .au-stat{ grid-column: span 12; }
          .au-kv{ grid-template-columns: 1fr; }
        }
      `}</style>

        <div className='au-container'>
          <div className='au-title'>
            <div>
              <h2>Quản lý người dùng</h2>
              <p className='au-hint'>List (table) + Detail (drawer) • đồng bộ phong cách UI</p>
            </div>
            <div className='au-title-actions'>
              <button className='au-pill' onClick={() => void loadData()}>
                ↻ Làm mới
              </button>
              <button className='au-pill' onClick={() => window.history.back()}>
                ← Quay lại
              </button>
              <span style={{ display: loading ? 'inline-flex' : 'none', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12 }}>
              <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    border: '2px solid rgba(15, 23, 42, 0.15)',
                    borderTopColor: 'rgba(124, 58, 237, 0.8)',
                    animation: 'au-spin .7s linear infinite',
                  }}
              />
              Đang tải…
            </span>
            </div>
          </div>

          <style>{`@keyframes au-spin{to{transform:rotate(360deg)}}`}</style>

          {/* quick stats */}
          <div className='au-grid'>
            <div className='au-card au-stat'>
              <div className='au-stat-bg' />
              <p className='au-label'>Số user (trang hiện tại)</p>
              <div className='au-row'>
                <p className='au-value'>{stats.all}</p>
                <span className='au-badge-mini'>
                <span className='au-spark' /> pageRows
              </span>
              </div>
            </div>
            <div className='au-card au-stat'>
              <div className='au-stat-bg' />
              <p className='au-label'>Đang hoạt động</p>
              <div className='au-row'>
                <p className='au-value'>{stats.active}</p>
                <span className='au-badge-mini'>
                <span className='au-spark' /> active
              </span>
              </div>
            </div>
            <div className='au-card au-stat'>
              <div className='au-stat-bg' />
              <p className='au-label'>Đã khóa</p>
              <div className='au-row'>
                <p className='au-value'>{stats.inactive}</p>
                <span className='au-badge-mini'>
                <span className='au-spark' /> inactive
              </span>
              </div>
            </div>
          </div>

          {/* filters */}
          <div className='au-card au-panel' style={{ marginBottom: 12 }}>
            <div className='au-panel-head'>
              <h3>Bộ lọc</h3>
              <div className='au-panel-right'>{pagerInfo}</div>
            </div>
            <div className='au-filters'>
              <div className='au-field'>
                <label>Tìm kiếm</label>
                <input
                    className='au-input'
                    placeholder='Tên / email / số điện thoại'
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className='au-field'>
                <label>Trạng thái</label>
                <select
                    className='au-input'
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='ACTIVE'>Đang hoạt động</option>
                  <option value='INACTIVE'>Đã khóa</option>
                </select>
              </div>
            </div>
            <div className='au-actions'>
              <button
                  className='au-btn'
                  onClick={() => {
                    setSearchInput('')
                    setStatusFilter('ALL')
                    setPage(1)
                    showToast('Đã reset bộ lọc', 'info')
                  }}
              >
                ↺ Reset
              </button>
              <button className='au-btn primary' onClick={() => showToast('Đã áp dụng bộ lọc', 'success')}>
                ✓ Áp dụng
              </button>
            </div>
          </div>

          {/* create */}
          <div className='au-card au-panel' style={{ marginBottom: 12 }}>
            <div className='au-panel-head'>
              <h3>Tạo user</h3>
              <div className='au-panel-right'>Tạo xong hệ thống sẽ gửi email mật khẩu</div>
            </div>
            <div className='au-grid' style={{ marginBottom: 0 }}>
              <div style={{ gridColumn: 'span 4' }} className='au-field'>
                <label>Email</label>
                <input className='au-input' value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 3' }} className='au-field'>
                <label>Tên</label>
                <input className='au-input' value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 3' }} className='au-field'>
                <label>Phone</label>
                <input className='au-input' value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 2' }} className='au-field'>
                <label>Birth</label>
                <input type='date' className='au-input' value={createForm.birthDate} onChange={(e) => setCreateForm((p) => ({ ...p, birthDate: e.target.value }))} />
              </div>

              <div style={{ gridColumn: 'span 3' }} className='au-field'>
                <label>Gender</label>
                <select className='au-input' value={createForm.gender} onChange={(e) => setCreateForm((p) => ({ ...p, gender: e.target.value as '' | UserGender }))}>
                  <option value=''>—</option>
                  <option value='MALE'>MALE</option>
                  <option value='FEMALE'>FEMALE</option>
                  <option value='OTHER'>OTHER</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 7' }} className='au-field'>
                <label>Address</label>
                <input className='au-input' value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 2' }} className='au-field'>
                <label>isActive</label>
                <select className='au-input' value={createForm.isActive ? '1' : '0'} onChange={(e) => setCreateForm((p) => ({ ...p, isActive: e.target.value === '1' }))}>
                  <option value='1'>Active</option>
                  <option value='0'>Inactive</option>
                </select>
              </div>
            </div>
            <div className='au-actions'>
              <button className='au-btn primary' onClick={() => void onCreateUser()}>
                ＋ Tạo user
              </button>
            </div>
          </div>

          {/* table */}
          <div className='au-card au-table-wrap'>
            <table className='au-table'>
              <thead>
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ width: 170 }}>Updated</th>
                <th style={{ textAlign: 'right', width: 220 }}>Thao tác</th>
              </tr>
              </thead>
              <tbody className='au-tbody'>
              {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 18, color: 'var(--muted)' }}>
                      Không có dữ liệu.
                    </td>
                  </tr>
              ) : (
                  pageRows.map((u) => (
                      <tr key={u.id} className='au-rowlink' onClick={() => openDrawer(u.id)}>
                        <td>
                          <div className='au-mono'>#{u.id}</div>
                          <div className='au-sub'>{(u as any).hasRefreshToken ? 'Refresh: Có' : 'Refresh: Không'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800 }}>{u.name || '—'}</div>
                          <div className='au-sub'>{u.email}</div>
                          <div className='au-sub'>{u.phone || '—'}</div>
                        </td>
                        <td>
                      <span className='au-badge'>
                        {chip(String((u as any).roleRef?.code || u.role || '—'))}
                      </span>
                        </td>
                        <td>
                          <span className={`au-badge ${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </td>
                        <td>
                          <div>{fmtDateTime(u.updatedAt as any)}</div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className='au-table-actions'>
                            <button className='au-icon-btn' title='Chi tiết' onClick={() => openDrawer(u.id)}>
                              ⓘ
                            </button>
                            <button className='au-icon-btn' title='Reset mật khẩu' onClick={() => void onResetPassword(u.id)}>
                              ↺
                            </button>
                            <button className='au-icon-btn' title='Xóa' onClick={() => void onDeleteUser(u.id)}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>

          <div className='au-pager'>
            <div className='au-pager-left'>ⓘ {pagerInfo}</div>
            <div className='au-pager-right'>
              <select
                  className='au-input'
                  style={{ width: 130, borderRadius: 999, padding: '10px 12px' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
              >
                {[5, 10, 20, 50].map((s) => (
                    <option key={s} value={s}>
                      {s} / trang
                    </option>
                ))}
              </select>

              <button className='au-page-btn' onClick={() => setPage(1)} disabled={page <= 1}>
                «
              </button>
              <button className='au-page-btn' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                ‹
              </button>
              <span className='au-page-num'>{page}</span>
              <button className='au-page-btn' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                ›
              </button>
              <button className='au-page-btn' onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
                »
              </button>
            </div>
          </div>
        </div>

        {/* overlay */}
        <div
            className={`au-overlay ${drawerOpen || confirm.open ? 'show' : ''}`}
            onClick={() => {
              if (confirm.open) setConfirm((p) => ({ ...p, open: false }))
              else if (drawerOpen) closeDrawer()
            }}
        />

        {/* confirm */}
        <div className={`au-confirm ${confirm.open ? 'show' : ''}`} onClick={() => setConfirm((p) => ({ ...p, open: false }))}>
          <div className='au-confirm-card' onClick={(e) => e.stopPropagation()}>
            <div className='au-confirm-head'>
              <h4>⚠ {confirm.title}</h4>
              <button className='au-icon-btn' onClick={() => setConfirm((p) => ({ ...p, open: false }))}>
                ✕
              </button>
            </div>
            <p className='au-confirm-desc'>{confirm.desc}</p>
            <div className='au-confirm-actions'>
              <button className='au-btn ghost' onClick={() => setConfirm((p) => ({ ...p, open: false }))}>
                Hủy
              </button>
              <button
                  className='au-btn danger'
                  onClick={() => {
                    const fn = confirm.onConfirm
                    setConfirm((p) => ({ ...p, open: false, onConfirm: null }))
                    fn?.()
                  }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>

        {/* drawer */}
        <div className={`au-drawer ${drawerOpen ? 'show' : ''}`} role='dialog' aria-modal='true'>
          <div className='au-drawer-head'>
            <div className='au-drawer-title'>
              <h4>
                Chi tiết user • <span className='au-mono'>#{selectedUser?.id ?? '—'}</span>
              </h4>
              <p>{selectedUser ? selectedUser.email : 'Chọn 1 user từ danh sách để xem'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {selectedUser ? (
                  <span className={`au-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>{selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
              ) : null}
              <button className='au-icon-btn' onClick={closeDrawer}>
                ✕
              </button>
            </div>
          </div>

          <div className='au-drawer-body'>
            {!selectedUser ? (
                <div className='au-section'>
                  <p className='au-text'>Chọn một user trong bảng để mở drawer.</p>
                </div>
            ) : (
                <>
                  {/* meta */}
                  <div className='au-section'>
                    <h5>Thông tin hệ thống</h5>
                    <div className='au-kv'>
                      <div>
                        <div className='au-k'>Role</div>
                        <div className='au-v'>{String((selectedUser as any).roleRef?.code || selectedUser.role || '—')}</div>
                      </div>
                      <div>
                        <div className='au-k'>Refresh token</div>
                        <div className='au-v'>{(selectedUser as any).hasRefreshToken ? 'Có' : 'Không'}</div>
                      </div>
                      <div>
                        <div className='au-k'>Created</div>
                        <div className='au-v'>{fmtDateTime((selectedUser as any).createdAt)}</div>
                      </div>
                      <div>
                        <div className='au-k'>Updated</div>
                        <div className='au-v'>{fmtDateTime((selectedUser as any).updatedAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* edit */}
                  <div className='au-section'>
                    <h5>Chỉnh sửa thông tin</h5>
                    {(() => {
                      const row = editMap[selectedUser.id]
                      if (!row) return <p className='au-text'>Không có form state.</p>
                      return (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className='au-field'>
                              <label>Email</label>
                              <input
                                  className='au-input'
                                  value={row.email}
                                  onChange={(e) => setEditMap((p) => ({ ...p, [selectedUser.id]: { ...p[selectedUser.id], email: e.target.value } }))}
                              />
                            </div>
                            <div className='au-field'>
                              <label>Tên</label>
                              <input
                                  className='au-input'
                                  value={row.name}
                                  onChange={(e) => setEditMap((p) => ({ ...p, [selectedUser.id]: { ...p[selectedUser.id], name: e.target.value } }))}
                              />
                            </div>
                            <div className='au-field'>
                              <label>Phone</label>
                              <input
                                  className='au-input'
                                  value={row.phone}
                                  onChange={(e) => setEditMap((p) => ({ ...p, [selectedUser.id]: { ...p[selectedUser.id], phone: e.target.value } }))}
                              />
                            </div>
                            <div className='au-field'>
                              <label>Birth</label>
                              <input
                                  type='date'
                                  className='au-input'
                                  value={row.birthDate}
                                  onChange={(e) => setEditMap((p) => ({ ...p, [selectedUser.id]: { ...p[selectedUser.id], birthDate: e.target.value } }))}
                              />
                            </div>
                            <div className='au-field'>
                              <label>Gender</label>
                              <select
                                  className='au-input'
                                  value={row.gender}
                                  onChange={(e) => setEditMap((p) => ({ ...p, [selectedUser.id]: { ...p[selectedUser.id], gender: e.target.value as '' | UserGender } }))}
                              >
                                <option value=''>—</option>
                                <option value='MALE'>MALE</option>
                                <option value='FEMALE'>FEMALE</option>
                                <option value='OTHER'>OTHER</option>
                              </select>
                            </div>
                            <div className='au-field'>
                              <label>Status</label>
                              <select
                                  className='au-input'
                                  value={row.isActive ? '1' : '0'}
                                  onChange={(e) => setEditMap((p) => ({ ...p, [selectedUser.id]: { ...p[selectedUser.id], isActive: e.target.value === '1' } }))}
                              >
                                <option value='1'>ACTIVE</option>
                                <option value='0'>INACTIVE</option>
                              </select>
                            </div>
                            <div className='au-field' style={{ gridColumn: 'span 2' }}>
                              <label>Address</label>
                              <input
                                  className='au-input'
                                  value={row.address}
                                  onChange={(e) => setEditMap((p) => ({ ...p, [selectedUser.id]: { ...p[selectedUser.id], address: e.target.value } }))}
                              />
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button className='au-btn' onClick={() => void onResetPassword(selectedUser.id)}>
                                ↺ Reset password
                              </button>
                              <button className='au-btn primary' onClick={() => void onUpdateUser(selectedUser.id)}>
                                ✓ Lưu
                              </button>
                              <button className='au-btn danger' onClick={() => void onDeleteUser(selectedUser.id)}>
                                🗑 Xóa
                              </button>
                            </div>
                          </div>
                      )
                    })()}
                  </div>

                  {/* logs */}
                  <div className='au-section'>
                    <h5>Log thay đổi</h5>
                    {selectedLogs.length === 0 ? (
                        <p className='au-text'>Chưa có log cho user này.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {selectedLogs.slice(0, 30).map((l) => (
                              <div key={l.id} style={{ borderTop: '1px dashed rgba(15,23,42,0.10)', paddingTop: 10 }}>
                                <div style={{ fontWeight: 900 }}>{(l as any).action || '—'} • {(l as any).message || ''}</div>
                                <div className='au-sub'>
                                  Actor: {(l as any).actorUser?.email || 'system'} • {fmtDateTime((l as any).createdAt)}
                                </div>
                                <div className='au-sub'>Email cũ: {(l as any).oldEmail || '—'} • Email mới: {(l as any).newEmail || '—'}</div>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
                </>
            )}
          </div>
        </div>

        {toastMsg ? <div className={`au-toast ${toastType}`}>{toastMsg}</div> : null}
      </div>
  )
}
