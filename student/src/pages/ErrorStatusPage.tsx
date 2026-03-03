import { Link } from 'react-router-dom'

type ErrorStatusPageProps = {
  code: 403 | 404
  title: string
  message: string
}

export function ErrorStatusPage({ code, title, message }: ErrorStatusPageProps) {
  return (
    <main className="status-page">
      <div className="status-card">
        <p className="status-code">{code}</p>
        <h1>{title}</h1>
        <p className="status-message">{message}</p>

        <div className="status-actions">
          <Link to="/admin/dashboard" className="btn btn-primary">
            Về trang chính
          </Link>
          <Link to="/login" className="btn">
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </main>
  )
}

