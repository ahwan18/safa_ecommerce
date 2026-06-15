import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminPageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:mb-6 md:mb-8">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#ecfeff_100%)] px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="min-w-0">
            {meta && (
              <div className="mb-2 inline-flex min-h-7 items-center rounded-md border border-slate-200 bg-white/80 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 shadow-sm sm:mb-3 sm:text-xs">
                {meta}
              </div>
            )}
            <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl md:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-2">{description}</p>
            )}
          </div>
          {actions && (
            <div className="-mx-1 flex shrink-0 flex-wrap items-center gap-2 overflow-x-auto px-1 sm:overflow-visible">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.045)] transition-shadow duration-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]',
        className
      )}
    >
      {children}
    </section>
  )
}

export function AdminPanelHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/55 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
      <div className="min-w-0">
        <h2 className="truncate text-base font-black text-slate-950">{title}</h2>
        {description && <p className="mt-1 truncate text-xs text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function AdminStatTile({
  label,
  value,
  hint,
  tone = 'slate',
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'slate' | 'orange' | 'green' | 'blue' | 'red'
}) {
  const tones = {
    slate: {
      dot: 'bg-slate-900',
      wash: 'from-slate-50 to-white',
      ring: 'ring-slate-200',
      accent: 'bg-slate-900',
    },
    orange: {
      dot: 'bg-amber-500',
      wash: 'from-amber-50 to-white',
      ring: 'ring-amber-100',
      accent: 'bg-amber-500',
    },
    green: {
      dot: 'bg-emerald-500',
      wash: 'from-emerald-50 to-white',
      ring: 'ring-emerald-100',
      accent: 'bg-emerald-500',
    },
    blue: {
      dot: 'bg-cyan-500',
      wash: 'from-cyan-50 to-white',
      ring: 'ring-cyan-100',
      accent: 'bg-cyan-500',
    },
    red: {
      dot: 'bg-rose-500',
      wash: 'from-rose-50 to-white',
      ring: 'ring-rose-100',
      accent: 'bg-rose-500',
    },
  }
  const toneClass = tones[tone]

  return (
    <AdminPanel
      className={cn(
        'relative overflow-hidden bg-gradient-to-br p-4 ring-1 ring-inset sm:p-5',
        toneClass.wash,
        toneClass.ring
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', toneClass.accent)} />
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 sm:text-xs">
            {label}
          </p>
          <p className="mt-2 truncate text-xl font-black leading-none text-slate-950 sm:mt-3 sm:text-2xl">
            {value}
          </p>
          {hint && <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">{hint}</p>}
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/80 bg-white/85 shadow-sm sm:h-9 sm:w-9">
          <span className={cn('h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5', toneClass.dot)} />
        </span>
      </div>
    </AdminPanel>
  )
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-[linear-gradient(135deg,#f8fafc,#ffffff)] px-4 py-8 text-center sm:px-6 sm:py-10">
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m8-8v16" />
        </svg>
      </span>
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  )
}
