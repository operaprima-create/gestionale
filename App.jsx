import { useState, useEffect, useCallback } from 'react'
import {
  MONTHS, DAYS, INSTRUMENTS, WEDDING_MOMENTS, EVENT_MOMENTS,
  MOMENT_EXTRA_COST, FOLLOW_UPS, REFUSALS, CAT_CFG, STATUS_CFG
} from './constants.js'
import { uid, fmt, fmtDate, calcFinance, suggestedPrice, blankItem, buildCanvaPrompt } from './utils.js'
import { loadItems, saveItem, deleteItem, subscribeToChanges } from './storage.js'
import { hasSupabase } from './supabase.js'

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  light: {
    bg: '#FAF9F7', bg2: '#FFFFFF', bg3: '#F3F1ED', bg4: '#EAE7E1',
    border: '#DDD9D0', text: '#1A1714', text2: '#6B6459', text3: '#A09888',
    shadow: '0 1px 3px rgba(0,0,0,0.07)'
  },
  dark: {
    bg: '#0A0A0A', bg2: '#141414', bg3: '#1E1E1E', bg4: '#272727',
    border: '#2E2E2E', text: '#F0EDE8', text2: '#A09880', text3: '#5A5448',
    shadow: 'none'
  }
}
const GOLD = '#C9A84C'

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'def', disabled, style: sx = {} }) => {
  const variants = {
    def:    { background: 'transparent', color: 'var(--text)',  border: '0.5px solid var(--border)' },
    gold:   { background: GOLD,          color: '#000',         border: `1px solid ${GOLD}`, fontWeight: 700 },
    ghost:  { background: 'transparent', color: 'var(--text2)', border: 'none' },
    danger: { background: 'transparent', color: '#C9503A',      border: '0.5px solid rgba(201,80,58,.3)' },
    canva:  { background: '#7B2FBE',     color: '#fff',         border: '1px solid #7B2FBE', fontWeight: 600 },
    sm:     { background: 'transparent', color: 'var(--text3)', border: '0.5px solid var(--border)', padding: '4px 10px', fontSize: 11 }
  }
  return (
    <button disabled={disabled} onClick={onClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 8, padding: '7px 16px',
        fontSize: 13, fontFamily: 'inherit', opacity: disabled ? .5 : 1, transition: 'opacity .15s',
        ...variants[variant], ...sx }}>
      {children}
    </button>
  )
}

const Badge = ({ label, color, bg }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
    background: bg, color, border: `0.5px solid ${color}40`, whiteSpace: 'nowrap' }}>
    {label}
  </span>
)

const Inp = ({ value, onChange, placeholder, type = 'text', sx = {} }) => (
  <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{ width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 8,
      color: 'var(--text)', fontSize: 13, padding: '8px 10px', fontFamily: 'inherit', outline: 'none', ...sx }} />
)

const Sel = ({ value, onChange, options, placeholder }) => (
  <select value={value || ''} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 8,
      color: 'var(--text)', fontSize: 13, padding: '8px 10px', fontFamily: 'inherit', outline: 'none' }}>
    {placeholder && <option value=''>{placeholder}</option>}
    {options.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
  </select>
)

const Tex = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value || ''} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{ width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 8,
      color: 'var(--text)', fontSize: 13, padding: '8px 10px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
)

const Lbl = ({ children }) => (
  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>
    {children}
  </div>
)

const Check = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', userSelect: 'none' }}>
    <div onClick={() => onChange(!checked)}
      style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? GOLD : 'var(--border)'}`,
        background: checked ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {checked && <span style={{ color: '#000', fontSize: 10, fontWeight: 900 }}>✓</span>}
    </div>
    {label}
  </label>
)

const Card = ({ children, sx = {} }) => (
  <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12,
    padding: '16px 18px', boxShadow: 'var(--shadow)', marginBottom: 12, ...sx }}>
    {children}
  </div>
)

const Divider = () => <div style={{ height: '0.5px', background: 'var(--border)', margin: '12px 0' }} />

const SecTitle = ({ children, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    {icon && <span style={{ fontSize: 15, color: GOLD }}>{icon}</span>}
    <span style={{ fontSize: 14, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>
      {children}
    </span>
  </div>
)

const Grid = ({ children, cols = 2, sx = {} }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, ...sx }}>
    {children}
  </div>
)

const FG = ({ label, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <Lbl>{label}</Lbl>
    {children}
  </div>
)

// ─── FORMATION BLOCK ──────────────────────────────────────────────────────────
const FormationBlock = ({ moment, data = {}, onChange, isWed }) => {
  const active = !!data.active
  const sel = data.instruments || []
  const toggleI = i => onChange({ ...data, instruments: sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i] })

  return (
    <div style={{ background: 'var(--bg3)', border: `0.5px solid ${active ? GOLD + '50' : 'var(--border)'}`,
      borderRadius: 10, marginBottom: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => onChange({ ...data, active: !active })}>
        <div style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${active ? GOLD : 'var(--border)'}`,
          background: active ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {active && <span style={{ color: '#000', fontSize: 9, fontWeight: 900 }}>✓</span>}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text3)', flex: 1 }}>{moment}</span>
        {active && isWed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>extra/mus.:</span>
            <input type='number' value={data.extraCost ?? MOMENT_EXTRA_COST[moment] ?? 50}
              onChange={e => onChange({ ...data, extraCost: +e.target.value })}
              style={{ width: 58, background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 6,
                color: GOLD, fontSize: 12, padding: '3px 6px', fontFamily: 'inherit', outline: 'none' }} />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>€</span>
          </div>
        )}
      </div>
      {active && (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {INSTRUMENTS.map(i => (
              <span key={i} onClick={() => toggleI(i)}
                style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
                  background: sel.includes(i) ? GOLD : 'var(--bg4)',
                  color: sel.includes(i) ? '#000' : 'var(--text2)',
                  border: `0.5px solid ${sel.includes(i) ? GOLD : 'var(--border)'}` }}>
                {i}
              </span>
            ))}
          </div>
          <Grid cols={2} sx={{ marginBottom: 8 }}>
            <FG label='Brani / Stile'>
              <Inp value={data.style} onChange={v => onChange({ ...data, style: v })} placeholder='es. jazz, classica...' />
            </FG>
            <FG label='Formazione'>
              <Inp value={data.formation} onChange={v => onChange({ ...data, formation: v })} placeholder='es. duo piano + voce' />
            </FG>
          </Grid>
          <Lbl>Note</Lbl>
          <Tex value={data.notes} onChange={v => onChange({ ...data, notes: v })} placeholder='Richieste particolari...' rows={2} />
        </div>
      )}
    </div>
  )
}

// ─── PRICE SUGGESTION ────────────────────────────────────────────────────────
const PriceSuggestion = ({ item, onApply }) => {
  const sp = suggestedPrice(item)
  if (!sp) return null
  return (
    <div style={{ background: `${GOLD}12`, border: `0.5px solid ${GOLD}50`, borderRadius: 10,
      padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>💡 Prezzo suggerito dal listino Opera Prima</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: GOLD }}>{fmt(sp.price)}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sp.label}</div>
      </div>
      <Btn variant='gold' onClick={() => onApply(sp.price)} sx={{ fontSize: 12, padding: '6px 14px' }}>
        Applica
      </Btn>
    </div>
  )
}

// ─── ITEM FORM ────────────────────────────────────────────────────────────────
const ItemForm = ({ initial, items, onSave, onDelete, onClose, onCanva }) => {
  const [d, setD] = useState(() => ({ ...blankItem(), ...initial }))
  const [saving, setSaving] = useState(false)
  const u = (k, v) => setD(p => ({ ...p, [k]: v }))
  const uM = (m, v) => setD(p => ({ ...p, moments: { ...p.moments, [m]: v } }))
  const uFU = (k, v) => setD(p => ({ ...p, followUp: { ...p.followUp, [k]: v } }))

  const isNew = !items.find(x => x.id === d.id)
  const isWed = d.category === 'matrimonio'
  const moments = isWed ? WEDDING_MOMENTS : EVENT_MOMENTS
  const fin = calcFinance(d)
  const valid = isWed ? (d.sposa || d.sposo) && d.eventDate : d.eventName && d.eventDate

  const handleSave = async () => {
    if (!valid || saving) return
    setSaving(true)
    await onSave(d)
    setSaving(false)
  }

  const name = d.sposa && d.sposo ? `${d.sposa} & ${d.sposo}` : d.sposa || d.sposo || d.eventName || 'Nuova scheda'
  const cc = CAT_CFG[d.category]
  const activeMom = Object.values(d.moments || {}).filter(m => m.active)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Btn variant='ghost' onClick={onClose} sx={{ fontSize: 20, padding: '2px 8px' }}>←</Btn>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{isNew ? 'Nuova scheda' : name}</span>
          {cc && <Badge label={cc.label} color={cc.color} bg={cc.bg} />}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {d.status === 'confermato' && (
            <Btn variant='canva' onClick={() => onCanva(d)} sx={{ fontSize: 12 }}>
              📄 Preventivo Canva
            </Btn>
          )}
          {!isNew && (
            <Btn variant='danger' onClick={async () => { if (window.confirm('Eliminare questa scheda?')) await onDelete(d.id) }}>
              🗑
            </Btn>
          )}
          <Btn variant='ghost' onClick={onClose}>Annulla</Btn>
          <Btn variant='gold' onClick={handleSave} disabled={!valid || saving}>
            {saving ? '...' : '💾 Salva'}
          </Btn>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>

        {/* Tipo evento */}
        <Card>
          <SecTitle icon='♪'>Tipo di evento</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
            {Object.entries(CAT_CFG).map(([k, c]) => (
              <div key={k} onClick={() => u('category', k)}
                style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  border: `1.5px solid ${d.category === k ? c.color : 'var(--border)'}`,
                  background: d.category === k ? c.bg : 'var(--bg3)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: d.category === k ? c.color : 'var(--text2)' }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Info generali */}
        <Card>
          <SecTitle icon='📅'>Informazioni generali</SecTitle>
          <Grid cols={2}>
            <FG label='Data evento *'>
              <Inp type='date' value={d.eventDate} onChange={v => u('eventDate', v)} />
            </FG>
            <FG label='Stato'>
              <Sel value={d.status} onChange={v => u('status', v)}
                options={Object.entries(STATUS_CFG).map(([k, c]) => ({ v: k, l: c.label }))} />
            </FG>
            {!isWed && (
              <>
                <FG label='Nome evento *' span={2}>
                  <Inp value={d.eventName} onChange={v => u('eventName', v)} placeholder='es. Fiera del Mobile' />
                </FG>
                <FG label='Location'>
                  <Inp value={d.eventLocation} onChange={v => u('eventLocation', v)} />
                </FG>
                <FG label='Referente'>
                  <Inp value={d.eventClient} onChange={v => u('eventClient', v)} />
                </FG>
              </>
            )}
          </Grid>
        </Card>

        {/* Dati sposi */}
        {isWed && (
          <Card>
            <SecTitle icon='💍'>Dati sposi</SecTitle>
            <Grid cols={2}>
              <FG label='Nome sposa *'><Inp value={d.sposa} onChange={v => u('sposa', v)} /></FG>
              <FG label='Nome sposo *'><Inp value={d.sposo} onChange={v => u('sposo', v)} /></FG>
              <FG label='Età indicativa'><Inp value={d.age} onChange={v => u('age', v)} placeholder='es. 28-32' /></FG>
              <FG label='Provenienza'><Inp value={d.provenienza} onChange={v => u('provenienza', v)} placeholder='es. Milano' /></FG>
              <FG label='Telefono'><Inp value={d.phone} onChange={v => u('phone', v)} /></FG>
              <FG label='Email'><Inp type='email' value={d.email} onChange={v => u('email', v)} /></FG>
              <FG label='N° invitati'><Inp type='number' value={d.guests} onChange={v => u('guests', v)} /></FG>
              <FG label='Luogo cerimonia'><Inp value={d.cerLocation} onChange={v => u('cerLocation', v)} /></FG>
              <FG label='Luogo ricevimento' span={2}><Inp value={d.recLocation} onChange={v => u('recLocation', v)} /></FG>
            </Grid>
          </Card>
        )}

        {/* Consulenza */}
        {isWed && (
          <Card>
            <SecTitle icon='📋'>Consulenza</SecTitle>
            <Grid cols={2}>
              <FG label='Data richiesta'><Inp type='date' value={d.requestDate} onChange={v => u('requestDate', v)} /></FG>
              <FG label='Data consulenza'><Inp type='date' value={d.consultDate} onChange={v => u('consultDate', v)} /></FG>
              <FG label='Orario'><Inp type='time' value={d.consultTime} onChange={v => u('consultTime', v)} /></FG>
              <FG label='Modalità'>
                <Sel value={d.consultMode} onChange={v => u('consultMode', v)} options={['online', 'presso lo studio', 'altro']} />
              </FG>
              <FG label='Prima richiesta degli sposi' span={2}>
                <Tex value={d.firstRequest} onChange={v => u('firstRequest', v)} placeholder='Cosa hanno chiesto inizialmente...' />
              </FG>
              <FG label='Impressioni generali (post consulenza)' span={2}>
                <Tex value={d.impressions} onChange={v => u('impressions', v)} placeholder='Note sulla coppia, aspettative...' />
              </FG>
            </Grid>
          </Card>
        )}

        {/* Servizi */}
        <Card>
          <SecTitle icon='🎼'>Servizi richiesti</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14,
            padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8 }}>
            <div>
              <Lbl>N° musicisti</Lbl>
              <input type='number' min='0' max='20' value={d.nMusicians || 0}
                onChange={e => u('nMusicians', +e.target.value)}
                style={{ width: '100%', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 8,
                  color: GOLD, fontSize: 18, padding: '6px 10px', fontFamily: 'inherit', outline: 'none',
                  fontWeight: 700, textAlign: 'center' }} />
            </div>
            <div>
              <Lbl>Stile musicale</Lbl>
              <Sel value={d.musicStyle || 'classica'} onChange={v => u('musicStyle', v)}
                options={[{ v: 'classica', l: 'Classica' }, { v: 'pop', l: 'Pop' }]} />
            </div>
            <div>
              <Lbl>Costo stimato musicisti</Lbl>
              <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, paddingTop: 8 }}>
                {fmt(calcFinance(d).musicianCost)}
              </div>
            </div>
          </div>
          {moments.map(m => (
            <FormationBlock key={m} moment={m} data={d.moments[m] || {}} isWed={isWed}
              onChange={v => uM(m, v)} />
          ))}
        </Card>

        {/* Preventivo */}
        <Card>
          <SecTitle icon='💶'>Preventivo</SecTitle>
          <PriceSuggestion item={d} onApply={v => u('totalAgreed', v.toString())} />
          <Grid cols={2}>
            <FG label='Modalità preventivo'>
              <Sel value={d.priceMode} onChange={v => u('priceMode', v)}
                options={['dal vivo', 'da inviare', 'già inviato']} />
            </FG>
            <FG label='Prezzo comunicato'>
              <Inp value={d.priceCommunicated} onChange={v => u('priceCommunicated', v)} placeholder='es. 1.200 €' />
            </FG>
            <FG label='Note preventivo' span={2}>
              <Tex value={d.priceNotes} onChange={v => u('priceNotes', v)} rows={2} />
            </FG>
          </Grid>
          {d.category === 'fiera' && (
            <>
              <Divider />
              <Grid cols={2}>
                <FG label='Spese a carico tuo (€)'>
                  <Inp type='number' value={d.expenses} onChange={v => u('expenses', v)} />
                </FG>
                <FG label='Dettaglio spese'>
                  <Inp value={d.expenseNotes} onChange={v => u('expenseNotes', v)} placeholder='Trasporto, noleggio...' />
                </FG>
              </Grid>
            </>
          )}
        </Card>

        {/* Follow up */}
        {isWed && (
          <Card>
            <SecTitle icon='📤'>Follow up</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {FOLLOW_UPS.map(o => (
                <Check key={o} label={o} checked={!!d.followUp[o]} onChange={v => uFU(o, v)} />
              ))}
            </div>
            <Grid cols={2}>
              <FG label='Ricontattare entro'>
                <Inp type='date' value={d.ricontattare} onChange={v => u('ricontattare', v)} />
              </FG>
              <FG label='Note follow up'>
                <Inp value={d.followUpNotes} onChange={v => u('followUpNotes', v)} />
              </FG>
            </Grid>
          </Card>
        )}

        {/* Esito finale */}
        <Card>
          <SecTitle icon='✅'>Esito finale</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {Object.entries(STATUS_CFG).map(([k, c]) => (
              <div key={k} onClick={() => u('status', k)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
                  cursor: 'pointer', border: `1.5px solid ${d.status === k ? c.color : 'var(--border)'}`,
                  background: d.status === k ? c.bg : 'var(--bg3)' }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%',
                  background: d.status === k ? c.color : 'var(--text3)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: d.status === k ? c.color : 'var(--text2)' }}>{c.label}</span>
              </div>
            ))}
          </div>
          <Tex value={d.statusNotes} onChange={v => u('statusNotes', v)} placeholder='Note sullo stato...' rows={2} />

          {d.status === 'confermato' && (
            <>
              <Divider />
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif',
                fontStyle: 'italic', marginBottom: 12 }}>Dettagli conferma</div>
              <Grid cols={2}>
                <FG label='Data conferma'><Inp type='date' value={d.confirmDate} onChange={v => u('confirmDate', v)} /></FG>
                <FG label='Totale concordato (€)'><Inp type='number' value={d.totalAgreed} onChange={v => u('totalAgreed', v)} /></FG>
                <FG label='Sconto (€)'><Inp type='number' value={d.discount} onChange={v => u('discount', v)} /></FG>
                <FG label='Acconto ricevuto (€)'><Inp type='number' value={d.depositReceived} onChange={v => u('depositReceived', v)} /></FG>
                <FG label='Restante da saldare'>
                  <div style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8,
                    border: '0.5px solid var(--border)', fontSize: 16, fontWeight: 700,
                    color: fin.remaining > 0 ? '#C98A1A' : '#3D9E6E' }}>
                    {fmt(fin.remaining)}
                  </div>
                </FG>
                <FG label='Servizi confermati' span={2}>
                  <Tex value={d.confirmedServices} onChange={v => u('confirmedServices', v)} rows={2} />
                </FG>
              </Grid>
            </>
          )}

          {(d.status === 'rifiutato' || d.status === 'non_risponde') && (
            <>
              <Divider />
              <Lbl>Motivo rifiuto</Lbl>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                {REFUSALS.map(r => (
                  <Check key={r} label={r} checked={d.refusalReason === r} onChange={() => u('refusalReason', r)} />
                ))}
              </div>
              <Tex value={d.refusalNotes} onChange={v => u('refusalNotes', v)} rows={2} />
            </>
          )}
        </Card>

        {/* Bilancio */}
        {d.status === 'confermato' && (
          <Card sx={{ border: `0.5px solid ${GOLD}50` }}>
            <SecTitle icon='📊'>Bilancio evento</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 12 }}>
              {[
                { l: 'Totale cliente',   v: fmt(fin.total),       c: 'var(--text)'  },
                { l: 'Costo musicisti',  v: fmt(fin.musicianCost), c: '#C9503A'     },
                fin.expenses > 0 ? { l: 'Spese fiera', v: fmt(fin.expenses), c: '#C9503A' } : null,
                { l: 'Guadagno netto',   v: fmt(fin.profit),      c: fin.profit >= 0 ? '#3D9E6E' : '#C9503A' },
                { l: '🎵 Rebecca',       v: fmt(fin.perPerson),   c: GOLD           },
                { l: '🎸 Enea',          v: fmt(fin.perPerson),   c: GOLD           },
              ].filter(Boolean).map(x => (
                <div key={x.l} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{x.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: x.c }}>{x.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, padding: '8px 10px',
              background: 'var(--bg3)', borderRadius: 8, marginBottom: 12 }}>
              <strong style={{ color: 'var(--text2)' }}>Acconto:</strong> {fmt(fin.deposit)} —{' '}
              <strong style={{ color: fin.remaining > 0 ? '#C98A1A' : '#3D9E6E' }}>
                {fin.remaining > 0 ? `Mancano ${fmt(fin.remaining)}` : 'Saldato ✓'}
              </strong>
              <br />
              <strong style={{ color: 'var(--text2)' }}>Musicisti:</strong>{' '}
              {d.nMusicians > 0
                ? `${d.nMusicians} × (200€${activeMom.length > 1 ? ` + extra per ${activeMom.length - 1} momento/i aggiuntivo/i` : ''}) = ${fmt(fin.musicianCost)}`
                : 'Nessun musicista inserito'}
            </div>
            <Btn variant='canva' onClick={() => onCanva(d)} sx={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: 14 }}>
              📄 Genera preventivo su Canva
            </Btn>
          </Card>
        )}

      </div>
    </div>
  )
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
const CalView = ({ items, onSelect, onNew }) => {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const today = new Date()

  const chM = d => {
    let m = month + d, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonth(m); setYear(y)
  }

  const firstDow = (() => { let d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 })()
  const daysInM  = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells    = []
  for (let i = 0; i < firstDow; i++) cells.push({ d: prevDays - firstDow + 1 + i, other: true })
  for (let d = 1; d <= daysInM; d++) cells.push({ d, other: false })
  const rem = (Math.ceil((firstDow + daysInM) / 7) * 7) - (firstDow + daysInM)
  for (let i = 1; i <= rem; i++) cells.push({ d: i, other: true })

  const getDayItems = d => {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return items.filter(x => x.eventDate === ds)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Btn variant='ghost' onClick={() => chM(-1)} sx={{ fontSize: 20, padding: '4px 10px' }}>‹</Btn>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', minWidth: 160, textAlign: 'center' }}>
          {MONTHS[month]} {year}
        </span>
        <Btn variant='ghost' onClick={() => chM(1)} sx={{ fontSize: 20, padding: '4px 10px' }}>›</Btn>
        <Btn variant='sm' onClick={() => setYear(y => Math.max(2024, y - 1))}>◀ anno</Btn>
        <Btn variant='sm' onClick={() => setYear(y => Math.min(2027, y + 1))}>anno ▶</Btn>
        <Btn variant='gold' onClick={() => onNew()} sx={{ marginLeft: 'auto' }}>+ Nuova scheda</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', padding: '4px 0', fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map((c, i) => {
          const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`
          const its = c.other ? [] : getDayItems(c.d)
          const isToday = !c.other && today.getFullYear() === year && today.getMonth() === month && today.getDate() === c.d
          return (
            <div key={i} onClick={() => { if (c.other) return; its.length === 0 ? onNew(ds) : onSelect(its[0].id) }}
              style={{ minHeight: 72, background: isToday ? `${GOLD}15` : 'var(--bg2)',
                border: `0.5px solid ${isToday ? GOLD : 'var(--border)'}`,
                borderRadius: 8, padding: 6, cursor: c.other ? 'default' : 'pointer', opacity: c.other ? .3 : 1,
                boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 11, color: isToday ? GOLD : 'var(--text3)', fontWeight: isToday ? 700 : 400, marginBottom: 3 }}>
                {c.d}
              </div>
              {its.slice(0, 3).map(it => {
                const cc = CAT_CFG[it.category] || CAT_CFG.matrimonio
                const sc = STATUS_CFG[it.status] || STATUS_CFG.in_attesa
                const name = it.sposa && it.sposo ? `${it.sposa} & ${it.sposo}` : it.sposa || it.sposo || it.eventName || 'Evento'
                return (
                  <div key={it.id} style={{ fontSize: 10, padding: '2px 4px', borderRadius: 3, marginBottom: 2,
                    background: cc.bg, color: cc.color, borderLeft: `2px solid ${sc.color}`,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {name}
                  </div>
                )
              })}
              {its.length > 3 && <div style={{ fontSize: 10, color: 'var(--text3)' }}>+{its.length - 3}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
const ListView = ({ items, onSelect, onNew }) => {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const sorted = [...items]
    .filter(x => filter === 'all' || x.category === filter)
    .filter(x => {
      if (!search) return true
      const q = search.toLowerCase()
      return (x.sposa || '').toLowerCase().includes(q) || (x.sposo || '').toLowerCase().includes(q) ||
        (x.eventName || '').toLowerCase().includes(q) || (x.cerLocation || '').toLowerCase().includes(q) ||
        (x.eventLocation || '').toLowerCase().includes(q)
    })
    .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all', 'Tutti'], ...Object.entries(CAT_CFG).map(([k, c]) => [k, c.label])].map(([k, l]) => {
          const cc = CAT_CFG[k]
          const isSel = filter === k
          return (
            <span key={k} onClick={() => setFilter(k)}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                fontWeight: isSel ? 600 : 400,
                border: `0.5px solid ${isSel ? (cc?.color || GOLD) : 'var(--border)'}`,
                color: isSel ? (cc?.color || GOLD) : 'var(--text2)',
                background: isSel ? (cc?.bg || `${GOLD}15`) : 'var(--bg2)' }}>
              {l}
            </span>
          )
        })}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Cerca...'
          style={{ marginLeft: 'auto', width: 180, background: 'var(--bg2)', border: '0.5px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 13, padding: '6px 10px', fontFamily: 'inherit', outline: 'none' }} />
        <Btn variant='gold' onClick={() => onNew()}>+ Nuova scheda</Btn>
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)', fontSize: 14 }}>
          Nessuna scheda trovata. Creane una!
        </div>
      )}

      {sorted.map(it => {
        const cc  = CAT_CFG[it.category] || CAT_CFG.matrimonio
        const sc  = STATUS_CFG[it.status] || STATUS_CFG.in_attesa
        const fin = calcFinance(it)
        const dt  = new Date((it.eventDate || '2025-01-01') + 'T12:00:00')
        const name = it.sposa && it.sposo ? `${it.sposa} & ${it.sposo}` : it.sposa || it.sposo || it.eventName || '—'
        const activeMom = Object.values(it.moments || {}).filter(m => m.active)
        const fuPending = Object.values(it.followUp || {}).filter(Boolean).length

        return (
          <div key={it.id} onClick={() => onSelect(it.id)}
            style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12,
              padding: '13px 15px', marginBottom: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 13, boxShadow: 'var(--shadow)', transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = GOLD + '80'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ textAlign: 'center', background: 'var(--bg3)', borderRadius: 8, padding: '7px 9px', minWidth: 48, flexShrink: 0 }}>
              <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>{dt.getDate()}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>{MONTHS[dt.getMonth()].slice(0, 3)}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{dt.getFullYear()}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4,
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{name}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge label={cc.label} color={cc.color} bg={cc.bg} />
                <Badge label={sc.label} color={sc.color} bg={sc.bg} />
                {(it.cerLocation || it.eventLocation) &&
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>📍 {it.cerLocation || it.eventLocation}</span>}
                {activeMom.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{activeMom.length} momento/i</span>}
                {fuPending > 0 && <span style={{ fontSize: 11, color: '#C98A1A' }}>⏳ {fuPending} follow up</span>}
              </div>
            </div>
            {it.status === 'confermato' && fin.total > 0 && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{fmt(fin.total)}</div>
                <div style={{ fontSize: 11, color: '#3D9E6E' }}>+{fmt(fin.perPerson)} cad.</div>
                {fin.remaining > 0 && <div style={{ fontSize: 11, color: '#C98A1A' }}>da incassare: {fmt(fin.remaining)}</div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ items }) => {
  const now = new Date()
  const confirmed = items.filter(x => x.status === 'confermato')
  const upcoming  = items.filter(x => x.eventDate && new Date(x.eventDate + 'T12:00:00') >= now)
  const totalRev  = confirmed.reduce((a, x) => a + (parseFloat(x.totalAgreed) || 0), 0)
  const totalCost = confirmed.reduce((a, x) => a + calcFinance(x).totalCosts, 0)
  const profit    = totalRev - totalCost

  const stats = [
    { l: 'Schede totali',  v: items.length,      c: 'var(--text)'  },
    { l: 'Prossimi',       v: upcoming.length,   c: GOLD           },
    { l: 'Confermati',     v: confirmed.length,  c: '#3D9E6E'      },
    { l: 'Fatturato',      v: fmt(totalRev),     c: 'var(--text)'  },
    { l: 'Guadagno netto', v: fmt(profit),       c: profit >= 0 ? '#3D9E6E' : '#C9503A' },
    { l: '🎵 Rebecca',     v: fmt(profit / 2),   c: GOLD           },
    { l: '🎸 Enea',        v: fmt(profit / 2),   c: GOLD           },
  ]

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(105px,1fr))', gap: 8, marginBottom: 10 }}>
        {stats.map(x => (
          <div key={x.l} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10,
            padding: '10px 12px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{x.l}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CANVA MODAL ──────────────────────────────────────────────────────────────
const CanvaModal = ({ item, onClose, onGenerate }) => {
  const [mode, setMode] = useState(null)
  const name = item.sposa && item.sposo ? `${item.sposa} & ${item.sposo}` : item.sposa || item.sposo || item.eventName || 'Cliente'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 16,
        padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>📄 Preventivo Canva</span>
          <Btn variant='ghost' onClick={onClose} sx={{ fontSize: 18 }}>✕</Btn>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18, lineHeight: 1.6 }}>
          Come vuoi creare il preventivo per <strong style={{ color: 'var(--text)' }}>{name}</strong>?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          {[
            { k: 'auto',     icon: '⚡', title: 'Genera automatico', desc: 'Claude compila il documento Canva con tutti i dati già inseriti' },
            { k: 'template', icon: '🎨', title: 'Da template',       desc: 'Apre Canva con un template da modificare a mano' }
          ].map(o => (
            <div key={o.k} onClick={() => setMode(o.k)}
              style={{ padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                border: `1.5px solid ${mode === o.k ? '#7B2FBE' : 'var(--border)'}`,
                background: mode === o.k ? 'rgba(123,47,190,.07)' : 'var(--bg3)' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{o.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: mode === o.k ? '#7B2FBE' : 'var(--text)', marginBottom: 4 }}>{o.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{o.desc}</div>
            </div>
          ))}
        </div>
        <Btn variant='canva' onClick={() => mode && onGenerate(item, mode)} disabled={!mode}
          sx={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: 14 }}>
          {mode === 'auto' ? '⚡ Genera con Canva' : mode === 'template' ? '🎨 Apri template Canva' : 'Seleziona un\'opzione'}
        </Btn>
      </div>
    </div>
  )
}

// ─── SYNC BANNER ──────────────────────────────────────────────────────────────
const SyncBanner = () => {
  if (hasSupabase) return null
  return (
    <div style={{ background: `${GOLD}15`, border: `0.5px solid ${GOLD}60`, borderRadius: 8,
      padding: '8px 14px', marginBottom: 12, fontSize: 12, color: 'var(--text2)',
      display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>⚠️</span>
      <span>
        <strong style={{ color: 'var(--text)' }}>Modalità offline</strong> — I dati sono salvati solo su questo browser.
        Per condividere con Enea configura Supabase (vedi README).
      </span>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems]     = useState([])
  const [view, setView]       = useState('cal')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme]     = useState(() => localStorage.getItem('op_theme') || 'light')
  const [canvaItem, setCanvaItem] = useState(null)

  const tv = T[theme]

  // Apply CSS vars
  useEffect(() => {
    const r = document.documentElement
    Object.entries(tv).forEach(([k, v]) => r.style.setProperty(`--${k}`, v))
  }, [theme, tv])

  // Load
  useEffect(() => {
    loadItems().then(data => { setItems(data); setLoading(false) })
  }, [])

  // Realtime sync
  useEffect(() => {
    if (!hasSupabase) return
    const unsub = subscribeToChanges(() => loadItems().then(setItems))
    return unsub
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('op_theme', next)
  }

  const handleSave = useCallback(async item => {
    await saveItem(item)
    const loaded = await loadItems()
    setItems(loaded)
    setEditing(null)
  }, [])

  const handleDelete = useCallback(async id => {
    await deleteItem(id)
    const loaded = await loadItems()
    setItems(loaded)
    setEditing(null)
  }, [])

  const handleCanva = (item, mode) => {
    setCanvaItem(null)
    if (mode === 'template') {
      window.open('https://www.canva.com/create/documents/?query=preventivo+elegante+matrimonio', '_blank')
      return
    }
    // Auto: invia il prompt a Claude per generare il doc Canva
    // Funziona nell'app Claude — nell'app standalone aprire Canva con i dati
    const prompt = buildCanvaPrompt(item)
    if (window.sendPrompt) {
      window.sendPrompt(prompt)
    } else {
      // Fuori da Claude: apri Canva e copia il testo
      navigator.clipboard?.writeText(prompt).catch(() => {})
      window.open('https://www.canva.com/create/documents/', '_blank')
      alert('I dati del preventivo sono stati copiati negli appunti. Incollali in Canva!')
    }
  }

  const openNew  = (date = '') => setEditing({ ...blankItem(date), _new: true })
  const openEdit = id => setEditing(items.find(x => x.id === id) || null)

  if (loading) return (
    <div style={{ background: tv.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎙</div>
        <div style={{ fontSize: 13, color: tv.text3 }}>Caricamento Opera Prima...</div>
      </div>
    </div>
  )

  if (editing) return (
    <div style={{ '--bg': tv.bg, '--bg2': tv.bg2, '--bg3': tv.bg3, '--bg4': tv.bg4,
      '--border': tv.border, '--text': tv.text, '--text2': tv.text2, '--text3': tv.text3, '--shadow': tv.shadow }}>
      {canvaItem && <CanvaModal item={canvaItem} onClose={() => setCanvaItem(null)} onGenerate={handleCanva} />}
      <ItemForm initial={editing} items={items} onSave={handleSave} onDelete={handleDelete}
        onClose={() => setEditing(null)} onCanva={item => { setEditing(null); setCanvaItem(item) }} />
    </div>
  )

  return (
    <div style={{ background: tv.bg, minHeight: '100vh', color: tv.text, fontFamily: 'system-ui,sans-serif',
      '--bg': tv.bg, '--bg2': tv.bg2, '--bg3': tv.bg3, '--bg4': tv.bg4,
      '--border': tv.border, '--text': tv.text, '--text2': tv.text2, '--text3': tv.text3, '--shadow': tv.shadow }}>

      {canvaItem && <CanvaModal item={canvaItem} onClose={() => setCanvaItem(null)} onGenerate={handleCanva} />}

      {/* Topbar */}
      <div style={{ background: tv.bg2, borderBottom: `0.5px solid ${tv.border}`, padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 40, boxShadow: tv.shadow }}>
        {/* Logo sempre su sfondo scuro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#000',
            border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 18, color: GOLD }}>🎙</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, letterSpacing: '.2em', fontFamily: 'Georgia,serif' }}>
              OPERA PRIMA
            </div>
            <div style={{ fontSize: 9, color: tv.text3, letterSpacing: '.1em', textTransform: 'uppercase' }}>
              Gestionale eventi {hasSupabase ? '🟢 live' : '🟡 offline'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggleTheme}
            style={{ cursor: 'pointer', borderRadius: 20, padding: '6px 12px', fontSize: 12,
              fontFamily: 'inherit', border: `0.5px solid ${tv.border}`, background: tv.bg3, color: tv.text2 }}>
            {theme === 'dark' ? '☀️ Chiaro' : '🌙 Scuro'}
          </button>
          {[['cal', '📅 Calendario'], ['list', '📋 Lista']].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)}
              style={{ cursor: 'pointer', borderRadius: 8, padding: '7px 13px', fontSize: 13,
                fontFamily: 'inherit', background: view === k ? `${GOLD}22` : 'transparent',
                color: view === k ? GOLD : tv.text2, border: `0.5px solid ${view === k ? GOLD : tv.border}` }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 16px' }}>
        <SyncBanner />
        <Dashboard items={items} />
        {view === 'cal'  && <CalView  items={items} onSelect={openEdit} onNew={openNew} />}
        {view === 'list' && <ListView items={items} onSelect={openEdit} onNew={openNew} />}
      </div>
    </div>
  )
}
