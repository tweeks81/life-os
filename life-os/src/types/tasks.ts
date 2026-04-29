export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived'
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done'
export type TaskCategory = 'home' | 'vehicle' | 'finance' | 'health' | 'garden' | 'admin' | 'family' | 'technology' | 'other'
export type TaskContext = 'home' | 'calls' | 'shop' | 'online' | 'errand' | 'anywhere'
export type ActionType =
  | 'call_outbound' | 'call_inbound'
  | 'email_sent' | 'email_received'
  | 'online_action' | 'visit' | 'purchase'
  | 'note' | 'document_uploaded'
  | 'resolved' | 'escalated' | 'blocked' | 'unblocked'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  status: ProjectStatus
  colour: string | null
  target_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  open_task_count?: number
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  category: TaskCategory
  context: TaskContext
  urgency: number
  effort: number
  priority: number
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  project?: Project | null
}

export interface TaskAction {
  id: string
  task_id: string
  user_id: string
  action_type: ActionType
  summary: string
  notes: string | null
  contact_name: string | null
  contact_organisation: string | null
  outcome: string | null
  actioned_at: string
  created_at: string
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  home: 'Home', vehicle: 'Vehicle', finance: 'Finance', health: 'Health',
  garden: 'Garden', admin: 'Admin', family: 'Family', technology: 'Technology', other: 'Other'
}

export const CONTEXT_LABELS: Record<TaskContext, string> = {
  home: '🏠 Home', calls: '📞 Calls', shop: '🛒 Shop',
  online: '💻 Online', errand: '🚗 Errand', anywhere: '📍 Anywhere'
}

export const CONTEXT_ICONS: Record<TaskContext, string> = {
  home: '🏠', calls: '📞', shop: '🛒', online: '💻', errand: '🚗', anywhere: '📍'
}

export const URGENCY_LABELS: Record<number, string> = {
  1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low'
}

export const EFFORT_LABELS: Record<number, string> = {
  1: 'Quick', 2: 'Medium', 3: 'Big job'
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1 Urgent', 2: 'P2 High', 3: 'P3 Normal', 4: 'P4 Low'
}

export const PRIORITY_COLOURS: Record<number, string> = {
  1: '#dc2626', 2: '#ea580c', 3: '#2563eb', 4: '#6b7280'
}

export const PRIORITY_BG: Record<number, string> = {
  1: '#fef2f2', 2: '#fff7ed', 3: '#eff6ff', 4: '#f9fafb'
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  call_outbound: '📞 Call made', call_inbound: '📞 Call received',
  email_sent: '✉️ Email sent', email_received: '✉️ Email received',
  online_action: '💻 Online action', visit: '🚗 Visit',
  purchase: '💳 Purchase', note: '📝 Note',
  document_uploaded: '📄 Document', resolved: '✅ Resolved',
  escalated: '⬆️ Escalated', blocked: '🚫 Blocked', unblocked: '✅ Unblocked'
}

export const DEFAULT_PROJECT_COLOURS = [
  '#c4714f', '#7a8c6e', '#8b6b4a', '#4f7ac4', '#9b59b6',
  '#27ae60', '#e67e22', '#e74c3c', '#16a085', '#2c3e50'
]
