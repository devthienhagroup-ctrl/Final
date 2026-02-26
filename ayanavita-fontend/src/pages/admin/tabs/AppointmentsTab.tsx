import { useEffect, useMemo, useRef, useState } from 'react'
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
type ChartType = 'line' | 'doughnut' | 'polarArea'

declare global {
  interface Window {
    Chart?: any
    __chartJsLoading?: Promise<any>
  }
}

const defaultStats: AppointmentStatsResponse = { total: 0, byStatus: {}, byService: [], bySpecialist: [], byMonth: [] }

const loadChartJs = () => {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.Chart) return Promise.resolve(window.Chart)
  if (window.__chartJsLoading) return window.__chartJsLoading

  window.__chartJsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js'
    script.async = true
    script.onload = () => resolve(window.Chart)
    script.onerror = () => reject(new Error('Không tải được Chart.js từ CDN'))
    document.head.appendChild(script)
  })

  return window.__chartJsLoading
}

function ChartJsPanel(props: {
  title: string
  type: ChartType
  labels: string[]
  values: number[]
  colors: string[]
  fullWidth?: boolean
  options?: Record<string, unknown>
}) {
  const { title, type, labels, values, colors, fullWidth, options } = props
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<any>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    const render = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        const Chart = await loadChartJs()
        if (!active || !Chart) return
        chartRef.current?.destroy?.()
        chartRef.current = new Chart(canvas, {
          type,
          data: {
            labels,
            datasets: [{
              label: title,
              data: values,
              backgroundColor: type === 'line' ? 'rgba(14,165,233,0.2)' : colors,
              borderColor: type === 'line' ? '#0ea5e9' : '#1e293b',
              borderWidth: type === 'line' ? 3 : 1,
              pointRadius: type === 'line' ? 3 : 0,
              pointBackgroundColor: '#0284c7',
              tension: 0.35,
              fill: type === 'line',
            }],
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: {
                display: type !== 'line',
                position: 'bottom',
              },
            },
            scales: type === 'line'
              ? {
                x: { ticks: { color: '#475569' }, grid: { color: 'rgba(148,163,184,0.2)' } },
                y: { beginAtZero: true, ticks: { color: '#475569', precision: 0 }, grid: { color: 'rgba(148,163,184,0.2)' } },
              }
              : undefined,
            ...options,
          },
        })
        setLoadError('')
      } catch {
        if (active) setLoadError('Không tải được Chart.js (CDN bị chặn).')
      }
    }
    void render()

    return () => {
      active = false
      chartRef.current?.destroy?.()
      chartRef.current = null
    }
  }, [colors, labels, options, title, type, values])

  return (
    <article className={`admin-stat-card ${fullWidth ? 'admin-stat-card-full' : ''}`}>
      <h4>{title}</h4>
      <div className={`admin-chart-host ${fullWidth ? 'admin-chart-host-line' : 'admin-chart-host-small'}`}>
        <canvas ref={canvasRef} className='admin-chart-canvas' />
      </div>
      {loadError && <small className='admin-helper'>{loadError}</small>}
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

  const [listSearchName, setListSearchName] = useState('')
  const [listSearchPhone, setListSearchPhone] = useState('')
  const [listBranchId, setListBranchId] = useState(0)
  const [listServiceId, setListServiceId] = useState(0)
  const [listSpecialistId, setListSpecialistId] = useState(0)
  const [listFilterMonth, setListFilterMonth] = useState('')
  const [listFilterDate, setListFilterDate] = useState('')
  const [listPage, setListPage] = useState(1)
  const [listPageSize, setListPageSize] = useState(10)

  const [statsPhone, setStatsPhone] = useState('')
  const [statsBranchId, setStatsBranchId] = useState(0)
  const [statsServiceId, setStatsServiceId] = useState(0)
  const [statsSpecialistId, setStatsSpecialistId] = useState(0)

  const [actionMenuId, setActionMenuId] = useState<number | null>(null)
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null)
  const [stats, setStats] = useState<AppointmentStatsResponse>(defaultStats)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')

  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    const date = new Date(item.appointmentAt)
    const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const dayValue = `${monthValue}-${String(date.getDate()).padStart(2, '0')}`
    if (listSearchName.trim() && !item.customerName.toLowerCase().includes(listSearchName.trim().toLowerCase())) return false
    if (listSearchPhone.trim() && !item.customerPhone.toLowerCase().includes(listSearchPhone.trim().toLowerCase())) return false
    if (listBranchId && item.branch?.id !== listBranchId) return false
    if (listServiceId && item.service?.id !== listServiceId) return false
    if (listSpecialistId && item.specialist?.id !== listSpecialistId) return false
    if (listFilterMonth && monthValue !== listFilterMonth) return false
    if (listFilterDate && dayValue !== listFilterDate) return false
    return true
  }), [appointments, listBranchId, listFilterDate, listFilterMonth, listSearchName, listSearchPhone, listServiceId, listSpecialistId])

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / listPageSize))
  const safePage = Math.min(listPage, totalPages)
  const pagedAppointments = useMemo(() => {
    const start = (safePage - 1) * listPageSize
    return filteredAppointments.slice(start, start + listPageSize)
  }, [filteredAppointments, listPageSize, safePage])

  useEffect(() => {
    let active = true
    setStatsLoading(true)
    setStatsError('')
    spaAdminApi.appointmentStats({
      customerPhone: statsPhone,
      branchId: statsBranchId || undefined,
      serviceId: statsServiceId || undefined,
      specialistId: statsSpecialistId || undefined,
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
  }, [statsBranchId, statsPhone, statsServiceId, statsSpecialistId])

  return (
    <section className='admin-card admin-card-glow'>
      <div className='admin-row admin-row-between'>
        <h3 className='admin-card-title'><i className='fa-solid fa-calendar-days' /> Lịch hẹn ({filteredAppointments.length})</h3>
        <div className='admin-row'>
          <button className={`admin-btn admin-btn-ghost ${view === 'list' ? 'admin-btn-active' : ''}`} onClick={() => setView('list')}>Danh sách</button>
          <button className={`admin-btn admin-btn-ghost ${view === 'stats' ? 'admin-btn-active' : ''}`} onClick={() => setView('stats')}>Thống kê</button>
        </div>
      </div>

      {view === 'stats' ? (
        <>
          <div className='admin-filters-grid'>
            <input className='admin-input' placeholder='Số điện thoại' value={statsPhone} onChange={(e) => setStatsPhone(e.target.value)} />
            <select className='admin-input' value={statsBranchId} onChange={(e) => setStatsBranchId(Number(e.target.value))}>
              <option value={0}>Tất cả chi nhánh</option>
              {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={statsServiceId} onChange={(e) => setStatsServiceId(Number(e.target.value))}>
              <option value={0}>Tất cả dịch vụ</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={statsSpecialistId} onChange={(e) => setStatsSpecialistId(Number(e.target.value))}>
              <option value={0}>Tất cả chuyên viên</option>
              {specialists.map((item: Specialist) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div className='admin-kpi-grid'>
            <article className='admin-kpi-card'><span>Tổng lịch hẹn</span><strong>{stats.total}</strong></article>
            <article className='admin-kpi-card'><span>Đã hoàn tất</span><strong>{stats.byStatus.DONE || 0}</strong></article>
            <article className='admin-kpi-card'><span>Chờ xác nhận</span><strong>{stats.byStatus.PENDING || 0}</strong></article>
            <article className='admin-kpi-card'><span>Đã hủy</span><strong>{stats.byStatus.CANCELED || 0}</strong></article>
          </div>

          <div className='admin-stats-grid'>
            <ChartJsPanel
              title='Theo trạng thái (tròn)'
              type='doughnut'
              labels={Object.keys(statusLabelMap).map((key) => statusLabelMap[key])}
              values={Object.keys(statusLabelMap).map((key) => stats.byStatus[key] || 0)}
              colors={['#f59e0b', '#3b82f6', '#16a34a', '#ef4444']}
            />
            <ChartJsPanel
              title='Theo dịch vụ (đa giác)'
              type='polarArea'
              labels={stats.byService.slice(0, 6).map((item) => item.label)}
              values={stats.byService.slice(0, 6).map((item) => item.value)}
              colors={['#8b5cf6', '#06b6d4', '#f59e0b', '#16a34a', '#ef4444', '#3b82f6']}
            />
            {!isStaff && (
              <ChartJsPanel
                title='Theo chuyên viên (tròn)'
                type='doughnut'
                labels={stats.bySpecialist.slice(0, 6).map((item) => item.label)}
                values={stats.bySpecialist.slice(0, 6).map((item) => item.value)}
                colors={['#0ea5e9', '#4f46e5', '#22c55e', '#f97316', '#ec4899', '#64748b']}
              />
            )}
            <ChartJsPanel
              title='Lịch hẹn theo tháng (line)'
              type='line'
              labels={stats.byMonth.slice(-12).map((item) => item.label)}
              values={stats.byMonth.slice(-12).map((item) => item.value)}
              colors={['#0ea5e9']}
              fullWidth
              options={{ plugins: { legend: { display: false } } }}
            />
          </div>

          {statsLoading && <p className='admin-helper'>Đang tải thống kê...</p>}
          {statsError && <p className='admin-helper'>{statsError}</p>}
        </>
      ) : (
        <>
          <div className='admin-filters-grid'>
            <input className='admin-input' placeholder='Tên khách' value={listSearchName} onChange={(e) => { setListSearchName(e.target.value); setListPage(1) }} />
            <input className='admin-input' placeholder='Số điện thoại' value={listSearchPhone} onChange={(e) => { setListSearchPhone(e.target.value); setListPage(1) }} />
            <select className='admin-input' value={listBranchId} onChange={(e) => { setListBranchId(Number(e.target.value)); setListPage(1) }}>
              <option value={0}>Tất cả chi nhánh</option>
              {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={listServiceId} onChange={(e) => { setListServiceId(Number(e.target.value)); setListPage(1) }}>
              <option value={0}>Tất cả dịch vụ</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={listSpecialistId} onChange={(e) => { setListSpecialistId(Number(e.target.value)); setListPage(1) }}>
              <option value={0}>Tất cả chuyên viên</option>
              {specialists.map((item: Specialist) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input className='admin-input' type='month' value={listFilterMonth} onChange={(e) => { setListFilterMonth(e.target.value); setListPage(1) }} />
            <input className='admin-input' type='date' value={listFilterDate} onChange={(e) => { setListFilterDate(e.target.value); setListPage(1) }} />
            <select className='admin-input' value={listPageSize} onChange={(e) => { setListPageSize(Number(e.target.value)); setListPage(1) }}>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>

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
                {pagedAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className='td-strong'>{appointment.code || `#${appointment.id}`}</td>
                    <td>{appointment.customerName}</td>
                    <td>{appointment.customerPhone}</td>
                    <td>{appointment.branch?.name || '-'}</td>
                    <td>{appointment.service?.name || '-'}</td>
                    <td>
                      {isStaff ? (
                        appointment.specialist?.name || '-'
                      ) : (
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
            <span className='admin-helper'>Hiển thị {pagedAppointments.length}/{filteredAppointments.length} lịch hẹn</span>
            <div className='admin-row'>
              <button className='admin-btn admin-btn-ghost' disabled={safePage <= 1} onClick={() => setListPage((prev) => Math.max(1, prev - 1))}>Trước</button>
              <span className='admin-helper'>Trang {safePage}/{totalPages}</span>
              <button className='admin-btn admin-btn-ghost' disabled={safePage >= totalPages} onClick={() => setListPage((prev) => Math.min(totalPages, prev + 1))}>Sau</button>
            </div>
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
