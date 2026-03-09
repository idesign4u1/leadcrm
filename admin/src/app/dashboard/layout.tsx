import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavSidebar from './NavSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <NavSidebar />
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
