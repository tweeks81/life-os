# ◎ Life OS

Your personal life operating system. Invite-only, Google sign-in, built on Next.js + Supabase + Vercel.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Auth + DB | Supabase |
| Hosting | Vercel |
| Source | GitHub |

---

## First-time Setup (follow in order)

### Step 1 — GitHub

1. Create a new repo called `life-os` on GitHub
2. Clone it locally: `git clone https://github.com/YOUR_USERNAME/life-os`
3. Copy all these project files into it
4. `git add . && git commit -m "Initial commit" && git push`

---

### Step 2 — Supabase

1. Go to [supabase.com](https://supabase.com) → New project → name it `life-os`
2. Wait for it to provision, then go to **SQL Editor**
3. Paste the entire contents of `supabase/setup.sql` and click **Run**
4. **Uncomment and run the whitelist insert** at the bottom with your Gmail address:
   ```sql
   insert into public.allowed_emails (email, label)
   values ('you@gmail.com', 'Admin');
   ```

#### Enable Google OAuth in Supabase

1. Supabase dashboard → **Authentication** → **Providers** → **Google** → Enable
2. You'll need a Google OAuth client — go to [console.cloud.google.com](https://console.cloud.google.com):
   - Create a new project (or use existing)
   - Enable the **Google+ API** / **People API**
   - Go to **Credentials** → **Create OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorised JavaScript origins: `https://YOUR_PROJECT_REF.supabase.co`
   - Authorised redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret** back into Supabase → Google provider settings
4. Save

#### Get your Supabase keys

Go to **Project Settings** → **API**:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon / public key

---

### Step 3 — Local development

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Step 4 — Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your `life-os` GitHub repo
2. Framework preset: **Next.js** (auto-detected)
3. Add environment variables (from your `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://life-os.vercel.app`)
4. Deploy

#### Update Google OAuth for production

Once you have your Vercel URL, go back to Google Cloud Console → your OAuth client and add:
- Authorised JavaScript origins: `https://your-app.vercel.app`
- Authorised redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (already there)

---

## Adding people to the whitelist

In Supabase → SQL Editor, run:

```sql
insert into public.allowed_emails (email, label)
values ('familymember@gmail.com', 'Mum');
```

To remove someone:
```sql
delete from public.allowed_emails where email = 'familymember@gmail.com';
```

---

## Project structure

```
src/
├── app/
│   ├── auth/
│   │   ├── page.tsx          # Sign-in page
│   │   └── callback/
│   │       └── route.ts      # OAuth callback + whitelist check
│   ├── dashboard/
│   │   └── page.tsx          # Home after sign-in
│   ├── profile/
│   │   └── page.tsx          # Profile page
│   ├── layout.tsx
│   ├── page.tsx              # Redirects to /auth or /dashboard
│   └── globals.css
├── components/
│   ├── SignInButton.tsx       # Google OAuth button
│   ├── SignOutButton.tsx
│   ├── ProfileForm.tsx        # Edit name, DOB, avatar
│   └── Avatar.tsx
├── lib/
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server component client
│       └── middleware.ts     # Session refresh
├── middleware.ts             # Route protection
└── types/
    └── database.ts           # TypeScript DB types
supabase/
└── setup.sql                 # Run once in Supabase SQL editor
```

---

## How invite-only works

1. User clicks "Continue with Google" → redirected to Google
2. Google redirects back to `/auth/callback`
3. The callback checks `allowed_emails` table for their email
4. ✅ If found → profile upserted → redirected to `/dashboard`
5. ❌ If not found → signed out → redirected to `/auth?error=not_allowed`

No one can get in unless their email is in your `allowed_emails` table.
