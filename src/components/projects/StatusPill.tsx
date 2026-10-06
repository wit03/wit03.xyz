import type { Status } from '@/lib/vault'

export default function StatusPill({ status }: { status: Status }) {
  return (
    <span className='status-pill' data-status={status}>
      <i aria-hidden='true' />
      {status}
    </span>
  )
}
