'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types'
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Settings,
  Building2,
  UserCog,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  profile: Profile
  companyName?: string
}

export default function Sidebar({ profile, companyName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isSuperAdmin = profile.role === 'super_admin'

  const navItems = [
    { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
    { href: '/leads', label: 'לידים', icon: Users },
    { href: '/reports', label: 'דוחות', icon: BarChart2 },
    { href: '/settings', label: 'הגדרות', icon: Settings },
  ]

  const adminItems = [
    { href: '/admin/companies', label: 'חברות', icon: Building2 },
    { href: '/admin/users', label: 'משתמשים', icon: UserCog },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-sm">LeadCRM</div>
            {companyName && <div className="text-slate-400 text-xs truncate max-w-[140px]">{companyName}</div>}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">ניהול</div>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive(href)
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}

        {isSuperAdmin && (
          <>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mt-5 mb-2">סופר אדמין</div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive(href)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(profile.full_name)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{profile.full_name}</div>
            <div className="text-slate-500 text-xs truncate">{profile.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all w-full"
        >
          <LogOut size={16} />
          יציאה
        </button>
      </div>
    </aside>
  )
}
