import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This endpoint is called by an external cron service (e.g. cron-job.org)
// every few days to prevent Supabase from pausing the project on the free tier.
// It uses the service role key so it doesn't need a user session.

export async function GET(request: Request) {
  // Optional: protect with a secret token so random people can't call it
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const expectedToken = process.env.KEEPALIVE_TOKEN

  if (expectedToken && token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Lightweight ping — just check the profiles table exists
    const { error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      message: 'Database is alive',
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
