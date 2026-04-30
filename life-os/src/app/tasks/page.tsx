import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksShell from '@/components/tasks/TasksShell'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: projects },
    { data: tasks },
    { data: profile },
    { data: taskShareRows },
    { data: projectShareRows },
  ] = await Promise.all([
    // RLS now returns own + shared projects
    supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true }),
    // RLS now returns own + shared tasks
    supabase
      .from('tasks')
      .select('*, project:projects(id, name, colour)')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    // Shares the user owns (for managing)
    (supabase as any)
      .from('task_shares')
      .select('id, task_id, shared_with_email, created_at')
      .eq('owner_id', user.id),
    (supabase as any)
      .from('project_shares')
      .select('id, project_id, shared_with_email, created_at')
      .eq('owner_id', user.id),
  ])

  // Index shares by entity id
  const taskShares: Record<string, any[]> = {}
  for (const row of taskShareRows ?? []) {
    if (!taskShares[row.task_id]) taskShares[row.task_id] = []
    taskShares[row.task_id].push({ id: row.id, shared_with_email: row.shared_with_email, created_at: row.created_at })
  }

  const projectShares: Record<string, any[]> = {}
  for (const row of projectShareRows ?? []) {
    if (!projectShares[row.project_id]) projectShares[row.project_id] = []
    projectShares[row.project_id].push({ id: row.id, shared_with_email: row.shared_with_email, created_at: row.created_at })
  }

  return (
    <TasksShell
      initialProjects={projects ?? []}
      initialTasks={tasks ?? []}
      initialTaskShares={taskShares}
      initialProjectShares={projectShares}
      userId={user.id}
      profile={profile}
    />
  )
}
