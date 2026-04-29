import Image from 'next/image'

export default function Avatar({
  url,
  name,
  size = 40,
}: {
  url?: string | null
  name?: string | null
  size?: number
}) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (url) {
    return (
      <Image
        src={url}
        alt={name ?? 'Avatar'}
        width={size}
        height={size}
        style={{
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--border-light)',
          display: 'block',
        }}
        unoptimized
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--parchment)',
        border: '2px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.35,
        fontWeight: 600,
        color: 'var(--warm-brown)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}
