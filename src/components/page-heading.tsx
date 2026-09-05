import type { ReactNode } from 'react'

export function PageHeading({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          Distribusi lebih mudah
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      {children}
    </div>
  )
}
