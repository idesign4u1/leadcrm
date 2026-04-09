export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">הגדרת סביבה חסרה</h1>
            <p className="text-sm text-slate-500">קובץ <code className="bg-slate-100 px-1 rounded">.env.local</code> לא נמצא או ריק</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">1. צור קובץ <code>.env.local</code> בשורש הפרויקט:</p>
            <pre className="bg-slate-800 text-green-400 text-xs p-3 rounded-lg overflow-x-auto">{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`}</pre>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">2. קבל את הערכים מדשבורד של Supabase:</p>
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              פתח Supabase Dashboard ↗
            </a>
          </div>

          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">3. אחרי מילוי הקובץ:</p>
            <code className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded">עצור את השרת (Ctrl+C) והרץ מחדש: npm run dev</code>
          </div>
        </div>
      </div>
    </div>
  )
}
