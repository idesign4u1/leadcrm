# LeadCRM — מערכת ניהול לידים

CRM מקצועי למשרדי שיווק המנהלים קמפיינים עבור לקוחות. קורא נתונים גולמיים ישירות מ-Google Sheets ומסיר תשתית מלאה לניהול לידים.

---

## טכנולוגיה

| שכבה | טכנולוגיה |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth + DB | Supabase |
| Data Source | Google Sheets API (Service Account) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Notifications | react-hot-toast |

---

## ארכיטקטורה

```
src/
├── app/
│   ├── (auth)/login/        # עמוד כניסה
│   ├── (dashboard)/        # כל הדפים אחרי כניסה
│   │   ├── dashboard/        # לוח בקרה
│   │   ├── leads/            # טבלת לידים
│   │   ├── reports/          # דוחות
│   │   ├── settings/         # הגדרות חברה + Google Sheets
│   │   └── admin/            # Super Admin (חברות + משתמשים)
│   └── api/
│       ├── leads/            # GET/POST לידים
│       ├── leads/[rowNumber]/ # PATCH עדכון ליד
│       ├── sheets/headers/   # קריאת עמודות
│       ├── sheets/connect/   # חיבור גיליון
│       ├── companies/        # CRUD חברות
│       └── users/            # CRUD משתמשים
├── components/
│   ├── layout/           # Sidebar, Header
│   ├── leads/            # LeadsPageClient
│   ├── reports/          # ReportsClient
│   ├── settings/         # SettingsClient
│   ├── admin/            # AdminCompaniesClient, AdminUsersClient
│   └── ui/               # Button, Badge, Modal, Card, Input, Select...
├── lib/
│   ├── supabase/         # Browser + Server clients
│   └── google-sheets/    # Sheets API wrapper
└── types/index.ts
```

---

## הגדרת סביבה

### 1. שכפלון Supabase

1. צור פרויקט ב-[supabase.com](https://supabase.com)
2. הרץ `supabase/schema.sql` ב-SQL Editor
3. העתק `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. שירות אקאונט Google

1. צור פרויקט ב-[Google Cloud Console](https://console.cloud.google.com)
2. הפעל **Google Sheets API**
3. צור **Service Account** והורד JSON key
4. העתק `GOOGLE_SERVICE_ACCOUNT_EMAIL` ו-`GOOGLE_PRIVATE_KEY`
5. **חשוב:** שתף קדר Google Sheets עם אימייל השירות אקאונט

### 3. הרץ מקומית

```bash
npm install
cp .env.example .env.local
# מלא פרטי חיבור

npm run dev
```

---

## תפקידים

| תפקיד | הרשאיות | גישה |
|---|---|---|
| **Super Admin** | צוות השיווק | כל החברות וכל המשתמשים |
| **Company Admin** | מנהל לקוח | כל לידי החברה |
| **Sales Rep** | נציג מכירות | רק לידים משויכים אליו |

---

## תכונות

- ✅ Multi-tenant — כל חברה רואה רק את נתוניה
- ✅ Dynamic Schema — עמודות דינמיות מהגיליון
- ✅ צפייה בלידים + חיפוש + סינון + פינול
- ✅ עדכון סטאטוס + הערות + שיוך נציג אחורה לגיליון
- ✅ הוספת ליד ידנית כשורה חדשה בגיליון
- ✅ התקשרות ישירות: טלפון, WhatsApp, מייל
- ✅ דוחות: Pie Chart + Bar Chart
- ␅ Row Level Security ב-Supabase
- ␅ לוג פעילות מלא
- ␅ איפוס סיסמא למשתמש חדש
