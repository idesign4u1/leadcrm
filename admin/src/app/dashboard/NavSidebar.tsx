'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Companies', href: '/dashboard/companies' },
  { label: 'Users', href: '/dashboard/users' },
];

export default function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>LeadCRM</div>
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              ...styles.navItem,
              ...(pathname === item.href ? styles.navItemActive : {}),
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={handleSignOut} style={styles.signOut}>
        Sign Out
      </button>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { width: 220, background: '#1E293B', display: 'flex', flexDirection: 'column', padding: 24 },
  logo: { color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 32 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navItem: { color: '#94A3B8', padding: '8px 12px', borderRadius: 6, fontSize: 14, display: 'block' },
  navItemActive: { background: '#334155', color: '#F1F5F9' },
  signOut: { background: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 13 },
};
