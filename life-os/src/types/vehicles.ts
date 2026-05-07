export type VehicleType = 'car' | 'van' | 'motorbike' | 'scooter' | 'truck' | 'motorhome' | 'caravan' | 'other'
export type ServiceType = 'full' | 'interim' | 'major' | 'other'
export type PolicyType = 'insurance' | 'breakdown' | 'warranty' | 'other'
export type CoverageType = 'third_party' | 'third_party_fire_theft' | 'comprehensive' | 'other'

export interface Vehicle {
  id: string
  user_id: string
  name: string
  vehicle_type: VehicleType
  make: string | null
  model: string | null
  reg_number: string | null
  year: number | null
  colour: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VehicleMot {
  id: string
  vehicle_id: string
  user_id: string
  test_date: string
  expiry_date: string
  passed: boolean
  garage_name: string | null
  cost: number | null
  mileage: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VehicleService {
  id: string
  vehicle_id: string
  user_id: string
  service_date: string
  garage_name: string | null
  cost: number | null
  mileage: number | null
  service_type: ServiceType | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VehicleMaintenance {
  id: string
  vehicle_id: string
  user_id: string
  work_date: string
  description: string
  garage_name: string | null
  cost: number | null
  mileage: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VehiclePolicy {
  id: string
  vehicle_id: string
  user_id: string
  policy_type: PolicyType
  insurer: string | null
  policy_number: string | null
  coverage_type: CoverageType | null
  start_date: string
  end_date: string
  cost: number | null
  excess: number | null
  auto_renews: boolean
  policy_holder: string | null
  named_drivers: string[] | null
  includes_courtesy_car: boolean
  includes_breakdown: boolean
  includes_legal_cover: boolean
  includes_personal_accident: boolean
  includes_windscreen: boolean
  includes_european_cover: boolean
  includes_no_claims_protection: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Car', van: 'Van', motorbike: 'Motorbike', scooter: 'Scooter',
  truck: 'Truck', motorhome: 'Motorhome', caravan: 'Caravan', other: 'Other'
}

export const VEHICLE_TYPE_ICONS: Record<VehicleType, string> = {
  car: '🚗', van: '🚐', motorbike: '🏍', scooter: '🛵',
  truck: '🚛', motorhome: '🚌', caravan: '🚎', other: '🚘'
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  full: 'Full service', interim: 'Interim service', major: 'Major service', other: 'Other'
}

export const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  insurance: 'Insurance', breakdown: 'Breakdown cover', warranty: 'Warranty', other: 'Other'
}

export const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  third_party: 'Third party', third_party_fire_theft: 'Third party, fire & theft',
  comprehensive: 'Comprehensive', other: 'Other'
}

export function formatReg(reg: string): string {
  return reg.toUpperCase().replace(/\s+/g, ' ').trim()
}

export function isExpiringSoon(dateStr: string, days = 30): boolean {
  const expiry = new Date(dateStr)
  const soon = new Date()
  soon.setDate(soon.getDate() + days)
  return expiry <= soon && expiry >= new Date()
}

export function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}

export interface VehicleTax {
  id: string
  vehicle_id: string
  user_id: string
  duration: '6_months' | '12_months'
  start_date: string
  expiry_date: string
  cost: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const TAX_DURATION_LABELS: Record<string, string> = {
  '6_months': '6 months',
  '12_months': '12 months',
}
