import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, InputBase, Paper, Popper, ClickAwayListener, List, ListItemButton, ListItemIcon, ListItemText,
  ListSubheader, Typography, CircularProgress,
} from '@mui/material'
import {
  Search as SearchIcon, ShoppingCart as OrderIcon, People as CustomerIcon, ViewModule as StockIcon,
  Thermostat as HeatIcon, LocalShipping as ShipmentIcon,
} from '@mui/icons-material'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { canAccessPath } from '../../config/roleAccess'
import { searchPages } from '../../config/navigation'

const rowsOf = (data) => (Array.isArray(data) ? data : data?.data || [])

// The records the search looks in. Each is a list the server already filters by branch and role, so
// the search can show nothing a person could not open from the list itself. `page` is where the
// result opens, and a kind whose page the role cannot open is not asked for at all.
const RECORD_KINDS = [
  {
    key: 'orders', title: 'Orders', icon: OrderIcon, page: '/orders', url: (q) => `/orders?search=${q}&view=summary&limit=5`,
    row: (o) => ({ id: o.id, primary: o.orderNumber, secondary: [o.buyer?.name || o.customerName, String(o.status || '').replace(/_/g, ' ').toLowerCase()].filter(Boolean).join(' · '), to: `/orders/${o.id}` }),
  },
  {
    key: 'customers', title: 'Customers', icon: CustomerIcon, page: '/customers', url: (q) => `/customers?search=${q}&limit=5`,
    row: (c) => ({ id: c.id, primary: c.name, secondary: [c.code, c.city, c.state].filter(Boolean).join(' · '), to: `/customers?search=${encodeURIComponent(c.code || c.name)}` }),
  },
  {
    key: 'coils', title: 'Stock', icon: StockIcon, page: '/units', url: (q) => `/coils?search=${q}&limit=5`,
    row: (c) => ({ id: c.id, primary: c.coilNumber, secondary: [c.grade?.name || c.grade?.code, c.location?.name, String(c.status || '').replace(/_/g, ' ').toLowerCase()].filter(Boolean).join(' · '), to: `/units/${c.id}` }),
  },
  {
    key: 'heats', title: 'Heats', icon: HeatIcon, page: '/heats', url: (q) => `/heats?search=${q}&limit=5`,
    row: (h) => ({ id: h.id, primary: h.heatNumber, secondary: [h.grade?.name || h.grade?.code, h.mill?.name].filter(Boolean).join(' · '), to: `/heats/${h.id}` }),
  },
  {
    key: 'shipments', title: 'Shipments', icon: ShipmentIcon, page: '/shipping', url: (q) => `/shipments?search=${q}&limit=5`,
    row: (s) => ({ id: s.id, primary: s.shipmentNumber, secondary: [s.order?.orderNumber, String(s.status || '').replace(/_/g, ' ').toLowerCase()].filter(Boolean).join(' · '), to: `/shipping/${s.id}` }),
  },
]

/**
 * The search in the top bar. It finds pages of the menu by name, and orders, customers, stock, heats
 * and shipments by number or name. Ctrl+K or ⌘K puts the cursor in it from anywhere; the arrow keys
 * move through the results and Enter opens one.
 */
export default function GlobalSearch() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const anchorRef = useRef(null)
  const inputRef = useRef(null)
  const asked = useRef(0)

  // Ctrl+K or ⌘K from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const q = text.trim()
  const pages = useMemo(() => searchPages(q, (path) => canAccessPath(role, path)).slice(0, 6), [q, role])

  // Records: asked for after the person pauses, and an answer to an older question is dropped.
  useEffect(() => {
    if (q.length < 2) { setRecords({}); setLoading(false); setFailed(false); return undefined }
    const mine = asked.current + 1; asked.current = mine
    setLoading(true)
    const timer = setTimeout(async () => {
      const kinds = RECORD_KINDS.filter((k) => canAccessPath(role, k.page))
      const answers = await Promise.all(kinds.map((k) => client.get(k.url(encodeURIComponent(q)))
        .then((r) => ({ key: k.key, rows: rowsOf(r.data).slice(0, 5).map(k.row) }))
        // A list this role may not read answers 403: it has no results here, which is not a failure.
        .catch((e) => ({ key: k.key, rows: [], failed: e?.response?.status !== 403 }))))
      if (asked.current !== mine) return
      setRecords(Object.fromEntries(answers.map((a) => [a.key, a.rows])))
      setFailed(answers.length > 0 && answers.every((a) => a.failed))
      setLoading(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [q, role])

  const groups = useMemo(() => {
    const g = []
    if (pages.length) g.push({ title: 'Pages', rows: pages.map((p) => ({ id: `page:${p.path}`, primary: p.label, secondary: p.section, to: p.path, icon: p.icon })) })
    for (const k of RECORD_KINDS) if (records[k.key]?.length) g.push({ title: k.title, rows: records[k.key].map((r) => ({ ...r, id: `${k.key}:${r.id}`, icon: k.icon })) })
    return g
  }, [pages, records])
  const flat = useMemo(() => groups.flatMap((g) => g.rows), [groups])
  useEffect(() => { setActive(0) }, [q])

  const go = (row) => {
    if (!row) return
    setOpen(false); setText('')
    inputRef.current?.blur()
    navigate(row.to)
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, Math.max(flat.length - 1, 0))) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(flat[active]) }
    else if (e.key === 'Escape') { if (open && q) { e.preventDefault(); setOpen(false) } else { setText(''); inputRef.current?.blur() } }
  }

  const showing = open && q.length >= 2
  const status = !showing ? '' : loading && !flat.length ? 'Searching' : flat.length ? `${flat.length} result${flat.length === 1 ? '' : 's'}` : loading ? 'Searching' : 'Nothing found'
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')
  let index = -1

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box role="search" sx={{ flex: 1, maxWidth: 440, minWidth: 0 }}>
        <Box
          ref={anchorRef}
          sx={{ display: 'flex', alignItems: 'center', bgcolor: 'background.default', borderRadius: 1, px: { xs: 1, sm: 2 }, py: 0.5, border: '1px solid transparent', '&:focus-within': { borderColor: 'primary.main', bgcolor: 'background.paper' } }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            inputRef={inputRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, orders, stock…"
            sx={{ flex: 1, fontSize: '0.875rem', minWidth: 0 }}
            inputProps={{
              'aria-label': 'Search pages, orders, customers, stock, heats and shipments',
              role: 'combobox', 'aria-expanded': showing, 'aria-controls': 'global-search-results', 'aria-autocomplete': 'list',
              'aria-activedescendant': showing && flat[active] ? `gs-${active}` : undefined,
              'data-testid': 'global-search', autoComplete: 'off', spellCheck: false,
            }}
          />
          {loading && <CircularProgress size={14} sx={{ mr: 1 }} aria-hidden />}
          <Typography variant="caption" aria-hidden sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', bgcolor: 'background.paper', px: 1, py: 0.25, borderRadius: 0.5, border: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
            {mac ? '⌘K' : 'Ctrl K'}
          </Typography>
        </Box>
        <Box role="status" aria-live="polite" className="visually-hidden">{status}</Box>
        <Popper open={showing} anchorEl={anchorRef.current} placement="bottom-start" style={{ zIndex: 1300, width: Math.max(anchorRef.current?.offsetWidth || 0, 320), maxWidth: 'calc(100vw - 16px)' }}>
          <Paper elevation={6} sx={{ mt: 0.5, maxHeight: '70vh', overflowY: 'auto' }} data-testid="global-search-results">
            {flat.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {loading ? 'Searching…' : failed ? 'The search could not reach the server. Check the connection and type again.' : `Nothing found for "${q}". Try an order, shipment or stock number, a customer name, or the name of a page.`}
                </Typography>
              </Box>
            ) : (
              <List dense id="global-search-results" role="listbox" aria-label="Search results" sx={{ py: 0 }}>
                {groups.map((g) => (
                  <Box key={g.title} role="group" aria-label={g.title}>
                    <ListSubheader sx={{ lineHeight: '32px', bgcolor: 'background.default', fontWeight: 600 }}>{g.title}</ListSubheader>
                    {g.rows.map((row) => {
                      index += 1
                      const i = index
                      const Icon = row.icon
                      return (
                        <ListItemButton key={row.id} id={`gs-${i}`} role="option" aria-selected={i === active} selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(row)}>
                          {Icon && <ListItemIcon sx={{ minWidth: 36 }}><Icon fontSize="small" /></ListItemIcon>}
                          <ListItemText primary={row.primary} secondary={row.secondary || null} primaryTypographyProps={{ noWrap: true }} secondaryTypographyProps={{ noWrap: true }} />
                        </ListItemButton>
                      )
                    })}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  )
}
