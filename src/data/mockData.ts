import type { LogisticsRun, Product, Scheme, TraceLot } from '../types'

export const products: Product[] = [
  {
    id: 'P-101',
    name: 'Organic Ragi Grain',
    category: 'grain',
    origin: 'Tumakuru, Karnataka',
    seller: 'Sree Anna SHG Collective',
    quantityKg: 1800,
    pricePerKg: 43,
    qualityScore: 91,
    certified: true,
  },
  {
    id: 'P-102',
    name: 'Bajra Flour (Stone Milled)',
    category: 'flour',
    origin: 'Barmer, Rajasthan',
    seller: 'Maru Farmer Producer Company',
    quantityKg: 950,
    pricePerKg: 56,
    qualityScore: 88,
    certified: true,
  },
  {
    id: 'P-103',
    name: 'Foxtail Millet Seeds',
    category: 'seed',
    origin: 'Anantapur, Andhra Pradesh',
    seller: 'Rayalaseema Millet Farmers',
    quantityKg: 420,
    pricePerKg: 72,
    qualityScore: 86,
    certified: false,
  },
  {
    id: 'P-104',
    name: 'Jowar Nutrition Snack Mix',
    category: 'snack',
    origin: 'Nagpur, Maharashtra',
    seller: 'MilletSpark Foods Pvt Ltd',
    quantityKg: 610,
    pricePerKg: 135,
    qualityScore: 93,
    certified: true,
  },
]

export const traceLots: TraceLot[] = [
  {
    lotId: 'LOT-RG-2026-011',
    productName: 'Organic Ragi Grain',
    fpo: 'Tumakuru Millet FPO',
    events: [
      {
        date: '2026-01-12',
        stage: 'Farm Harvest',
        detail: 'Harvested by 23 smallholder farmers; moisture 11.8%.',
      },
      {
        date: '2026-01-14',
        stage: 'Quality Lab',
        detail: 'Aflatoxin and pesticide panel passed; grade A certified.',
      },
      {
        date: '2026-01-15',
        stage: 'Aggregation Center',
        detail: 'Packed in 30 kg sacks with lot-level QR labels.',
      },
      {
        date: '2026-01-18',
        stage: 'Processor Intake',
        detail: 'Received by Bengaluru processing unit and weighed digitally.',
      },
    ],
  },
  {
    lotId: 'LOT-BJ-2026-004',
    productName: 'Bajra Flour (Stone Milled)',
    fpo: 'Maru Farmer Producer Company',
    events: [
      {
        date: '2026-02-02',
        stage: 'Farmer Delivery',
        detail: 'Batch from 14 SHG-linked farms received at FPO warehouse.',
      },
      {
        date: '2026-02-03',
        stage: 'Milling',
        detail: 'Low-heat stone milling completed; micronutrients preserved.',
      },
      {
        date: '2026-02-04',
        stage: 'Packaging',
        detail: 'Retail and B2B packs sealed; shelf-life labels generated.',
      },
      {
        date: '2026-02-05',
        stage: 'Dispatch',
        detail: 'Dispatched to Jaipur and Delhi hubs with e-way bill.',
      },
    ],
  },
]

export const logisticsRuns: LogisticsRun[] = [
  {
    runId: 'RUN-7782',
    from: 'Tumakuru Aggregation Hub',
    to: 'Bengaluru Processor Park',
    status: 'in_transit',
    etaHours: 6,
  },
  {
    runId: 'RUN-7787',
    from: 'Barmer FPO Yard',
    to: 'Jaipur Wholesale Market',
    status: 'queued',
    etaHours: 14,
  },
  {
    runId: 'RUN-7791',
    from: 'Nagpur Processing Unit',
    to: 'Pune Retail Cluster',
    status: 'delivered',
    etaHours: 0,
  },
]

export const schemes: Scheme[] = [
  {
    id: 'SC-1',
    name: 'Millet Mission Input Support',
    benefit: 'Seed subsidy and soil testing reimbursement up to 60%.',
    eligibility: 'Registered farmer/FPO with geo-tagged land record.',
    link: 'https://agriwelfare.gov.in/',
  },
  {
    id: 'SC-2',
    name: 'PMFME Millet Processing Grant',
    benefit: 'Credit-linked grant for micro food processing enterprises.',
    eligibility: 'SHG/startup with approved DPR and bank sanction.',
    link: 'https://pmfme.mofpi.gov.in/',
  },
  {
    id: 'SC-3',
    name: 'eNAM Market Link Enablement',
    benefit: 'Digital onboarding and assaying support for market access.',
    eligibility: 'FPOs and processors trading notified commodities.',
    link: 'https://www.enam.gov.in/',
  },
]
