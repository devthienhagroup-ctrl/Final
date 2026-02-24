import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { spaAdminApi, type Appointment, type Branch, type ServiceReview, type SpaService, type Specialist } from '../../api/spaAdmin.api'

type TabKey = 'branches' | 'services' | 'specialists' | 'reviews'

const cardStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  background: '#fff',
  boxShadow: '0 3px 12px rgba(15,23,42,0.05)',
}

export default function AdminSpaPage() {
  const [tab, setTab] = useState<TabKey>('branches')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const [branches, setBranches] = useState<Branch[]>([])
  const [services, setServices] = useState<SpaService[]>([])
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [reviews, setReviews] = useState<ServiceReview[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const [branchForm, setBranchForm] = useState<Partial<Branch>>({ code: '', name: '', address: '', phone: '' })
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

  const [serviceForm, setServiceForm] = useState<any>({
    code: '', name: '', description: '', category: 'health', goals: '', durationMin: 60, price: 0, icon: '👏', imageUrl: '', tag: 'Spa',
  })
  const [editingService, setEditingService] = useState<SpaService | null>(null)

  const [specialistForm, setSpecialistForm] = useState<any>({ code: '', name: '', level: 'SENIOR', bio: '' })
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null)

  const [reviewForm, setReviewForm] = useState<any>({ serviceId: 0, stars: 5, comment: '', customerName: '' })

  const [relationForm, setRelationForm] = useState({ branchId: 0, serviceId: 0, specialistId: 0 })

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [uploadedImage, setUploadedImage] = useState<{ url: string; fileName: string } | null>(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [b, s, sp, r, a] = await Promise.all([
        spaAdminApi.branches(),
        spaAdminApi.services(),
        spaAdminApi.specialists(),
        spaAdminApi.reviews(),
        spaAdminApi.appointments(),
      ])
      setBranches(b)
      setServices(s)
      setSpecialists(sp)
      setReviews(r)
      setAppointments(a)
      setMsg('')
    } catch (e: any) {
      setMsg(e?.message || 'Load dữ liệu thất bại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const selectedServiceReviews = useMemo(() => {
    if (!reviewForm.serviceId) return reviews
    return reviews.filter((r) => r.serviceId === Number(reviewForm.serviceId))
  }, [reviews, reviewForm.serviceId])

  async function handleUploadImage() {
    if (!selectedImage) return
    const result = await spaAdminApi.uploadCloudImage(selectedImage)
    setUploadedImage({ url: result.url, fileName: result.fileName })
    setServiceForm((p: any) => ({ ...p, imageUrl: result.url }))
    setMsg('Đã upload ảnh lên cloud thành công')
  }

  async function handleDeleteCloudImage() {
    if (!uploadedImage) return
    await spaAdminApi.deleteCloudImage({ fileName: uploadedImage.fileName })
    setUploadedImage(null)
    setServiceForm((p: any) => ({ ...p, imageUrl: '' }))
    setMsg('Đã xóa ảnh cloud')
  }

  function resetServiceForm() {
    setServiceForm({ code: '', name: '', description: '', category: 'health', goals: '', durationMin: 60, price: 0, icon: '👏', imageUrl: '', tag: 'Spa' })
    setEditingService(null)
    setUploadedImage(null)
  }

  return (
    <div style={{ maxWidth: 1280, margin: '20px auto', padding: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>🌸 Spa Admin Dashboard</h2>
          <div style={{ color: '#64748b', marginTop: 4 }}>Quản lý chi nhánh, dịch vụ, chuyên viên, review và lịch hẹn</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/admin/orders">Admin Orders</Link>
          <button onClick={loadAll}>Reload</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['branches', `Chi nhánh (${branches.length})`],
          ['services', `Dịch vụ (${services.length})`],
          ['specialists', `Chuyên viên + Quan hệ`],
          ['reviews', `Review + Lịch hẹn`],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as TabKey)} style={{
            borderRadius: 999,
            border: tab === k ? '1px solid #0ea5e9' : '1px solid #cbd5e1',
            background: tab === k ? '#e0f2fe' : '#fff',
            padding: '8px 14px',
            fontWeight: 700,
          }}>{label}</button>
        ))}
      </div>

      {msg && <div style={{ ...cardStyle, marginBottom: 12, background: '#f0fdf4', borderColor: '#bbf7d0' }}>{msg}</div>}
      {loading && <div style={{ ...cardStyle, marginBottom: 12 }}>Đang tải dữ liệu...</div>}

      {tab === 'branches' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14 }}>
          <div style={cardStyle}>
            <h3>{editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}</h3>
            <input placeholder='Code (vd: HCM_Q7)' value={branchForm.code || ''} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} />
            <input placeholder='Tên chi nhánh' value={branchForm.name || ''} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
            <input placeholder='Địa chỉ' value={branchForm.address || ''} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
            <input placeholder='Số điện thoại' value={branchForm.phone || ''} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={async () => {
                if (editingBranch) await spaAdminApi.updateBranch(editingBranch.id, branchForm)
                else await spaAdminApi.createBranch(branchForm)
                setBranchForm({ code: '', name: '', address: '', phone: '' })
                setEditingBranch(null)
                await loadAll()
              }}>{editingBranch ? 'Lưu chỉnh sửa' : 'Thêm mới'}</button>
              {editingBranch && <button onClick={() => { setEditingBranch(null); setBranchForm({ code: '', name: '', address: '', phone: '' }) }}>Hủy</button>}
            </div>
          </div>

          <div style={cardStyle}>
            <h3>Danh sách chi nhánh</h3>
            <table width="100%"><thead><tr><th align='left'>Tên</th><th align='left'>Địa chỉ</th><th>Thao tác</th></tr></thead><tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td><td>{b.address}</td>
                  <td style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button onClick={() => { setEditingBranch(b); setBranchForm(b) }}>Chỉnh sửa</button>
                    <button onClick={() => alert(`Chi tiết: ${b.name}\n${b.address}\n${b.phone || ''}`)}>Xem chi tiết</button>
                    <button onClick={async () => { await spaAdminApi.deleteBranch(b.id); await loadAll() }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14 }}>
          <div style={cardStyle}>
            <h3>{editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
            <input placeholder='Code' value={serviceForm.code} onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })} />
            <input placeholder='Tên dịch vụ (hỗ trợ tiếng Việt + emoji 👏🤗)' value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
            <input placeholder='Mục tiêu, cách nhau dấu phẩy' value={serviceForm.goals} onChange={(e) => setServiceForm({ ...serviceForm, goals: e.target.value })} />
            <input placeholder='Mô tả' value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
            <input placeholder='Icon' value={serviceForm.icon} onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })} />
            <input type='number' placeholder='Thời gian (phút)' value={serviceForm.durationMin} onChange={(e) => setServiceForm({ ...serviceForm, durationMin: Number(e.target.value) })} />
            <input type='number' placeholder='Giá' value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
            <input placeholder='Image URL' value={serviceForm.imageUrl} onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type='file' accept='image/*' onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
              <button onClick={handleUploadImage}>Upload cloud</button>
              <button onClick={handleDeleteCloudImage} disabled={!uploadedImage}>Xóa ảnh cloud</button>
            </div>
            {serviceForm.imageUrl && <img src={serviceForm.imageUrl} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginTop: 8 }} />}
            <button style={{ marginTop: 10 }} onClick={async () => {
              const payload = {
                ...serviceForm,
                goals: String(serviceForm.goals || '').split(',').map((x) => x.trim()).filter(Boolean),
              }
              if (editingService) await spaAdminApi.updateService(editingService.id, payload)
              else await spaAdminApi.createService(payload)
              resetServiceForm()
              await loadAll()
            }}>{editingService ? 'Lưu chỉnh sửa' : 'Thêm dịch vụ'}</button>
          </div>

          <div style={cardStyle}>
            <h3>Danh sách dịch vụ</h3>
            {services.map((s) => (
              <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>{s.name}</b>
                  <span>{s.durationMin} phút • {s.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <div style={{ color: '#64748b', marginTop: 4 }}>Mục tiêu: {s.goals?.join(', ') || '-'}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button onClick={() => {
                    setEditingService(s)
                    setServiceForm({ ...s, goals: s.goals?.join(', ') || '' })
                  }}>Chỉnh sửa</button>
                  <button onClick={() => alert(`Chi tiết\n${s.name}\n${s.description || '-'}\nIcon: ${s.icon || '-'}`)}>Xem chi tiết</button>
                  <button onClick={async () => { await spaAdminApi.deleteService(s.id); await loadAll() }}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'specialists' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14 }}>
          <div style={cardStyle}>
            <h3>{editingSpecialist ? 'Chỉnh sửa chuyên viên' : 'Thêm chuyên viên'}</h3>
            <input placeholder='Code' value={specialistForm.code} onChange={(e) => setSpecialistForm({ ...specialistForm, code: e.target.value })} />
            <input placeholder='Tên chuyên viên' value={specialistForm.name} onChange={(e) => setSpecialistForm({ ...specialistForm, name: e.target.value })} />
            <select value={specialistForm.level} onChange={(e) => setSpecialistForm({ ...specialistForm, level: e.target.value })}>
              <option value='THERAPIST'>THERAPIST</option><option value='SENIOR'>SENIOR</option><option value='EXPERT'>EXPERT</option>
            </select>
            <input placeholder='Bio' value={specialistForm.bio} onChange={(e) => setSpecialistForm({ ...specialistForm, bio: e.target.value })} />
            <button style={{ marginTop: 8 }} onClick={async () => {
              if (editingSpecialist) await spaAdminApi.updateSpecialist(editingSpecialist.id, specialistForm)
              else await spaAdminApi.createSpecialist(specialistForm)
              setEditingSpecialist(null)
              setSpecialistForm({ code: '', name: '', level: 'SENIOR', bio: '' })
              await loadAll()
            }}>{editingSpecialist ? 'Lưu chỉnh sửa' : 'Thêm chuyên viên'}</button>

            <hr style={{ margin: '16px 0' }} />
            <h4>Gán quan hệ N-N</h4>
            <select value={relationForm.branchId} onChange={(e) => setRelationForm({ ...relationForm, branchId: Number(e.target.value) })}>
              <option value={0}>Chọn chi nhánh</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={relationForm.serviceId} onChange={(e) => setRelationForm({ ...relationForm, serviceId: Number(e.target.value) })}>
              <option value={0}>Chọn dịch vụ</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={relationForm.specialistId} onChange={(e) => setRelationForm({ ...relationForm, specialistId: Number(e.target.value) })}>
              <option value={0}>Chọn chuyên viên</option>{specialists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={async () => {
              if (!relationForm.branchId || !relationForm.serviceId || !relationForm.specialistId) return
              await spaAdminApi.syncRelations({
                branchService: [{ branchId: relationForm.branchId, serviceId: relationForm.serviceId }],
                serviceSpecialist: [{ serviceId: relationForm.serviceId, specialistId: relationForm.specialistId }],
                branchSpecialist: [{ branchId: relationForm.branchId, specialistId: relationForm.specialistId }],
              })
              await loadAll()
            }}>Lưu quan hệ</button>
          </div>

          <div style={cardStyle}>
            <h3>Danh sách chuyên viên</h3>
            {specialists.map((s) => (
              <div key={s.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 0' }}>
                <div><b>{s.name}</b> ({s.level})</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Chi nhánh: {s.branchIds.join(', ') || '-'} • Dịch vụ: {s.serviceIds.join(', ') || '-'}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingSpecialist(s); setSpecialistForm(s) }}>Chỉnh sửa</button>
                  <button onClick={() => alert(`Bio: ${s.bio || '-'}`)}>Xem chi tiết</button>
                  <button onClick={async () => { await spaAdminApi.deleteSpecialist(s.id); await loadAll() }}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14 }}>
          <div style={cardStyle}>
            <h3>Thêm review</h3>
            <select value={reviewForm.serviceId} onChange={(e) => setReviewForm({ ...reviewForm, serviceId: Number(e.target.value) })}>
              <option value={0}>Chọn dịch vụ</option>
              {services.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}
            </select>
            <select value={reviewForm.stars} onChange={(e) => setReviewForm({ ...reviewForm, stars: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
            </select>
            <input placeholder='Tên khách hàng' value={reviewForm.customerName} onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })} />
            <input placeholder='Comment tiếng Việt + emoji 🤗👏' value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
            <button onClick={async () => { await spaAdminApi.createReview(reviewForm); setReviewForm({ serviceId: 0, stars: 5, comment: '', customerName: '' }); await loadAll() }}>Thêm review</button>

            <hr style={{ margin: '16px 0' }} />
            <h3>Lịch hẹn ({appointments.length})</h3>
            {appointments.slice(0, 10).map((a) => (
              <div key={a.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 0' }}>
                <div><b>{a.customerName}</b> • {a.branch?.name} • {a.service?.name}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{new Date(a.appointmentAt).toLocaleString('vi-VN')} • {a.status}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button onClick={async () => { await spaAdminApi.updateAppointment(a.id, { status: a.status === 'PENDING' ? 'CONFIRMED' : 'PENDING' }); await loadAll() }}>Đổi trạng thái</button>
                  <button onClick={() => alert(`Ghi chú: ${a.note || '-'}\nSĐT: ${a.customerPhone}`)}>Chi tiết</button>
                  <button onClick={async () => { await spaAdminApi.deleteAppointment(a.id); await loadAll() }}>Xóa</button>
                </div>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <h3>Danh sách review ({selectedServiceReviews.length})</h3>
            {selectedServiceReviews.map((r) => (
              <div key={r.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 0' }}>
                <div><b>{'⭐'.repeat(r.stars)}</b> • serviceId: {r.serviceId}</div>
                <div style={{ color: '#334155' }}>{r.comment}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{r.customerName || 'Ẩn danh'} • {new Date(r.createdAt).toLocaleString('vi-VN')}</div>
                <button style={{ marginTop: 6 }} onClick={async () => { await spaAdminApi.deleteReview(r.id); await loadAll() }}>Xóa review</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`input,select,button{padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;margin:4px 0} button{cursor:pointer}`}</style>
    </div>
  )
}
