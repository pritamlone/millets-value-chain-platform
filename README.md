# Millets Value Chain Platform (SIH 2025 - Problem ID 25265)

This project is a working MVP for the Smart India Hackathon problem statement **"Millets Value Chain Platform"**.

## 1) Problem Understanding

The statement asks for a digital platform that connects all key actors in the millet ecosystem:

- Farmers and SHGs that produce millet
- FPOs that aggregate and certify produce
- Processors/startups that convert raw produce into value-added products
- Buyers/consumers that need transparent sourcing and fair pricing
- Government ecosystem for schemes, subsidies, and certifications

Key pain points from the statement:

- Farmers struggle to access fair markets
- Buyers/processors struggle to discover trustworthy supply
- Weak integration across procurement, quality, logistics, and payments
- Limited consumer visibility and traceability
- Need for multilingual and low-connectivity usability in rural contexts

## 2) What This MVP Implements

This prototype focuses on the core modules expected in the hackathon brief:

- **Account system** (register/login/logout) for all users
- **Role-aware commerce flow**:
  - Seller roles (`Farmer`, `FPO/SHG`, `Processor`) can publish listings
  - Buyer roles can purchase listings and update stock in real time
- **Order activity ledger** for recent completed trades
- **Live market feed** with dynamic price/stock updates (mandi-style simulation)
- **Role-based view switcher** (`Farmer`, `FPO/SHG`, `Processor`, `Buyer`, `Consumer`)
- **Digital marketplace** for millet products with quality filtering
- **Farm-to-fork traceability timeline** with lot-wise events
- **Logistics coordination panel** for shipment status and ETA
- **Government scheme module** with benefit + eligibility + portal links
- **Multilingual UX** with all requested languages in selector:
  Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, Assamese, Maithili, Santali, Kashmiri, Nepali, Sindhi, Dogri, Konkani, Meitei, Bodo, English, Sanskrit
- **Low-connectivity support concept** via offline order queue and manual sync

## 3) Tech Stack

- React 19
- TypeScript
- Vite
- Pure CSS (responsive layout)

## 4) Run Locally

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## 5) Folder Structure

- `src/App.tsx` - Main UI and module composition
- `src/data/mockData.ts` - Marketplace, traceability, logistics, scheme sample data
- `src/types.ts` - Shared domain models
- `src/i18n.ts` - Language copy (English/Hindi)
- `src/App.css` - Component styles and responsive layout

## 6) Next Steps for Full Production Version

- Authentication and role-based access control
- Real backend APIs + database
- UPI/payment gateway integration
- QR scan + IoT quality feeds for live traceability
- Geo-routing and transport partner integrations
- Notification engine (SMS/WhatsApp) for rural onboarding
- Advanced analytics for policy and demand forecasting
