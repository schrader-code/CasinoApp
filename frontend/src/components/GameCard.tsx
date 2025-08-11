import { Link } from 'react-router-dom'

type Props = {
  to?: string
  img: string
  title: string
  subtitle?: string
  disabled?: boolean
}

export default function GameCard({ to, img, title, subtitle, disabled }: Props) {
  const content = (
    <div className="card" aria-disabled={disabled ? 'true' : 'false'}>
      <img src={img} alt={title} loading="lazy" />
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
    </div>
  )

  if (disabled || !to) return content
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }} aria-label={`${title} — abrir juego`}>
      {content}
    </Link>
  )
}
