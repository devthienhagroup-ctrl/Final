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
type ChartType = 'line' | 'doughnut' | 'bar'

declare global {
  interface Window {
    Chart?: any
    __chartJsLoading?: Promise<any>
  }
}

const defaultStats: AppointmentStatsResponse = { total: 0, byStatus: {}, byService: [], bySpecialist: [], byMonth: [] }


const textMap = {
  vi: {
    title: 'Lịch hẹn', list: 'Danh sách', stats: 'Thống kê', allBranches: 'Tất cả chi nhánh', allServices: 'Tất cả dịch vụ', allSpecialists: 'Tất cả chuyên viên',
    code: 'Mã', customer: 'Khách hàng', phone: 'SĐT', branch: 'Chi nhánh', service: 'Dịch vụ', specialist: 'Chuyên viên', status: 'Trạng thái', action: 'Thao tác',
    unassigned: 'Chưa phân công', details: 'Xem chi tiết', delete: 'Xóa lịch', showing: 'Hiển thị', appointments: 'lịch hẹn', prev: 'Trước', next: 'Sau', page: 'Trang',
  },
  en: {
    title: 'Appointments', list: 'List', stats: 'Statistics', allBranches: 'All branches', allServices: 'All services', allSpecialists: 'All specialists',
    code: 'Code', customer: 'Customer', phone: 'Phone', branch: 'Branch', service: 'Service', specialist: 'Specialist', status: 'Status', action: 'Actions',
    unassigned: 'Unassigned', details: 'View details', delete: 'Delete', showing: 'Showing', appointments: 'appointments', prev: 'Prev', next: 'Next', page: 'Page',
  },
  de: {
    title: 'Termine', list: 'Liste', stats: 'Statistik', allBranches: 'Alle Filialen', allServices: 'Alle Leistungen', allSpecialists: 'Alle Spezialisten',
    code: 'Code', customer: 'Kunde', phone: 'Telefon', branch: 'Filiale', service: 'Leistung', specialist: 'Spezialist', status: 'Status', action: 'Aktionen',
    unassigned: 'Nicht zugewiesen', details: 'Details', delete: 'Löschen', showing: 'Anzeige', appointments: 'Termine', prev: 'Zurück', next: 'Weiter', page: 'Seite',
  },
} as const

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
        const totalInCenterPlugin = type === 'doughnut'
          ? {
            id: 'totalInCenter',
            afterDraw: (chart: any) => {
              const { ctx } = chart
              const meta = chart.getDatasetMeta(0)
              if (!meta?.data?.length) return
              const x = meta.data[0].x
              const y = meta.data[0].y
              const total = values.reduce((sum, value) => sum + value, 0)
              ctx.save()
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillStyle = '#64748b'
              ctx.font = '500 11px Inter, system-ui, sans-serif'
              ctx.fillText('Tổng', x, y - 9)
              ctx.fillStyle = '#0f172a'
              ctx.font = '700 20px Inter, system-ui, sans-serif'
              ctx.fillText(String(total), x, y + 9)
              ctx.restore()
            },
          }
          : null

        chartRef.current = new Chart(canvas, {
          type,
          plugins: totalInCenterPlugin ? [totalInCenterPlugin] : [],
          data: {
            labels,
            datasets: [{
              label: title,
              data: values,
              backgroundColor: type === 'line' ? 'rgba(14,165,233,0.2)' : colors,
              borderColor: type === 'line' ? '#0ea5e9' : colors,
              borderWidth: type === 'line' ? 2 : 1.25,
              pointRadius: type === 'line' ? 3 : 0,
              pointBackgroundColor: '#0284c7',
              pointBorderColor: '#e0f2fe',
              pointBorderWidth: 1.5,
              tension: 0.35,
              fill: type === 'line',
              cutout: type === 'doughnut' ? '78%' : undefined,
              spacing: type === 'doughnut' ? 2 : 0,
              hoverOffset: type === 'doughnut' ? 6 : 3,
              borderRadius: type === 'bar' ? 8 : 0,
            }],
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: {
                display: type !== 'line',
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  pointStyle: 'circle',
                  boxWidth: 8,
                  boxHeight: 8,
                  padding: 16,
                  color: '#475569',
                  font: {
                    family: 'Inter, system-ui, sans-serif',
                    size: 12,
                  },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                cornerRadius: 8,
                padding: 10,
                displayColors: true,
              },
            },
            scales: type === 'line' || type === 'bar'
              ? {
                x: {
                  beginAtZero: type === 'bar',
                  ticks: { color: '#64748b', precision: 0, font: { size: 11 } },
                  grid: { display: type === 'line', color: 'rgba(148,163,184,0.18)' },
                  border: { display: false },
                },
                y: {
                  beginAtZero: true,
                  ticks: { color: '#64748b', precision: 0, font: { size: 11 } },
                  grid: { color: 'rgba(148,163,184,0.15)' },
                  border: { display: false },
                },
              }
              : undefined,
            layout: type === 'doughnut' ? { padding: 10 } : undefined,
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

export function AppointmentsTab({ lang = 'vi', appointments, specialists, branches, services, isStaff, loading, onAssignSpecialist, onUpdateStatus, onDeleteAppointment }: AppointmentsTabProps) {
  const t = textMap[lang]
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
        <h3 className='admin-card-title'><i className='fa-solid fa-calendar-days' /> {t.title} ({filteredAppointments.length})</h3>
        <div className='admin-row'>
          <button className={`admin-btn admin-btn-ghost ${view === 'list' ? 'admin-btn-active' : ''}`} onClick={() => setView('list')}>{t.list}</button>
          <button className={`admin-btn admin-btn-ghost ${view === 'stats' ? 'admin-btn-active' : ''}`} onClick={() => setView('stats')}>{t.stats}</button>
        </div>
      </div>

      {view === 'stats' ? (
        <>
          <div className='admin-filters-grid'>
            <input className='admin-input' placeholder='Số điện thoại' value={statsPhone} onChange={(e) => setStatsPhone(e.target.value)} />
            <select className='admin-input' value={statsBranchId} onChange={(e) => setStatsBranchId(Number(e.target.value))}>
              <option value={0}>{t.allBranches}</option>
              {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={statsServiceId} onChange={(e) => setStatsServiceId(Number(e.target.value))}>
              <option value={0}>{t.allServices}</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={statsSpecialistId} onChange={(e) => setStatsSpecialistId(Number(e.target.value))}>
              <option value={0}>{t.allSpecialists}</option>
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
              title='Theo trạng thái'
              type='doughnut'
              labels={Object.keys(statusLabelMap).map((key) => statusLabelMap[key])}
              values={Object.keys(statusLabelMap).map((key) => stats.byStatus[key] || 0)}
              colors={['#fbbf24', '#60a5fa', '#34d399', '#fb7185']}
            />
            {!isStaff && (
                <ChartJsPanel
                    title='Theo chuyên viên'
                    type='doughnut'
                    labels={stats.bySpecialist.slice(0, 6).map((item) => item.label)}
                    values={stats.bySpecialist.slice(0, 6).map((item) => item.value)}
                    colors={['#38bdf8', '#818cf8', '#4ade80', '#fb923c', '#f472b6', '#94a3b8']}
                />
            )}
            <ChartJsPanel
              title='Theo dịch vụ'
              type='bar'
              labels={stats.byService.slice(0, 6).map((item) => item.label)}
              values={stats.byService.slice(0, 6).map((item) => item.value)}
              colors={['#a78bfa', '#38bdf8', '#fbbf24', '#34d399', '#fb7185', '#60a5fa']}
              options={{ indexAxis: 'y', plugins: { legend: { display: false } } }}
            />

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
              <option value={0}>{t.allBranches}</option>
              {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={listServiceId} onChange={(e) => { setListServiceId(Number(e.target.value)); setListPage(1) }}>
              <option value={0}>{t.allServices}</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className='admin-input' value={listSpecialistId} onChange={(e) => { setListSpecialistId(Number(e.target.value)); setListPage(1) }}>
              <option value={0}>{t.allSpecialists}</option>
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
                  <th>{t.code}</th>
                  <th>{t.customer}</th>
                  <th>{t.phone}</th>
                  <th>{t.branch}</th>
                  <th>{t.service}</th>
                  <th>{t.specialist}</th>
                  <th>{t.status}</th>
                  <th>{t.action}</th>
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
                          <option value=''>{t.unassigned}</option>
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
                            <button className='admin-btn admin-btn-ghost' onClick={() => { setDetailAppointment(appointment); setActionMenuId(null) }}>{t.details}</button>
                            {!isStaff && <button className='admin-btn admin-btn-danger' onClick={() => { setActionMenuId(null); void onDeleteAppointment(appointment) }}>{t.delete}</button>}
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
            <span className='admin-helper'>{t.showing} {pagedAppointments.length}/{filteredAppointments.length} {t.appointments}</span>
            <div className='admin-row'>
              <button className='admin-btn admin-btn-ghost' disabled={safePage <= 1} onClick={() => setListPage((prev) => Math.max(1, prev - 1))}>{t.prev}</button>
              <span className='admin-helper'>{t.page} {safePage}/{totalPages}</span>
              <button className='admin-btn admin-btn-ghost' disabled={safePage >= totalPages} onClick={() => setListPage((prev) => Math.min(totalPages, prev + 1))}>{t.next}</button>
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
