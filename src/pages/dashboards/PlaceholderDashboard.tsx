import ComingSoon from '../ComingSoon'

export default function PlaceholderDashboard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return <ComingSoon title={title} description={description} />
}
