export interface ContactRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  // Joined
  from_profile?: { full_name: string | null; email: string; avatar_url: string | null }
  to_profile?: { full_name: string | null; email: string; avatar_url: string | null }
}

export interface LinkedContact {
  id: string
  user_id: string
  linked_user_id: string
  created_at: string
  // Joined from profiles
  profile?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    date_of_birth: string | null
  }
}
