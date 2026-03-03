import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '../components/AdminShell'
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

export function AdminUserManagementPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<UserChangeLog[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

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

  async function loadData() {
    setLoading(true)
    try {
      const [usersRes, logsRes] = await Promise.all([getAdminUsers(), getUserChangeLogs()])
      setUsers(usersRes)
      setLogs(logsRes)
      const next: Record<number, UserFormState> = {}
      usersRes.forEach((u) => {
        next[u.id] = mapUserToForm(u)
      })
      setEditMap(next)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => `${u.email} ${u.name || ''} ${u.phone || ''}`.toLowerCase().includes(q))
  }, [users, search])

  async function onCreateUser() {
    if (!createForm.email.trim()) return
    await createAdminUser({
      email: createForm.email.trim(),
      name: createForm.name.trim() || undefined,
      phone: createForm.phone.trim() || undefined,
      birthDate: createForm.birthDate || undefined,
      gender: createForm.gender || undefined,
      address: createForm.address.trim() || undefined,
      isActive: createForm.isActive,
    })

    setCreateForm({
      email: '',
      name: '',
      phone: '',
      birthDate: '',
      gender: '',
      address: '',
      isActive: true,
    })
    await loadData()
  }

  async function onUpdateUser(userId: number) {
    const row = editMap[userId]
    if (!row) return
    await updateAdminUser(userId, {
      email: row.email.trim(),
      name: row.name.trim() || undefined,
      phone: row.phone.trim() || undefined,
      birthDate: row.birthDate || undefined,
      gender: row.gender || undefined,
      address: row.address.trim() || undefined,
      isActive: row.isActive,
    })
    await loadData()
  }

  async function onDeleteUser(userId: number) {
    if (!window.confirm('Xác nhận xóa user?')) return
    await deleteAdminUser(userId)
    await loadData()
  }

  async function onResetPassword(userId: number) {
    await resetAdminUserPassword(userId)
    alert('Đã reset mật khẩu và gửi email cho user')
    await loadData()
  }

  return (
    <AdminShell
      theme={theme}
      onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      rangeDays={30}
      onRangeChange={() => undefined}
      search={search}
      onSearchChange={setSearch}
      onHotkey={() => undefined}
      onConnectPay={() => undefined}
      onCreateCourse={() => undefined}
      onExportMiniOrders={() => undefined}
    >
      <section className='card p-4'>
        <h2 className='text-xl font-bold mb-3'>User Management</h2>
        <div className='grid md:grid-cols-4 gap-2'>
          <input className='input' placeholder='Email' value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
          <input className='input' placeholder='Tên' value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          <input className='input' placeholder='Phone' value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
          <input type='date' className='input' value={createForm.birthDate} onChange={(e) => setCreateForm((p) => ({ ...p, birthDate: e.target.value }))} />
          <select className='input' value={createForm.gender} onChange={(e) => setCreateForm((p) => ({ ...p, gender: e.target.value as '' | UserGender }))}>
            <option value=''>Gender</option>
            <option value='MALE'>MALE</option>
            <option value='FEMALE'>FEMALE</option>
            <option value='OTHER'>OTHER</option>
          </select>
          <input className='input md:col-span-2' placeholder='Address' value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} />
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' checked={createForm.isActive} onChange={(e) => setCreateForm((p) => ({ ...p, isActive: e.target.checked }))} />
            isActive
          </label>
          <button className='btn btn-accent' onClick={() => void onCreateUser()}>Tạo user (mật khẩu tự tạo + gửi mail)</button>
        </div>
      </section>

      <section className='card p-4'>
        <h3 className='text-lg font-semibold mb-3'>Danh sách user</h3>
        {loading ? <p>Đang tải...</p> : null}
        <div className='space-y-4'>
          {filteredUsers.map((u) => {
            const row = editMap[u.id]
            if (!row) return null

            return (
              <div key={u.id} className='border rounded-xl p-3 grid md:grid-cols-4 gap-2 items-center'>
                <div className='text-sm text-slate-600'>
                  <div><b>ID:</b> #{u.id}</div>
                  <div><b>Role:</b> {u.roleRef?.code || u.role} (roleId: {u.roleId ?? 'null'})</div>
                  <div><b>RefreshToken:</b> {u.hasRefreshToken ? 'Có' : 'Không'}</div>
                  <div><b>Created:</b> {u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</div>
                  <div><b>Updated:</b> {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '-'}</div>
                </div>

                <input className='input' value={row.email} onChange={(e) => setEditMap((p) => ({ ...p, [u.id]: { ...p[u.id], email: e.target.value } }))} />
                <input className='input' value={row.name} placeholder='Tên' onChange={(e) => setEditMap((p) => ({ ...p, [u.id]: { ...p[u.id], name: e.target.value } }))} />
                <input className='input' value={row.phone} placeholder='Phone' onChange={(e) => setEditMap((p) => ({ ...p, [u.id]: { ...p[u.id], phone: e.target.value } }))} />

                <input type='date' className='input' value={row.birthDate} onChange={(e) => setEditMap((p) => ({ ...p, [u.id]: { ...p[u.id], birthDate: e.target.value } }))} />
                <select className='input' value={row.gender} onChange={(e) => setEditMap((p) => ({ ...p, [u.id]: { ...p[u.id], gender: e.target.value as '' | UserGender } }))}>
                  <option value=''>Gender</option>
                  <option value='MALE'>MALE</option>
                  <option value='FEMALE'>FEMALE</option>
                  <option value='OTHER'>OTHER</option>
                </select>
                <input className='input md:col-span-2' value={row.address} placeholder='Address' onChange={(e) => setEditMap((p) => ({ ...p, [u.id]: { ...p[u.id], address: e.target.value } }))} />

                <label className='flex items-center gap-2 text-sm'>
                  <input type='checkbox' checked={row.isActive} onChange={(e) => setEditMap((p) => ({ ...p, [u.id]: { ...p[u.id], isActive: e.target.checked } }))} />
                  isActive
                </label>
                <button className='btn' onClick={() => void onUpdateUser(u.id)}>Lưu</button>
                <button className='btn' onClick={() => void onResetPassword(u.id)}>ResetPassword</button>
                <button className='btn btn-danger' onClick={() => void onDeleteUser(u.id)}>Xóa</button>
              </div>
            )
          })}
        </div>
      </section>

      <section className='card p-4'>
        <h3 className='text-lg font-semibold mb-3'>Log thay đổi user</h3>
        <div className='space-y-2 text-sm'>
          {logs.map((l) => (
            <div key={l.id} className='border rounded-lg p-2'>
              <div className='font-medium'>{l.action} - {l.message}</div>
              <div className='text-slate-500'>Actor: {l.actorUser?.email || 'system'} | Target: {l.targetUser?.email || '-'} | {new Date(l.createdAt).toLocaleString()}</div>
              <div className='text-slate-500'>Email cũ: {l.oldEmail || '-'} | Email mới: {l.newEmail || '-'}</div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  )
}
