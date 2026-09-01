import { useRole } from '../context/RoleContext'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WelcomeBanner({ subtitle }: { subtitle?: string }) {
  const { role } = useRole()
  const user = { name: role?.name }
  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mb-1">
      <h1 className="text-lg font-semibold text-slate-900">
        {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </h1>
      <p className="text-xs text-slate-500">
        {dateLabel}
        {subtitle ? ` · ${subtitle}` : ''}
      </p>
    </div>
  )
}
