export function DiffBadge({ d }) {
  const cls = 'tag tag-' + (d || '').toLowerCase()
  return <span className={cls}>{d || '-'}</span>
}

export function TopicTag({ t }) {
  return <span className="tag tag-topic">{t}</span>
}
