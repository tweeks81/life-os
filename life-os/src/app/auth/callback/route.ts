import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
  }

  const userEmail = data.user.email?.toLowerCase()

  if (!userEmail) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/auth?error=not_allowed`)
  }

  // Check whitelist
  const { data: allowedEmail, error: whitelistError } = await supabase
    .from('allowed_emails')
    .select('email')
    .ilike('email', userEmail)
    .single()

  if (whitelistError || !allowedEmail) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/auth?error=not_allowed`)
  }

  // Upsert their profile (creates it on first login)
  await supabase.from('profiles').upsert(
    {
      id: data.user.id,
      email: userEmail,
      full_name: data.user.user_metadata?.full_name ?? null,
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: false }
  )

  return NextResponse.redirect(`${origin}/dashboard`)
}
