import { MONTHS, PRICE_LIST, MOMENT_EXTRA_COST, WEDDING_MOMENTS } from './constants.js'

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

export const fmt = n =>
  (!isNaN(n) && n != null && n !== '')
    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
    : '—'

export const fmtDate = s => {
  if (!s) return '—'
  const d = new Date(s + 'T12:00:00')
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function calcFinance(item) {
  const total    = parseFloat(item.totalAgreed) || 0
  const deposit  = parseFloat(item.depositReceived) || 0
  const discount = parseFloat(item.discount) || 0
  const remaining = total - deposit
  const nMus     = parseInt(item.nMusicians) || 0
  const activeMom = Object.values(item.moments || {}).filter(m => m.active)

  let musicianCost = 0
  if (nMus > 0 && activeMom.length > 0) {
    const extraSum = activeMom.slice(1).reduce((a, m) => a + (m.extraCost ?? MOMENT_EXTRA_COST[m.name] ?? 50), 0)
    musicianCost = nMus * (200 + extraSum)
  }

  const expenses   = item.category === 'fiera' ? (parseFloat(item.expenses) || 0) : 0
  const totalCosts = musicianCost + expenses
  const profit     = total - totalCosts

  return { total, deposit, discount, remaining, musicianCost, expenses, totalCosts, profit, perPerson: profit / 2 }
}

export function suggestedPrice(item) {
  const n     = parseInt(item.nMusicians) || 0
  const style = item.musicStyle || 'classica'
  const activeMom = Object.values(item.moments || {}).filter(m => m.active)
  const hasDJ  = activeMom.some(m => (m.instruments || []).some(i => i === 'DJ' || i === 'DJ + strumento live'))
  const hasKar = activeMom.some(m => (m.instruments || []).some(i => i === 'Karaoke' || i === 'Karaoke + DJ'))

  if (hasDJ && hasKar) return { price: PRICE_LIST.dj_karaoke, label: 'DJ + Karaoke' }
  if (hasDJ)           return { price: PRICE_LIST.dj,         label: 'Servizio DJ' }
  if (hasKar)          return { price: PRICE_LIST.karaoke,    label: 'Servizio Karaoke' }
  if (n > 0) {
    const k    = Math.min(n, 4)
    const list = style === 'pop' ? PRICE_LIST.pop : PRICE_LIST.classica
    return { price: list[k] || list[4], label: `${n} musicista/i — ${style === 'pop' ? 'Pop' : 'Classica'}` }
  }
  return null
}

export const blankItem = (date = '') => ({
  id: uid(), category: 'matrimonio', status: 'in_attesa', eventDate: date,
  sposa: '', sposo: '', age: '', phone: '', email: '', provenienza: '', guests: '',
  cerLocation: '', recLocation: '', firstRequest: '',
  requestDate: '', consultDate: '', consultTime: '', consultMode: 'online',
  impressions: '', moments: {}, followUp: {}, ricontattare: '', followUpNotes: '',
  priceMode: 'dal vivo', priceCommunicated: '', priceNotes: '',
  confirmDate: '', confirmedServices: '', totalAgreed: '', depositReceived: '',
  discount: '', refusalReason: '', refusalNotes: '', statusNotes: '',
  eventName: '', eventLocation: '', eventClient: '',
  nMusicians: 0, musicStyle: 'classica', expenses: '', expenseNotes: ''
})

export function buildCanvaPrompt(item) {
  const fin = calcFinance(item)
  const activeMom = WEDDING_MOMENTS.filter(m => item.moments[m]?.active)
  const today = new Date()
  const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
  const name = item.sposa && item.sposo
    ? `${item.sposa} e ${item.sposo}`
    : item.sposa || item.sposo || item.eventName || 'Cliente'

  const rows = activeMom.map(m => {
    const md   = item.moments[m] || {}
    const instr = (md.instruments || []).join(' + ') || md.formation || 'da definire'
    const loc  = item.cerLocation || item.recLocation || item.eventLocation || '—'
    const costPerMom = activeMom.length > 0 ? fin.total / activeMom.length : 0
    return `| ${m} | ${loc} | ${instr} | ${fmt(Math.round(costPerMom))} |`
  }).join('\n')

  const subtotal = fin.total + fin.discount

  return `Crea un documento Canva elegante (tipo "doc") per Opera Prima — servizi musicali per matrimoni.

Usa uno stile raffinato: sfondo bianco, tipografia serif per i titoli, accenti in dorato (#C9A84C). Il layout deve essere simile a un preventivo professionale.

DATI INTESTAZIONE:
Data: ${dateStr}
Cliente: ${name}
Data evento: ${fmtDate(item.eventDate)}

TABELLA SERVIZI (con colonne: Momento | Luogo | Servizio | Costo):
${rows}

SUBTOTALE: ${fmt(subtotal)}
SCONTO: ${fmt(fin.discount)}
TOTALE: ${fmt(fin.total)}

SEZIONE "Servizi inclusi":
• Fornitura di tutta l'attrezzatura tecnica necessaria, comprensiva di impianto audio professionale, microfoni e strumentazione dedicata.
• Predisposizione di postazioni musicali complete comprensive di effetti luce già allestite e pronte all'uso nei diversi momenti dell'evento.
• Possibilità di personalizzare la scaletta musicale con i brani preferiti.
• Supporto nella definizione dei brani della cerimonia.
• Gestione completa degli aspetti organizzativi e tecnici.
• Assistenza e consulenza dedicata durante tutta la fase di preparazione.

SEZIONE "Termini e Condizioni":
• Le quote indicate non includono eventuali costi SIAE.
• Per confermare la data è richiesto un acconto pari al 25% dell'importo concordato.
• L'acconto garantisce il blocco esclusivo della data e non è rimborsabile in caso di annullamento.
• Eventuali variazioni della data verranno valutate in base al preavviso e alla disponibilità dei musicisti.`
}
