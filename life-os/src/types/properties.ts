export type PropertyType =
  | 'detached_house'
  | 'semi_detached_house'
  | 'terraced_house'
  | 'bungalow'
  | 'flat'
  | 'maisonette'
  | 'cottage'
  | 'farmhouse'
  | 'other'

export interface Property {
  id: string
  user_id: string
  name: string
  property_type: PropertyType
  year_built: number | null
  is_primary_residence: boolean
  photo_url: string | null
  address_line1: string | null
  address_line2: string | null
  address_town: string | null
  address_city: string | null
  address_postcode: string | null
  address_country: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  detached_house: 'Detached house',
  semi_detached_house: 'Semi-detached house',
  terraced_house: 'Terraced house',
  bungalow: 'Bungalow',
  flat: 'Flat',
  maisonette: 'Maisonette',
  cottage: 'Cottage',
  farmhouse: 'Farmhouse',
  other: 'Other',
}

export const PROPERTY_TYPE_ICONS: Record<PropertyType, string> = {
  detached_house: '🏠',
  semi_detached_house: '🏠',
  terraced_house: '🏘',
  bungalow: '🏡',
  flat: '🏢',
  maisonette: '🏢',
  cottage: '🏡',
  farmhouse: '🏚',
  other: '🏗',
}

export interface PropertyPurchase {
  id: string
  property_id: string
  user_id: string
  is_owned: boolean
  purchase_date: string | null
  purchase_price: number | null
  conveyancer_firm: string | null
  conveyancer_contact: string | null
  conveyancer_phone: string | null
  conveyancer_email: string | null
  estate_agent_firm: string | null
  estate_agent_contact: string | null
  estate_agent_phone: string | null
  estate_agent_email: string | null
  created_at: string
  updated_at: string
}

export type MortgageProductType =
  | 'fixed_2yr'
  | 'fixed_5yr'
  | 'fixed_10yr'
  | 'tracker'
  | 'variable'
  | 'discount'
  | 'svr'
  | 'other'

export const MORTGAGE_PRODUCT_LABELS: Record<MortgageProductType, string> = {
  fixed_2yr: 'Fixed (2 year)',
  fixed_5yr: 'Fixed (5 year)',
  fixed_10yr: 'Fixed (10 year)',
  tracker: 'Tracker',
  variable: 'Variable rate',
  discount: 'Discount',
  svr: 'Standard Variable Rate',
  other: 'Other',
}

export interface PropertyMortgage {
  id: string
  property_id: string
  user_id: string
  lender: string
  product_type: MortgageProductType | null
  interest_rate: number | null
  monthly_payment: number | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type UtilityType = 'electricity' | 'gas' | 'water' | 'internet'

export const UTILITY_TYPE_LABELS: Record<UtilityType, string> = {
  electricity: 'Electricity',
  gas: 'Gas',
  water: 'Water',
  internet: 'Internet',
}

export const UTILITY_TYPE_ICONS: Record<UtilityType, string> = {
  electricity: '⚡',
  gas: '🔥',
  water: '💧',
  internet: '📶',
}

export interface PropertyUtility {
  id: string
  property_id: string
  user_id: string
  utility_type: UtilityType
  provider: string
  notes: string | null
  created_at: string
  updated_at: string
}

export const COUNCIL_TAX_BANDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
export type CouncilTaxBand = typeof COUNCIL_TAX_BANDS[number]

export interface PropertyCouncilTax {
  id: string
  property_id: string
  user_id: string
  council_name: string
  band: CouncilTaxBand
  period_start: string | null
  period_end: string | null
  annual_charge: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type AssetType =
  | 'fridge' | 'freezer' | 'dishwasher' | 'washing_machine' | 'tumble_dryer'
  | 'boiler' | 'ev_charger' | 'tv' | 'speaker' | 'oven' | 'hob' | 'grill'
  | 'microwave' | 'slow_cooker' | 'game_system' | 'other'

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  fridge: 'Fridge',
  freezer: 'Freezer',
  dishwasher: 'Dishwasher',
  washing_machine: 'Washing Machine',
  tumble_dryer: 'Tumble Dryer',
  boiler: 'Boiler',
  ev_charger: 'EV Charger',
  tv: 'TV',
  speaker: 'Speaker',
  oven: 'Oven',
  hob: 'Hob',
  grill: 'Grill',
  microwave: 'Microwave',
  slow_cooker: 'Slow Cooker',
  game_system: 'Game System',
  other: 'Other',
}

export const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  fridge: '❄️',
  freezer: '🧊',
  dishwasher: '🫧',
  washing_machine: '🌀',
  tumble_dryer: '💨',
  boiler: '🔥',
  ev_charger: '⚡',
  tv: '📺',
  speaker: '🔊',
  oven: '🍳',
  hob: '🍳',
  grill: '🥩',
  microwave: '📡',
  slow_cooker: '🥘',
  game_system: '🎮',
  other: '📦',
}

export interface PropertyAsset {
  id: string
  property_id: string
  user_id: string
  name: string
  asset_type: AssetType
  make: string | null
  model: string | null
  purchase_date: string | null
  serial_number: string | null
  created_at: string
  updated_at: string
}

export interface AssetNote {
  id: string
  asset_id: string
  property_id: string
  user_id: string
  note: string
  created_at: string
}

export function formatAddress(p: Property): string {
  return [p.address_line1, p.address_line2, p.address_town, p.address_city, p.address_postcode]
    .filter(Boolean)
    .join(', ')
}
