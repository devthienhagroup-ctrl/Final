import { useEffect, useMemo, useState } from 'react'
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
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<UserChangeLog[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL')
  const [genderFilter, setGenderFilter] = useState<'ALL' | UserGender>('ALL')

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

  const availableRoles = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.roleRef?.code || u.role).filter(Boolean))).sort()
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (q && !`${u.email} ${u.name || ''} ${u.phone || ''}`.toLowerCase().includes(q)) return false
      if (statusFilter === 'ACTIVE' && !u.isActive) return false
      if (statusFilter === 'INACTIVE' && u.isActive) return false

      const roleCode = u.roleRef?.code || u.role
      if (roleFilter !== 'ALL' && roleCode !== roleFilter) return false

      if (genderFilter !== 'ALL' && u.gender !== genderFilter) return false

      return true
    })
  }, [users, search, statusFilter, roleFilter, genderFilter])

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
    <main className='mx-auto max-w-7xl p-4 md:p-6 space-y-5'>
      <section className='card p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2 mb-3'>
          <h1 className='text-2xl font-bold'>User Management</h1>
          <button className='btn' onClick={() => window.history.back()}>← Quay lại trang trước</button>
        </div>

        <div className='grid md:grid-cols-4 gap-2'>
          <input className='input' placeholder='Tìm theo email/tên/sđt' value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className='input' value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}>
            <option value='ALL'>Tất cả trạng thái</option>
            <option value='ACTIVE'>Đang hoạt động</option>
            <option value='INACTIVE'>Đã khóa</option>
          </select>
          <select className='input' value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value='ALL'>Tất cả role</option>
            {availableRoles.map((roleCode) => (
              <option key={roleCode} value={roleCode}>{roleCode}</option>
            ))}
          </select>
          <select className='input' value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as 'ALL' | UserGender)}>
            <option value='ALL'>Tất cả giới tính</option>
            <option value='MALE'>MALE</option>
            <option value='FEMALE'>FEMALE</option>
            <option value='OTHER'>OTHER</option>
          </select>
        </div>
      </section>

      <section className='card p-4'>
        <h2 className='text-xl font-bold mb-3'>Tạo user</h2>
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
        <h3 className='text-lg font-semibold mb-3'>Danh sách user ({filteredUsers.length})</h3>
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
    </main>
  )
}
