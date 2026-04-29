'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, Task, TaskAction } from '@/types/tasks'
import TasksSidebar from './TasksSidebar'
import TasksList from './TasksList'
import TaskDetail from './TaskDetail'
import TaskForm from './TaskForm'
import ProjectForm from './ProjectForm'
import NavBar from '../NavBar'

type FilterStatus = 'active' | 'completed' | 'all'

export default function TasksShell({
  initialProjects,
  initialTasks,
  userId,
  profile,
}: {
  initialProjects: Project[]
  initialTasks: Task[]
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskActions, setTaskActions] = useState<TaskAction[]>([])
  const [loadingActions, setLoadingActions] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active')
  const [filterContext, setFilterContext] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const refreshTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, colour)')
      .eq('user_id', userId)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    if (data) setTasks(data as Task[])
  }, [supabase, userId])

  const refreshProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (data) setProjects(data as Project[])
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
  }, [supabase])

  const closeTask = useCallback(() => {
    setSelectedTask(null)
    setTaskActions([])
  }, [])

  const handleTaskSaved = useCallback(async (task: Task) => {
    await refreshTasks()
    // Re-fetch the task to get computed priority
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, colour)')
      .eq('id', task.id)
      .single()
    if (data) {
      setSelectedTask(data as Task)
      // Also refresh actions in case "done" was set
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

  const handleProjectSaved = useCallback(async () => {
    await refreshProjects()
    setShowProjectForm(false)
    setEditingProject(null)
  }, [refreshProjects])

  // Compute open task counts per project
  const projectsWithCounts = projects.map(p => ({
    ...p,
    open_task_count: tasks.filter(t =>
      t.project_id === p.id && t.status !== 'done'
    ).length
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
        {/* Sidebar */}
        <TasksSidebar
          projects={projectsWithCounts}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onNewProject={() => { setEditingProject(null); setShowProjectForm(true) }}
          onEditProject={(p) => { setEditingProject(p); setShowProjectForm(true) }}
          totalActiveTasks={stats.active}
        />

        {/* Main list */}
        <TasksList
          tasks={tasks}
          projects={projectsWithCounts}
          selectedProjectId={selectedProjectId}
          selectedTaskId={selectedTask?.id ?? null}
          filterStatus={filterStatus}
          filterContext={filterContext}
          filterPriority={filterPriority}
          stats={stats}
          onSelectTask={openTask}
          onFilterStatus={setFilterStatus}
          onFilterContext={setFilterContext}
          onFilterPriority={setFilterPriority}
          onNewTask={() => setShowTaskForm(true)}
        />

        {/* Detail panel */}
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            actions={taskActions}
            loadingActions={loadingActions}
            projects={projects}
            userId={userId}
            onClose={closeTask}
            onTaskSaved={handleTaskSaved}
            onActionAdded={handleActionAdded}
          />
        )}
      </div>

      {/* New task modal */}
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

      {/* Project form modal */}
      {showProjectForm && (
        <ProjectForm
          userId={userId}
          project={editingProject}
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
