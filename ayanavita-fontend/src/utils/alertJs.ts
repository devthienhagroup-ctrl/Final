type AlertType = 'success' | 'error' | 'info' | 'warning'

type AlertOptions = {
  type: AlertType
  title: string
  text?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

const palette: Record<AlertType, { bg: string; accent: string; icon: string }> = {
  success: { bg: '#ecfdf3', accent: '#198754', icon: '✅' },
  error: { bg: '#fef2f2', accent: '#dc3545', icon: '⛔' },
  info: { bg: '#eef2ff', accent: '#3b5bdb', icon: 'ℹ️' },
  warning: { bg: '#fff8e1', accent: '#f59f00', icon: '⚠️' },
}

function show(options: AlertOptions): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(true)

  return new Promise((resolve) => {
    const c = palette[options.type]
    const overlay = document.createElement('div')
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(15,23,42,.45)',
      'backdrop-filter:blur(3px)',
      'padding:16px',
    ].join(';')

    const modal = document.createElement('div')
    modal.style.cssText = [
      'width:100%',
      'max-width:460px',
      'border-radius:16px',
      'overflow:hidden',
      'background:#fff',
      'box-shadow:0 24px 60px rgba(15,23,42,.25)',
      'font-family:Inter,system-ui,sans-serif',
      'border:1px solid #e5e7eb',
    ].join(';')

    modal.innerHTML = `
      <div style="padding:14px 16px;background:${c.bg};border-bottom:1px solid #e5e7eb;display:flex;gap:10px;align-items:center;">
        <span style="font-size:18px">${c.icon}</span>
        <strong style="font-size:16px;color:${c.accent}">${options.title}</strong>
      </div>
      <div style="padding:16px;color:#334155;line-height:1.5;white-space:pre-line;">${options.text || ''}</div>
      <div style="padding:12px 16px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #f1f5f9;">
        ${options.showCancel ? `<button data-role="cancel" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;cursor:pointer;font-weight:600">${options.cancelText || 'Hủy'}</button>` : ''}
        <button data-role="confirm" style="padding:8px 12px;border:none;border-radius:10px;background:${c.accent};color:#fff;cursor:pointer;font-weight:700">${options.confirmText || 'Đồng ý'}</button>
      </div>
    `

    const cleanup = (value: boolean) => {
      overlay.remove()
      resolve(value)
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false)
    })

    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.dataset.role === 'confirm') cleanup(true)
      if (target.dataset.role === 'cancel') cleanup(false)
    })

    overlay.appendChild(modal)
    document.body.appendChild(overlay)
  })
}

export const AlertJs = {
  success(title: string, text = '') {
    return show({ type: 'success', title, text, confirmText: 'Đã hiểu' })
  },
  error(title: string, text: string) {
    return show({ type: 'error', title, text, confirmText: 'Đóng' })
  },
  info(title: string, text: string) {
    return show({ type: 'info', title, text, confirmText: 'Đã rõ' })
  },
  confirm(text: string, title = 'Xác nhận thao tác') {
    return show({ type: 'warning', title, text, showCancel: true, confirmText: 'Tiếp tục', cancelText: 'Hủy' })
  },
}
