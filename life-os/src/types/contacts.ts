export interface Contact {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string | null
  date_of_birth: string | null
  phone_mobile: string | null
  phone_home: string | null
  phone_work: string | null
  address_line1: string | null
  address_line2: string | null
  address_town: string | null
  address_city: string | null
  address_postcode: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function contactDisplayName(c: Contact) {
  return `${c.first_name} ${c.last_name}`
}

export function contactInitials(c: Contact) {
  return `${c.first_name[0] ?? ''}${c.last_name[0] ?? ''}`.toUpperCase()
}

export function contactAvatarColour(c: Contact): string {
  const colours = [
    '#c4714f', '#7a8c6e', '#8b6b4a', '#4f7ac4', '#9b59b6',
    '#27ae60', '#e67e22', '#16a085', '#2c3e50', '#8e44ad'
  ]
  const index = (c.first_name.charCodeAt(0) + c.last_name.charCodeAt(0)) % colours.length
  return colours[index]
}
