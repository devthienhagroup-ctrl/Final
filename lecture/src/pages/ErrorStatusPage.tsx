import { Link, useNavigate } from 'react-router-dom'

type ErrorStatusPageProps = {
  code: 403 | 404
  title: string
  message: string
}

export function ErrorStatusPage({ code, title, message }: ErrorStatusPageProps) {
  const navigate = useNavigate()

  return (
    <main className="status-page">
      <div className="status-card">
        <p className="status-code">{code}</p>
        <h1>{title}</h1>
        <p className="status-message">{message}</p>

        <div className="status-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
          <Link to="/login" className="btn">
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </main>
  )
}

