import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAILS = (process.env.INKUITY_ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=/admin/feedback');

  const userEmail = user.email?.toLowerCase() || '';
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(userEmail)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link href="/admin/feedback" className="text-base font-bold text-brand-cyan-400">
              Inkuity
            </Link>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-sm text-slate-400">Feedback Inbox</span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
