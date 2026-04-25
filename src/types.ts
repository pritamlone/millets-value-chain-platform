export type Role = 'farmer' | 'fpo' | 'processor' | 'buyer' | 'consumer'

export type Lang =
  | 'en'
  | 'hi'
  | 'bn'
  | 'mr'
  | 'te'
  | 'ta'
  | 'gu'
  | 'ur'
  | 'kn'
  | 'or'
  | 'ml'
  | 'pa'
  | 'as'
  | 'mai'
  | 'sat'
  | 'ks'
  | 'ne'
  | 'sd'
  | 'doi'
  | 'kok'
  | 'mni'
  | 'bodo'
  | 'sa'

export type ProductCategory = 'grain' | 'flour' | 'snack' | 'seed'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  origin: string
  seller: string
  quantityKg: number
  pricePerKg: number
  qualityScore: number
  certified: boolean
}

export interface TraceEvent {
  date: string
  stage: string
  detail: string
}

export interface TraceLot {
  lotId: string
  productName: string
  fpo: string
  events: TraceEvent[]
}

export interface LogisticsRun {
  runId: string
  from: string
  to: string
  status: 'queued' | 'in_transit' | 'delivered'
  etaHours: number
}

export interface Scheme {
  id: string
  name: string
  benefit: string
  eligibility: string
  link: string
}

export interface OfflineOrder {
  productId: string
  quantityKg: number
  createdAt: string
}
