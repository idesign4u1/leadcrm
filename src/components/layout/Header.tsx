'use client'

import { Bell, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile
  title?: string
}

export default function Header({ profile, title }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        {title && <h1 className="text-lg font-semibold text-slate-800">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {getInitials(profile.full_name)}
        </div>
      </div>
    </header>
  )
}
