import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksShell from '@/components/tasks/TasksShell'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: projects }, { data: tasks }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('*, project:projects(id, name, colour)')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <TasksShell
      initialProjects={projects ?? []}
      initialTasks={tasks ?? []}
      userId={user.id}
      profile={profile}
    />
  )
}
