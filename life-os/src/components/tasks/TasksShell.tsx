'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, Task, TaskAction } from '@/types/tasks'
import { ShareRecord } from './SharePanel'
import TasksSidebar from './TasksSidebar'
import TasksList from './TasksList'
import TaskDetail from './TaskDetail'
import TaskForm from './TaskForm'
import ProjectForm from './ProjectForm'
import NavBar from '../NavBar'
import MobileProjectsStrip from './MobileProjectsStrip'

type FilterStatus = 'active' | 'completed' | 'all'

export default function TasksShell({
  initialProjects,
  initialTasks,
  initialTaskShares,
  initialProjectShares,
  userId,
  profile,
}: {
  initialProjects: Project[]
  initialTasks: Task[]
  initialTaskShares: Record<string, ShareRecord[]>
  initialProjectShares: Record<string, ShareRecord[]>
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [taskShares, setTaskShares] = useState<Record<string, ShareRecord[]>>(initialTaskShares)
  const [projectShares, setProjectShares] = useState<Record<string, ShareRecord[]>>(initialProjectShares)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskActions, setTaskActions] = useState<TaskAction[]>([])
  const [loadingActions, setLoadingActions] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active')
  const [filterContext, setFilterContext] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const refreshTasks = useCallback(async () => {
    // Fetch own + shared tasks (RLS handles this automatically now)
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, colour, trip_id)')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    if (data) setTasks(data as Task[])
  }, [supabase])

  const refreshProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setProjects(data as Project[])
  }, [supabase])

  const refreshTaskShares = useCallback(async (taskId: string) => {
    const { data } = await (supabase.from('task_shares') as any)
      .select('id, shared_with_email, created_at')
      .eq('task_id', taskId)
      .eq('owner_id', userId)
    setTaskShares(prev => ({ ...prev, [taskId]: data ?? [] }))
  }, [supabase, userId])

  const refreshProjectShares = useCallback(async (projectId: string) => {
    const { data } = await (supabase.from('project_shares') as any)
      .select('id, shared_with_email, created_at')
      .eq('project_id', projectId)
      .eq('owner_id', userId)
    setProjectShares(prev => ({ ...prev, [projectId]: data ?? [] }))
  }, [supabase, userId])

  const openTask = useCallback(async (task: Task) => {
    setSelectedTask(task)
    setLoadingActions(true)
    const { data } = await supabase
      .from('task_actions')
      .select('*')
      .eq('task_id', task.id)
      .order('actioned_at', { ascending: false })
    setTaskActions((data as TaskAction[]) ?? [])
    setLoadingActions(false)
    // Fetch shares for this task if owner
    if (task.user_id === userId) {
      refreshTaskShares(task.id)
    }
  }, [supabase, userId, refreshTaskShares])

  const closeTask = useCallback(() => {
    setSelectedTask(null)
    setTaskActions([])
  }, [])

  const handleTaskSaved = useCallback(async (task: Task) => {
    await refreshTasks()
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, colour, trip_id)')
      .eq('id', task.id)
      .single()
    if (data) {
      setSelectedTask(data as Task)
      const { data: actions } = await supabase
        .from('task_actions')
        .select('*')
        .eq('task_id', task.id)
        .order('actioned_at', { ascending: false })
      setTaskActions((actions as TaskAction[]) ?? [])
    }
  }, [supabase, refreshTasks])

  const handleActionAdded = useCallback(async (taskId: string) => {
    const { data } = await supabase
      .from('task_actions')
      .select('*')
      .eq('task_id', taskId)
      .order('actioned_at', { ascending: false })
    setTaskActions((data as TaskAction[]) ?? [])
  }, [supabase])

  const handleTaskDeleted = useCallback(async () => {
    if (!selectedTask) return
    await supabase.from('tasks').delete().eq('id', selectedTask.id)
    setSelectedTask(null)
    setTaskActions([])
    await refreshTasks()
  }, [supabase, selectedTask, refreshTasks])

  const handleProjectSaved = useCallback(async () => {
    await refreshProjects()
    setShowProjectForm(false)
    setEditingProject(null)
  }, [refreshProjects])

  const projectsWithCounts = projects.map(p => ({
    ...p,
    open_task_count: tasks.filter(t => t.project_id === p.id && t.status !== 'done').length,
    isShared: p.user_id !== userId,
    shares: projectShares[p.id] ?? [],
  }))

  const stats = {
    active: tasks.filter(t => t.status !== 'done').length,
    p1: tasks.filter(t => t.priority === 1 && t.status !== 'done').length,
    projects: projects.filter(p => p.status === 'active').length,
    completed: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="tasks-shell">
      <NavBar profile={profile} />

      <div className="tasks-body">
        <TasksSidebar
          projects={projectsWithCounts}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onNewProject={() => { setEditingProject(null); setShowProjectForm(true) }}
          onEditProject={(p) => { setEditingProject(p); setShowProjectForm(true) }}
          totalActiveTasks={stats.active}
        />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <MobileProjectsStrip
            projects={projectsWithCounts}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />
          <TasksList
            tasks={tasks}
            projects={projectsWithCounts}
            userId={userId}
            selectedProjectId={selectedProjectId}
            selectedTaskId={selectedTask?.id ?? null}
            filterStatus={filterStatus}
            filterContext={filterContext}
            filterPriority={filterPriority}
            filterCategory={filterCategory}
            stats={stats}
            onSelectTask={openTask}
            onFilterStatus={setFilterStatus}
            onFilterContext={setFilterContext}
            onFilterPriority={setFilterPriority}
            onFilterCategory={setFilterCategory}
            onNewTask={() => setShowTaskForm(true)}
          />
          <div className="mobile-bottom-spacer" />
        </div>

        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            actions={taskActions}
            loadingActions={loadingActions}
            projects={projects}
            userId={userId}
            shares={taskShares[selectedTask.id] ?? []}
            onSharesChanged={() => refreshTaskShares(selectedTask.id)}
            onClose={closeTask}
            onTaskSaved={handleTaskSaved}
            onActionAdded={handleActionAdded}
            onDelete={handleTaskDeleted}
          />
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          projects={projects}
          userId={userId}
          defaultProjectId={selectedProjectId}
          onSaved={async () => {
            await refreshTasks()
            setShowTaskForm(false)
          }}
          onClose={() => setShowTaskForm(false)}
        />
      )}

      {showProjectForm && (
        <ProjectForm
          userId={userId}
          project={editingProject}
          shares={editingProject ? (projectShares[editingProject.id] ?? []) : []}
          onSharesChanged={editingProject ? () => refreshProjectShares(editingProject.id) : () => {}}
          onSaved={handleProjectSaved}
          onClose={() => { setShowProjectForm(false); setEditingProject(null) }}
        />
      )}

      <style>{`
        .tasks-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--cream);
          overflow: hidden;
        }
        .tasks-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  )
}
