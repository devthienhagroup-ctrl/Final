import { useEffect, useMemo, useState } from 'react'
import { spaAdminApi, type Appointment, type AppointmentStatsResponse, type Specialist } from '../../../api/spaAdmin.api'
import type { AppointmentsTabProps } from './types'

const statusLabelMap: Record<string, string> = {
  PENDING: 'Chưa xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DONE: 'Khách đến',
  CANCELED: 'Khách không đến',
}

const statusClassMap: Record<string, string> = {
  PENDING: 'admin-badge-orange',
  CONFIRMED: 'admin-badge-blue',
  DONE: 'admin-badge-green',
  CANCELED: 'admin-badge-pastel',
}

type StatusValue = 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELED'

const defaultStats: AppointmentStatsResponse = { total: 0, byStatus: {}, byService: [], bySpecialist: [], byMonth: [] }

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className='admin-kpi-card'>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function HorizontalBarList({ title, items, color }: { title: string; items: Array<{ label: string; value: number }>; color: string }) {
  const maxValue = Math.max(1, ...items.map((item) => item.value))
  return (
    <article className='admin-stat-card admin-stat-card-wide'>
      <h4>{title}</h4>
      <div className='admin-progress-list'>
        {items.length === 0 && <small className='admin-helper'>Không có dữ liệu.</small>}
        {items.map((item) => (
          <div key={item.label} className='admin-progress-row'>
            <div className='admin-progress-meta'>
              <span title={item.label}>{item.label}</span>
              <b>{item.value}</b>
            </div>
            <i style={{ width: `${(item.value / maxValue) * 100}%`, background: color }} />
          </div>
        ))}
      </div>
    </article>
  )
}

function DonutSummary({ byStatus }: { byStatus: Record<string, number> }) {
  const items = Object.keys(statusLabelMap).map((key) => ({
    key,
    label: statusLabelMap[key],
    value: byStatus[key] || 0,
    color: key === 'PENDING' ? '#f59e0b' : key === 'CONFIRMED' ? '#3b82f6' : key === 'DONE' ? '#16a34a' : '#ef4444',
  }))
  const total = items.reduce((acc, item) => acc + item.value, 0)
  const gradientStops: string[] = []
  let progress = 0
  items.forEach((item) => {
    const part = total > 0 ? (item.value / total) * 100 : 0
    const start = progress
    const end = progress + part
    gradientStops.push(`${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`)
    progress = end
  })

  return (
    <article className='admin-stat-card admin-donut-card'>
      <h4>Tỉ lệ trạng thái lịch hẹn</h4>
      <div className='admin-donut-wrap'>
        <div className='admin-donut' style={{ background: `conic-gradient(${gradientStops.join(', ') || '#e2e8f0 0% 100%'})` }}>
          <div className='admin-donut-center'>{total}</div>
        </div>
        <ul className='admin-donut-legend'>
          {items.map((item) => (
            <li key={item.key}>
              <i style={{ background: item.color }} />
              <span>{item.label}</span>
              <b>{item.value}</b>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function statusActionItems(isStaff: boolean) {
  const adminItems: Array<{ value: StatusValue; label: string }> = [
    { value: 'PENDING', label: statusLabelMap.PENDING },
    { value: 'CONFIRMED', label: statusLabelMap.CONFIRMED },
    { value: 'DONE', label: statusLabelMap.DONE },
    { value: 'CANCELED', label: statusLabelMap.CANCELED },
  ]
  if (!isStaff) return adminItems
  return adminItems.filter((item) => item.value === 'DONE' || item.value === 'CANCELED')
}

export function AppointmentsTab({ appointments, specialists, branches, services, isStaff, loading, onAssignSpecialist, onUpdateStatus, onDeleteAppointment }: AppointmentsTabProps) {
  const [view, setView] = useState<'list' | 'stats'>('list')
  const [searchPhone, setSearchPhone] = useState('')
  const [branchId, setBranchId] = useState(0)
  const [serviceId, setServiceId] = useState(0)
  const [specialistId, setSpecialistId] = useState(0)
  const [actionMenuId, setActionMenuId] = useState<number | null>(null)
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null)
  const [stats, setStats] = useState<AppointmentStatsResponse>(defaultStats)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')

  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    if (searchPhone.trim() && !item.customerPhone.toLowerCase().includes(searchPhone.trim().toLowerCase())) return false
    if (branchId && item.branch?.id !== branchId) return false
    if (serviceId && item.service?.id !== serviceId) return false
    if (specialistId && item.specialist?.id !== specialistId) return false
    return true
  }), [appointments, branchId, searchPhone, serviceId, specialistId])

  useEffect(() => {
    let active = true
    setStatsLoading(true)
    setStatsError('')

    spaAdminApi.appointmentStats({
      customerPhone: searchPhone,
      branchId: branchId || undefined,
      serviceId: serviceId || undefined,
      specialistId: specialistId || undefined,
    })
      .then((res) => {
        if (!active) return
        setStats(res)
      })
      .catch(() => {
        if (!active) return
        setStats(defaultStats)
        setStatsError('Không tải được thống kê từ máy chủ. Vui lòng thử lại.')
      })
      .finally(() => {
        if (active) setStatsLoading(false)
      })

    return () => { active = false }
  }, [branchId, searchPhone, serviceId, specialistId])

  return (
    <section className='admin-card admin-card-glow'>
      <div className='admin-row admin-row-between'>
        <h3 className='admin-card-title'><i className='fa-solid fa-calendar-days' /> Lịch hẹn ({filteredAppointments.length})</h3>
        <div className='admin-row'>
          <button className={`admin-btn admin-btn-ghost ${view === 'list' ? 'admin-btn-active' : ''}`} onClick={() => setView('list')}>Danh sách</button>
          <button className={`admin-btn admin-btn-ghost ${view === 'stats' ? 'admin-btn-active' : ''}`} onClick={() => setView('stats')}>Thống kê</button>
        </div>
      </div>

      <div className='admin-filters-grid'>
        <input className='admin-input' placeholder='Số điện thoại' value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
        <select className='admin-input' value={branchId} onChange={(e) => setBranchId(Number(e.target.value))}>
          <option value={0}>Tất cả chi nhánh</option>
          {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className='admin-input' value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))}>
          <option value={0}>Tất cả dịch vụ</option>
          {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className='admin-input' value={specialistId} onChange={(e) => setSpecialistId(Number(e.target.value))}>
          <option value={0}>Tất cả chuyên viên</option>
          {specialists.map((item: Specialist) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {view === 'stats' ? (
        <div className='admin-stats-layout'>
          <div className='admin-kpi-grid'>
            <MiniMetric label='Tổng lịch hẹn' value={stats.total} />
            <MiniMetric label='Đã hoàn tất' value={stats.byStatus.DONE || 0} />
            <MiniMetric label='Đang chờ xác nhận' value={stats.byStatus.PENDING || 0} />
            <MiniMetric label='Đã hủy' value={stats.byStatus.CANCELED || 0} />
          </div>

          <div className='admin-stats-charts'>
            <DonutSummary byStatus={stats.byStatus} />
            <HorizontalBarList title='Top dịch vụ được đặt' items={stats.byService} color='linear-gradient(90deg, #4f46e5, #06b6d4)' />
            {!isStaff && <HorizontalBarList title='Top chuyên viên có lịch hẹn' items={stats.bySpecialist} color='linear-gradient(90deg, #9333ea, #ec4899)' />}
            <HorizontalBarList title='Lịch hẹn theo tháng' items={stats.byMonth.slice(-12)} color='linear-gradient(90deg, #0ea5e9, #22c55e)' />
          </div>

          {statsLoading && <p className='admin-helper'>Đang tải thống kê...</p>}
          {statsError && <p className='admin-helper'>{statsError}</p>}
        </div>
      ) : (
        <>
          <div className='admin-table-wrap'>
            <table className='admin-table'>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Chi nhánh</th>
                  <th>Dịch vụ</th>
                  <th>Chuyên viên</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className='td-strong'>{appointment.code || `#${appointment.id}`}</td>
                    <td>{appointment.customerName}</td>
                    <td>{appointment.customerPhone}</td>
                    <td>{appointment.branch?.name || '-'}</td>
                    <td>{appointment.service?.name || '-'}</td>
                    <td>
                      {isStaff ? appointment.specialist?.name || '-' : (
                        <select className='admin-input' value={appointment.specialist?.id ?? ''} onChange={(e) => onAssignSpecialist(appointment, e.target.value ? Number(e.target.value) : null)}>
                          <option value=''>Chưa phân công</option>
                          {specialists
                            .filter((item) => item.branchId === appointment.branch?.id && item.serviceIds.includes(appointment.service?.id || 0))
                            .map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td><span className={`admin-badge ${statusClassMap[appointment.status] || 'admin-badge-orange'}`}>{statusLabelMap[appointment.status] || appointment.status}</span></td>
                    <td>
                      <div className='admin-action-menu-wrap'>
                        <button className='admin-btn admin-btn-ghost' onClick={() => setActionMenuId((prev) => prev === appointment.id ? null : appointment.id)}><i className='fa-solid fa-ellipsis' /></button>
                        {actionMenuId === appointment.id && (
                          <div className='admin-action-menu'>
                            {statusActionItems(isStaff).map((item) => (
                              <button key={item.value} className='admin-btn admin-btn-ghost' disabled={appointment.status === item.value || loading} onClick={() => { setActionMenuId(null); void onUpdateStatus(appointment, item.value) }}>
                                {item.label}
                              </button>
                            ))}
                            <button className='admin-btn admin-btn-ghost' onClick={() => { setDetailAppointment(appointment); setActionMenuId(null) }}>Xem chi tiết</button>
                            {!isStaff && <button className='admin-btn admin-btn-danger' onClick={() => { setActionMenuId(null); void onDeleteAppointment(appointment) }}>Xóa lịch</button>}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='admin-row admin-row-between'>
            <span className='admin-helper'>Hiển thị {filteredAppointments.length} lịch hẹn</span>
          </div>
        </>
      )}

      {detailAppointment && (
        <div className='admin-modal-backdrop' onClick={() => setDetailAppointment(null)}>
          <div className='admin-modal' onClick={(e) => e.stopPropagation()}>
            <h4>Chi tiết lịch hẹn {detailAppointment.code || `#${detailAppointment.id}`}</h4>
            <div className='admin-detail-grid'>
              <p><strong>Khách hàng:</strong> {detailAppointment.customerName}</p>
              <p><strong>SĐT:</strong> {detailAppointment.customerPhone}</p>
              <p><strong>Email:</strong> {detailAppointment.customerEmail || '-'}</p>
              <p><strong>Trạng thái:</strong> {statusLabelMap[detailAppointment.status] || detailAppointment.status}</p>
              <p><strong>Chi nhánh:</strong> {detailAppointment.branch?.name || '-'}</p>
              <p><strong>Dịch vụ:</strong> {detailAppointment.service?.name || '-'}</p>
              <p><strong>Chuyên viên:</strong> {detailAppointment.specialist?.name || 'Chưa phân công'}</p>
              <p><strong>Thời gian:</strong> {new Date(detailAppointment.appointmentAt).toLocaleString('vi-VN')}</p>
              <p className='admin-detail-note'><strong>Ghi chú:</strong> {detailAppointment.note || 'Không có ghi chú'}</p>
            </div>
            <div className='admin-row'>
              <button className='admin-btn admin-btn-ghost' onClick={() => setDetailAppointment(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
