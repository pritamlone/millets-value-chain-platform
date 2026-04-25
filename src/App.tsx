import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import './App.css'
import { products, schemes, traceLots } from './data/mockData'
import { copyByLang, languageOptions } from './i18n'
import type { Lang, OfflineOrder, Role } from './types'

const roles: Role[] = ['farmer', 'fpo', 'processor', 'buyer', 'consumer']
const sellerRoles: Role[] = ['farmer', 'fpo', 'processor']

const accountsKey = 'mvcp.accounts.v1'
const sessionKey = 'mvcp.session.v1'
const sessionTempKey = 'mvcp.session.temp.v1'
const listingsKey = 'mvcp.listings.v1'
const ordersKey = 'mvcp.orders.v1'

type AuthMode = 'login' | 'register'
type AppPage = 'home' | 'auth' | 'market' | 'commerce' | 'ecosystem' | 'why'
type MarketView = 'table' | 'graph' | 'standing' | 'circle' | 'cards'

interface UserAccount {
  id: string
  name: string
  email: string
  password: string
  role: Role
  createdAt: string
}

interface Listing {
  id: string
  name: string
  seller: string
  origin: string
  quantityKg: number
  pricePerKg: number
  qualityScore: number
  certified: boolean
  ownerUserId?: string
}

interface OrderRecord {
  id: string
  listingId: string
  productName: string
  buyerName: string
  sellerName: string
  quantityKg: number
  pricePerKg: number
  total: number
  createdAt: string
}

interface LiveMarketRow {
  id: string
  commodity: string
  mandi: string
  stockKg: number
  pricePerKg: number
  changePct: number
}

const initialListings: Listing[] = products.map((item) => ({
  id: item.id,
  name: item.name,
  seller: item.seller,
  origin: item.origin,
  quantityKg: item.quantityKg,
  pricePerKg: item.pricePerKg,
  qualityScore: item.qualityScore,
  certified: item.certified,
}))

const initialLiveMarket: LiveMarketRow[] = [
  { id: 'MKT-1', commodity: 'Ragi', mandi: 'Tumakuru', stockKg: 22000, pricePerKg: 42, changePct: 0 },
  { id: 'MKT-2', commodity: 'Bajra', mandi: 'Jaipur', stockKg: 18000, pricePerKg: 39, changePct: 0 },
  { id: 'MKT-3', commodity: 'Jowar', mandi: 'Nagpur', stockKg: 19500, pricePerKg: 36, changePct: 0 },
  { id: 'MKT-4', commodity: 'Foxtail Millet', mandi: 'Anantapur', stockKg: 8400, pricePerKg: 71, changePct: 0 },
]

const commerceProductOptions = [
  'Ragi Grain',
  'Bajra Flour',
  'Jowar Whole',
  'Foxtail Millet',
  'Barnyard Millet',
  'Proso Millet',
  'Kodo Millet',
  'Millet Snack Mix',
  'Custom...',
]

const commerceOriginOptions = [
  'Tumakuru, Karnataka',
  'Jaipur, Rajasthan',
  'Nagpur, Maharashtra',
  'Anantapur, Andhra Pradesh',
  'Coimbatore, Tamil Nadu',
  'Pune, Maharashtra',
  'Hyderabad, Telangana',
  'Custom...',
]

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function loadSessionUserId(): string | null {
  try {
    const persistent = localStorage.getItem(sessionKey)
    if (persistent) return JSON.parse(persistent) as string
    const temporary = sessionStorage.getItem(sessionTempKey)
    if (temporary) return JSON.parse(temporary) as string
    return null
  } catch {
    return null
  }
}

function persistSession(userId: string | null, keepLoggedIn: boolean) {
  if (!userId) {
    localStorage.removeItem(sessionKey)
    sessionStorage.removeItem(sessionTempKey)
    return
  }

  if (keepLoggedIn) {
    localStorage.setItem(sessionKey, JSON.stringify(userId))
    sessionStorage.removeItem(sessionTempKey)
  } else {
    sessionStorage.setItem(sessionTempKey, JSON.stringify(userId))
    localStorage.removeItem(sessionKey)
  }
}

function makeId(prefix: string) {
  const uid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
  return `${prefix}-${uid}`
}

function pathToPage(path: string): AppPage {
  if (path === '/auth') return 'auth'
  if (path === '/market-intelligence') return 'market'
  if (path === '/commerce') return 'commerce'
  if (path === '/ecosystem-support') return 'ecosystem'
  if (path === '/why-millets') return 'why'
  return 'home'
}

function pageToPath(page: AppPage): string {
  if (page === 'auth') return '/auth'
  if (page === 'market') return '/market-intelligence'
  if (page === 'commerce') return '/commerce'
  if (page === 'ecosystem') return '/ecosystem-support'
  if (page === 'why') return '/why-millets'
  return '/'
}

function getAuthModeFromUrl(): AuthMode {
  const params = new URLSearchParams(window.location.search)
  return params.get('mode') === 'login' ? 'login' : 'register'
}

function App() {
  const [page, setPage] = useState<AppPage>(() => pathToPage(window.location.pathname))
  const [lang, setLang] = useState<Lang>('en')
  const [role, setRole] = useState<Role>('buyer')
  const [minQuality, setMinQuality] = useState<number>(85)
  const [selectedLot, setSelectedLot] = useState<string>(traceLots[0]?.lotId ?? '')
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? '')
  const [offlineCustomProduct, setOfflineCustomProduct] = useState('')
  const [orderQty, setOrderQty] = useState<number>(50)
  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>([])

  const [authMode, setAuthMode] = useState<AuthMode>(() => getAuthModeFromUrl())
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [roleInput, setRoleInput] = useState<Role>('farmer')
  const [authNotice, setAuthNotice] = useState('')

  const [accounts, setAccounts] = useState<UserAccount[]>(() => loadJson<UserAccount[]>(accountsKey, []))
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => loadSessionUserId())
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [listings, setListings] = useState<Listing[]>(() => {
    const saved = loadJson<Listing[]>(listingsKey, [])
    return saved.length ? saved : initialListings
  })
  const [orders, setOrders] = useState<OrderRecord[]>(() => loadJson<OrderRecord[]>(ordersKey, []))

  const [listingName, setListingName] = useState('')
  const [listingOrigin, setListingOrigin] = useState('')
  const [listingNameOption, setListingNameOption] = useState(commerceProductOptions[0])
  const [listingOriginOption, setListingOriginOption] = useState(commerceOriginOptions[0])
  const [listingQty, setListingQty] = useState(200)
  const [listingPrice, setListingPrice] = useState(40)
  const [listingQuality, setListingQuality] = useState(86)
  const [listingCertified, setListingCertified] = useState(true)
  const [tradeNotice, setTradeNotice] = useState('')

  const [buyQtyMap, setBuyQtyMap] = useState<Record<string, number>>({})
  const [liveMarket, setLiveMarket] = useState<LiveMarketRow[]>(initialLiveMarket)
  const [marketView, setMarketView] = useState<MarketView>('table')

  const copy = copyByLang[lang]

  useEffect(() => {
    const onPop = () => {
      setPage(pathToPage(window.location.pathname))
      setAuthMode(getAuthModeFromUrl())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    localStorage.setItem(accountsKey, JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem(listingsKey, JSON.stringify(listings))
  }, [listings])

  useEffect(() => {
    localStorage.setItem(ordersKey, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMarket((prev) =>
        prev.map((row) => {
          const drift = (Math.random() - 0.5) * 2.4
          const nextPrice = Math.max(10, Number((row.pricePerKg * (1 + drift / 100)).toFixed(2)))
          const stockMove = Math.floor((Math.random() - 0.5) * 1200)
          return {
            ...row,
            pricePerKg: nextPrice,
            stockKg: Math.max(100, row.stockKg + stockMove),
            changePct: Number(drift.toFixed(2)),
          }
        }),
      )
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const currentUser = useMemo(
    () => accounts.find((account) => account.id === sessionUserId) ?? null,
    [accounts, sessionUserId],
  )

  useEffect(() => {
    if (currentUser) setRole(currentUser.role)
  }, [currentUser])

  const canSell = currentUser ? sellerRoles.includes(currentUser.role) : false

  const filteredListings = useMemo(
    () => listings.filter((item) => item.qualityScore >= minQuality),
    [listings, minQuality],
  )

  const selectedTrace = useMemo(
    () => traceLots.find((lot) => lot.lotId === selectedLot) ?? traceLots[0],
    [selectedLot],
  )

  const totalStock = filteredListings.reduce((sum, p) => sum + p.quantityKg, 0)
  const avgPrice =
    filteredListings.length > 0
      ? Math.round(filteredListings.reduce((sum, p) => sum + p.pricePerKg, 0) / filteredListings.length)
      : 0
  const maxMarketPrice = Math.max(...liveMarket.map((row) => row.pricePerKg), 1)
  const maxMarketStock = Math.max(...liveMarket.map((row) => row.stockKg), 1)
  const totalMarketStock = liveMarket.reduce((sum, row) => sum + row.stockKg, 0)

  const navigate = (nextPage: AppPage, mode?: AuthMode) => {
    const base = pageToPath(nextPage)
    const url = nextPage === 'auth' ? `${base}?mode=${mode ?? authMode}` : base
    window.history.pushState({}, '', url)
    setPage(nextPage)
    if (nextPage === 'auth' && mode) setAuthMode(mode)
  }

  const setAuthModeInRoute = (mode: AuthMode) => {
    setAuthMode(mode)
    window.history.replaceState({}, '', `/auth?mode=${mode}`)
  }

  const queueOrder = () => {
    const targetProduct = selectedProductId === '__custom__' ? offlineCustomProduct.trim() : selectedProductId
    if (!targetProduct || orderQty <= 0) return

    setOfflineOrders((prev) => [
      {
        productId: targetProduct,
        quantityKg: orderQty,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const syncOrders = () => {
    setOfflineOrders([])
  }

  const submitRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nameInput.trim() || !emailInput.trim() || !passwordInput) {
      setAuthNotice('Please fill name, email, and password to create account.')
      return
    }
    if (accounts.some((item) => item.email.toLowerCase() === emailInput.trim().toLowerCase())) {
      setAuthNotice('Email already exists. Please login instead.')
      return
    }

    const account: UserAccount = {
      id: makeId('USR'),
      name: nameInput.trim(),
      email: emailInput.trim().toLowerCase(),
      password: passwordInput,
      role: roleInput,
      createdAt: new Date().toISOString(),
    }

    setAccounts((prev) => [account, ...prev])
    setSessionUserId(account.id)
    persistSession(account.id, true)
    setAuthNotice(`Account created. Welcome, ${account.name}.`)
    setPasswordInput('')
    navigate('home')
  }

  const submitLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const match = accounts.find(
      (item) =>
        item.email.toLowerCase() === emailInput.trim().toLowerCase() &&
        item.password === passwordInput,
    )

    if (!match) {
      setAuthNotice('Invalid email or password.')
      return
    }

    setSessionUserId(match.id)
    persistSession(match.id, keepLoggedIn)
    setAuthNotice(`Logged in as ${match.name}.`)
    setPasswordInput('')
    navigate('home')
  }

  const createListing = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentUser) {
      setTradeNotice('Please login first to create a listing.')
      return
    }
    if (!canSell) {
      setTradeNotice('Your account role can buy but cannot create seller listings.')
      return
    }
    const finalListingName =
      listingNameOption === 'Custom...' ? listingName.trim() : listingNameOption
    const finalListingOrigin =
      listingOriginOption === 'Custom...' ? listingOrigin.trim() : listingOriginOption

    if (!finalListingName || !finalListingOrigin || listingQty <= 0 || listingPrice <= 0) {
      setTradeNotice('Fill product name, origin, quantity and price to publish listing.')
      return
    }

    const item: Listing = {
      id: makeId('LST'),
      name: finalListingName,
      seller: currentUser.name,
      origin: finalListingOrigin,
      quantityKg: listingQty,
      pricePerKg: listingPrice,
      qualityScore: listingQuality,
      certified: listingCertified,
      ownerUserId: currentUser.id,
    }

    setListings((prev) => [item, ...prev])
    setListingName('')
    setListingOrigin('')
    setListingNameOption(commerceProductOptions[0])
    setListingOriginOption(commerceOriginOptions[0])
    setListingQty(200)
    setListingPrice(40)
    setListingQuality(86)
    setListingCertified(true)
    setTradeNotice('Listing published successfully.')
  }

  const buyListing = (listingId: string) => {
    if (!currentUser) {
      setTradeNotice('Please login to buy.')
      return
    }

    const quantity = buyQtyMap[listingId] ?? 25
    if (quantity <= 0) {
      setTradeNotice('Purchase quantity must be at least 1 kg.')
      return
    }

    const target = listings.find((item) => item.id === listingId)
    if (!target) {
      setTradeNotice('Listing not found.')
      return
    }

    if (target.quantityKg < quantity) {
      setTradeNotice('Not enough stock for this order quantity.')
      return
    }

    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId ? { ...item, quantityKg: item.quantityKg - quantity } : item,
      ),
    )

    const order: OrderRecord = {
      id: makeId('ORD'),
      listingId,
      productName: target.name,
      buyerName: currentUser.name,
      sellerName: target.seller,
      quantityKg: quantity,
      pricePerKg: target.pricePerKg,
      total: quantity * target.pricePerKg,
      createdAt: new Date().toISOString(),
    }

    setOrders((prev) => [order, ...prev])
    setTradeNotice(`Order placed: ${quantity} kg of ${target.name}.`)
  }

  const sectionTabs: Array<{ id: AppPage; label: string }> = [
    { id: 'market', label: 'Market Intelligence' },
    { id: 'commerce', label: 'Commerce' },
    { id: 'ecosystem', label: 'Ecosystem Support' },
    { id: 'why', label: 'Why Millets' },
  ]

  return (
    <div className="app-shell">
      <div className="top-nav">
        <button type="button" className="link-btn" onClick={() => navigate('home')}>
          Home
        </button>
        {!currentUser ? (
          <>
            <button type="button" className="auth-btn login" onClick={() => navigate('auth', 'login')}>
              Login
            </button>
            <button type="button" className="auth-btn signup" onClick={() => navigate('auth', 'register')}>
              Sign up
            </button>
          </>
        ) : (
          <>
            <span className="user-pill">{currentUser.name}</span>
            <button
              type="button"
              className="auth-btn login"
              onClick={() => {
                setSessionUserId(null)
                persistSession(null, false)
                setAuthNotice('Logged out successfully.')
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>

      {page !== 'auth' ? (
        <>
          <header className="hero">
            <div>
              <p className="eyebrow">SIH 2025 • ID 25265</p>
              <h1>{copy.appTitle}</h1>
              <p className="subtitle">{copy.appSubtitle}</p>
              <p className="summary">{copy.explanation}</p>
            </div>

            <div className="controls">
              <label>
                {copy.language}
                <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.personaLabel}
                <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {roles.map((value) => (
                    <option key={value} value={value}>
                      {copy.roleNames[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.minQuality}: {minQuality}
                <input
                  type="range"
                  min={70}
                  max={98}
                  value={minQuality}
                  onChange={(e) => setMinQuality(Number(e.target.value))}
                />
              </label>
            </div>
          </header>

          <section className="section-tabbar">
            {sectionTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${page === tab.id ? 'active' : ''}`}
                onClick={() => navigate(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </section>
        </>
      ) : null}

      {page === 'home' ? (
        <section className="card home-hub">
          <h2>Section Hub</h2>
          <p className="hint">Open a focused page for cleaner workflow.</p>
          <div className="hub-grid">
            <button type="button" className="hub-card" onClick={() => navigate('market')}>
              <h3>Market Intelligence</h3>
              <p>Live feed and KPI indicators.</p>
            </button>
            <button type="button" className="hub-card" onClick={() => navigate('commerce')}>
              <h3>Commerce</h3>
              <p>Listings, buying flow, and order activity.</p>
            </button>
            <button type="button" className="hub-card" onClick={() => navigate('ecosystem')}>
              <h3>Ecosystem Support</h3>
              <p>Traceability, schemes, and offline queue.</p>
            </button>
            <button type="button" className="hub-card" onClick={() => navigate('why')}>
              <h3>Why Millets</h3>
              <p>Health benefits, varieties, and awareness insights.</p>
            </button>
          </div>
        </section>
      ) : null}

      {page === 'auth' ? (
        <section className="card auth-page">
          <h2>Account Access</h2>
          <p className="hint">Create account or login. Switch between both instantly.</p>
          <div className="auth-switch">
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthModeInRoute('register')}
            >
              Sign up
            </button>
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthModeInRoute('login')}
            >
              Login
            </button>
          </div>
          <form onSubmit={authMode === 'register' ? submitRegister : submitLogin} className="auth-form">
            {authMode === 'register' ? (
              <label>
                Full Name
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              </label>
            ) : null}
            <label>
              Email
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </label>
            {authMode === 'login' ? (
              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                />
                Keep me logged in on this device
              </label>
            ) : null}
            {authMode === 'register' ? (
              <label>
                Account Role
                <select value={roleInput} onChange={(e) => setRoleInput(e.target.value as Role)}>
                  {roles.map((value) => (
                    <option key={value} value={value}>
                      {copy.roleNames[value]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button type="submit">{authMode === 'register' ? 'Create Account' : 'Login'}</button>
            <button type="button" className="secondary" onClick={() => navigate('home')}>
              Back to Home
            </button>
          </form>
          {authNotice ? <p className="notice">{authNotice}</p> : null}
        </section>
      ) : null}

      {page === 'market' ? (
        <section className="page-section">
          <div className="section-head">
            <h3 className="section-title">Market Intelligence Page</h3>
            <p className="section-subtitle">Price movement, stock visibility, and high-level indicators.</p>
          </div>
          <main className="layout-grid ecom-grid">
            <section className="card">
              <h2>Live Market Feed</h2>
              <p className="scope-note">
                Scope: India pilot feed (selected mandis across multiple states). This is a simulated demo dataset,
                not a full all-India or global market index yet.
              </p>
              <div className="view-switch">
                <button type="button" className={marketView === 'table' ? 'active' : ''} onClick={() => setMarketView('table')}>
                  Table
                </button>
                <button type="button" className={marketView === 'graph' ? 'active' : ''} onClick={() => setMarketView('graph')}>
                  Graph
                </button>
                <button type="button" className={marketView === 'standing' ? 'active' : ''} onClick={() => setMarketView('standing')}>
                  Standing
                </button>
                <button type="button" className={marketView === 'circle' ? 'active' : ''} onClick={() => setMarketView('circle')}>
                  Circle
                </button>
                <button type="button" className={marketView === 'cards' ? 'active' : ''} onClick={() => setMarketView('cards')}>
                  Cards
                </button>
              </div>

              {marketView === 'table' ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Commodity</th>
                        <th>Mandi</th>
                        <th>Price/kg</th>
                        <th>Stock (kg)</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveMarket.map((row) => (
                        <tr key={row.id}>
                          <td>{row.commodity}</td>
                          <td>{row.mandi}</td>
                          <td>Rs {row.pricePerKg.toFixed(2)}</td>
                          <td>{row.stockKg}</td>
                          <td className={row.changePct >= 0 ? 'up' : 'down'}>
                            {row.changePct >= 0 ? '+' : ''}
                            {row.changePct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {marketView === 'graph' ? (
                <div className="market-graph">
                  {liveMarket.map((row) => (
                    <article key={`bar-${row.id}`} className="graph-row">
                      <div className="graph-label">
                        <strong>{row.commodity}</strong>
                        <span>{row.mandi}</span>
                      </div>
                      <div className="bar-stack">
                        <div className="bar-track">
                          <div
                            className="bar-fill price"
                            style={{ width: `${(row.pricePerKg / maxMarketPrice) * 100}%` }}
                          />
                        </div>
                        <small>Price Rs {row.pricePerKg.toFixed(2)}</small>
                        <div className="bar-track">
                          <div
                            className="bar-fill stock"
                            style={{ width: `${(row.stockKg / maxMarketStock) * 100}%` }}
                          />
                        </div>
                        <small>Stock {row.stockKg} kg</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {marketView === 'standing' ? (
                <div className="standing-graph">
                  {liveMarket.map((row) => (
                    <article key={`standing-${row.id}`} className="standing-item">
                      <div className="standing-bars">
                        <div className="standing-bar-wrap">
                          <div
                            className="standing-bar price"
                            style={{ height: `${(row.pricePerKg / maxMarketPrice) * 100}%` }}
                            title={`Price Rs ${row.pricePerKg.toFixed(2)}/kg`}
                          />
                        </div>
                        <div className="standing-bar-wrap">
                          <div
                            className="standing-bar stock"
                            style={{ height: `${(row.stockKg / maxMarketStock) * 100}%` }}
                            title={`Stock ${row.stockKg} kg`}
                          />
                        </div>
                      </div>
                      <p className="standing-label">{row.commodity}</p>
                      <small className="standing-meta">
                        Rs {row.pricePerKg.toFixed(2)} • {row.stockKg} kg
                      </small>
                    </article>
                  ))}
                  <div className="standing-legend">
                    <span><i className="legend-dot price" /> Price</span>
                    <span><i className="legend-dot stock" /> Stock</span>
                  </div>
                </div>
              ) : null}

              {marketView === 'circle' ? (
                <div className="circle-grid">
                  {liveMarket.map((row) => {
                    const share = totalMarketStock > 0 ? (row.stockKg / totalMarketStock) * 100 : 0
                    return (
                      <article key={`circle-${row.id}`} className="circle-card">
                        <div
                          className="donut"
                          style={
                            {
                              '--value': `${share}%`,
                            } as CSSProperties
                          }
                        >
                          <span>{share.toFixed(1)}%</span>
                        </div>
                        <h4>{row.commodity}</h4>
                        <p>{row.mandi}</p>
                        <small>{row.stockKg} kg of total market stock</small>
                      </article>
                    )
                  })}
                </div>
              ) : null}

              {marketView === 'cards' ? (
                <div className="market-cards">
                  {liveMarket.map((row) => (
                    <article key={`card-${row.id}`} className="market-card">
                      <div>
                        <h4>{row.commodity}</h4>
                        <p>{row.mandi}</p>
                      </div>
                      <p>Rs {row.pricePerKg.toFixed(2)}/kg</p>
                      <p>{row.stockKg} kg</p>
                      <p className={row.changePct >= 0 ? 'up' : 'down'}>
                        {row.changePct >= 0 ? '+' : ''}
                        {row.changePct}%
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
            <section className="card">
              <h2>{copy.kpiTitle}</h2>
              <section className="kpi-grid compact">
                <article>
                  <h3>{copy.kpiTitle}</h3>
                  <p className="kpi">{filteredListings.length}</p>
                  <small>{copy.activeProductLots}</small>
                </article>
                <article>
                  <h3>{copy.stock}</h3>
                  <p className="kpi">{totalStock} kg</p>
                  <small>{copy.visibleAtCurrentFilter}</small>
                </article>
                <article>
                  <h3>{copy.price}</h3>
                  <p className="kpi">Rs {avgPrice}/kg</p>
                  <small>{copy.averageAskingRate}</small>
                </article>
                <article>
                  <h3>{copy.queued}</h3>
                  <p className="kpi">{offlineOrders.length}</p>
                  <small>{copy.pendingSyncRecords}</small>
                </article>
              </section>
            </section>
          </main>
        </section>
      ) : null}

      {page === 'commerce' ? (
        <section className="page-section">
          <div className="section-head">
            <h3 className="section-title">Commerce Page</h3>
            <p className="section-subtitle">List products, place orders, and monitor trade activity.</p>
          </div>
          <main className="layout-grid">
            <section className="card">
              <h2>Seller Listing Console</h2>
              <form className="seller-form" onSubmit={createListing}>
                <label>
                  Product Name
                  <select value={listingNameOption} onChange={(e) => setListingNameOption(e.target.value)}>
                    {commerceProductOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                {listingNameOption === 'Custom...' ? (
                  <label>
                    Custom Product Name
                    <input
                      value={listingName}
                      onChange={(e) => setListingName(e.target.value)}
                      placeholder="Enter custom product name"
                    />
                  </label>
                ) : null}
                <label>
                  Origin
                  <select value={listingOriginOption} onChange={(e) => setListingOriginOption(e.target.value)}>
                    {commerceOriginOptions.map((origin) => (
                      <option key={origin} value={origin}>
                        {origin}
                      </option>
                    ))}
                  </select>
                </label>
                {listingOriginOption === 'Custom...' ? (
                  <label>
                    Custom Origin
                    <input
                      value={listingOrigin}
                      onChange={(e) => setListingOrigin(e.target.value)}
                      placeholder="Enter custom origin"
                    />
                  </label>
                ) : null}
                <label>
                  Quantity (kg)
                  <input
                    type="number"
                    min={1}
                    value={listingQty}
                    onChange={(e) => setListingQty(Number(e.target.value))}
                  />
                </label>
                <label>
                  Price/kg (Rs)
                  <input
                    type="number"
                    min={1}
                    value={listingPrice}
                    onChange={(e) => setListingPrice(Number(e.target.value))}
                  />
                </label>
                <label>
                  Quality Score
                  <input
                    type="number"
                    min={70}
                    max={100}
                    value={listingQuality}
                    onChange={(e) => setListingQuality(Number(e.target.value))}
                  />
                </label>
                <label>
                  Certified
                  <select
                    value={listingCertified ? 'yes' : 'no'}
                    onChange={(e) => setListingCertified(e.target.value === 'yes')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <button type="submit">Publish Listing</button>
              </form>
              <p className="hint">Only farmer/FPO/processor role accounts can publish listings.</p>
              {tradeNotice ? <p className="notice">{tradeNotice}</p> : null}
            </section>

            <section className="card">
              <h2>Order Activity</h2>
              <ul className="order-list">
                {orders.length === 0 ? (
                  <li>No completed trades yet.</li>
                ) : (
                  orders.slice(0, 8).map((entry) => (
                    <li key={entry.id}>
                      <strong>{entry.productName}</strong> • {entry.quantityKg} kg • Rs {entry.total} •{' '}
                      {entry.buyerName} from {entry.sellerName}
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="card wide">
              <h2>{copy.offlineTitle}</h2>
              <div className="offline-controls">
                <label>
                  {copy.product}
                  <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                    {listings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                    <option value="__custom__">Custom...</option>
                  </select>
                </label>
                {selectedProductId === '__custom__' ? (
                  <label>
                    Custom Product
                    <input
                      value={offlineCustomProduct}
                      onChange={(e) => setOfflineCustomProduct(e.target.value)}
                      placeholder="Enter product name"
                    />
                  </label>
                ) : null}
                <label>
                  {copy.quantity}
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Number(e.target.value))}
                  />
                </label>
                <button type="button" onClick={queueOrder}>
                  {copy.createOrder}
                </button>
                <button type="button" className="secondary" onClick={syncOrders}>
                  {copy.syncNow}
                </button>
              </div>
              <ul className="queued-list">
                {offlineOrders.length === 0 ? (
                  <li>{copy.noQueuedRecords}</li>
                ) : (
                  offlineOrders.map((order) => (
                    <li key={`${order.productId}-${order.createdAt}`}>
                      {order.productId} • {order.quantityKg} kg • {new Date(order.createdAt).toLocaleString()}
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="card wide">
              <h2>{copy.marketplaceTitle}</h2>
              <p className="hint">
                {copy.qualityFilter}: {copy.minQuality} {minQuality}
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{copy.product}</th>
                      <th>{copy.seller}</th>
                      <th>{copy.origin}</th>
                      <th>{copy.price}</th>
                      <th>{copy.stock}</th>
                      <th>{copy.certified}</th>
                      <th>Buy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.seller}</td>
                        <td>{item.origin}</td>
                        <td>Rs {item.pricePerKg}/kg</td>
                        <td>{item.quantityKg} kg</td>
                        <td>
                          <span className={item.certified ? 'badge yes' : 'badge no'}>
                            {item.certified ? copy.certified : copy.notCertified}
                          </span>
                        </td>
                        <td>
                          <div className="buy-box">
                            <input
                              type="number"
                              min={1}
                              max={item.quantityKg}
                              value={buyQtyMap[item.id] ?? 25}
                              onChange={(e) =>
                                setBuyQtyMap((prev) => ({
                                  ...prev,
                                  [item.id]: Number(e.target.value),
                                }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() => buyListing(item.id)}
                              disabled={item.quantityKg <= 0}
                            >
                              {item.quantityKg > 0 ? 'Buy' : 'Sold Out'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </section>
      ) : null}

      {page === 'ecosystem' ? (
        <section className="page-section">
          <div className="section-head">
            <h3 className="section-title">Ecosystem Support Page</h3>
            <p className="section-subtitle">Traceability, government linkages, and offline operations.</p>
          </div>
          <main className="layout-grid">
            <section className="card">
              <h2>{copy.traceTitle}</h2>
              <label className="hint">
                {copy.lotLabel}
                <select value={selectedLot} onChange={(e) => setSelectedLot(e.target.value)}>
                  {traceLots.map((lot) => (
                    <option key={lot.lotId} value={lot.lotId}>
                      {lot.lotId} - {lot.productName}
                    </option>
                  ))}
                </select>
              </label>
              <ul className="timeline">
                {selectedTrace.events.map((event) => (
                  <li key={`${selectedTrace.lotId}-${event.date}-${event.stage}`}>
                    <strong>{event.stage}</strong>
                    <span>{event.date}</span>
                    <p>{event.detail}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <h2>{copy.schemesTitle}</h2>
              <div className="scheme-list">
                {schemes.map((scheme) => (
                  <article key={scheme.id} className="scheme-item">
                    <h4>{scheme.name}</h4>
                    <p>{scheme.benefit}</p>
                    <small>{scheme.eligibility}</small>
                    <a href={scheme.link} target="_blank" rel="noreferrer">
                      {copy.openPortal}
                    </a>
                  </article>
                ))}
              </div>
            </section>

          </main>
        </section>
      ) : null}

      {page === 'why' ? (
        <section className="page-section">
          <main className="layout-grid">
            <section className="card wide why-intro">
              <h2>Why Choose Millets?</h2>
              <p>
                Millets are nutrient-dense, high-fibre grains that support better digestion, steady energy, and
                climate-resilient agriculture. They are increasingly relevant for India’s nutrition and lifestyle
                challenges.
              </p>
            </section>

            <section className="card">
              <h2>Core Benefits</h2>
              <ul className="why-list">
                <li>Easy to digest for many people.</li>
                <li>Supports weight management when used in balanced diets.</li>
                <li>May help reduce acidity and gastric discomfort for some users.</li>
                <li>Naturally gluten-free in most millet varieties.</li>
                <li>Low glycemic response helps with blood sugar management.</li>
                <li>Rich in fibre, calcium, protein, and key micronutrients.</li>
              </ul>
            </section>

            <section className="card">
              <h2>Varieties Highlighted</h2>
              <div className="chips-wrap">
                {['Ragi', 'Bajra', 'Jowar', 'Foxtail', 'Barnyard', 'Proso', 'Kodo'].map((name) => (
                  <span key={name} className="chip">
                    {name}
                  </span>
                ))}
              </div>
            </section>

            <section className="card">
              <h2>Nutrition Notes</h2>
              <ul className="why-list">
                <li>Contain both soluble and insoluble fibre.</li>
                <li>Magnesium-rich profiles may support insulin and glucose metabolism pathways.</li>
                <li>Contain phenolic compounds and antioxidants relevant to preventive nutrition research.</li>
                <li>Some references describe millets as alkaline/anti-acidic in dietary patterns.</li>
              </ul>
            </section>

            <section className="card">
              <h2>Awareness Stats (From Shared Visual References)</h2>
              <ul className="why-list">
                <li>11.4% diabetes figure shown in the provided material.</li>
                <li>31 million new diabetes patients in 2019-21 highlighted in reference visual.</li>
                <li>7 out of 10 people facing digestive or gut-health issues shown in survey visual.</li>
                <li>195.9 million undernourished and anemia percentages shown in cited text snapshots.</li>
              </ul>
            </section>

            <section className="card wide disclaimer">
              <h2>Important Note</h2>
              <p>
                This page is an awareness feature for the platform and is not medical advice. Health claims should be
                validated with certified nutritionists, doctors, and primary scientific/ICAR sources before policy or
                clinical use.
              </p>
            </section>
          </main>
        </section>
      ) : null}

      {page !== 'auth' ? (
        <footer>
          <p>
            {copy.loggedInAs} {copy.roleNames[role]}. {copy.footerDetail}
          </p>
        </footer>
      ) : null}
    </div>
  )
}

export default App
