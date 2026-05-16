export const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
export const DAYS = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']

export const INSTRUMENTS = [
  'Voce femminile','Voce maschile','Pianoforte','Violoncello','Violino',
  'Arpa','Sassofono','Percussioni classiche','Percussioni ritmiche',
  'Chitarra','Flauto','Tromba','DJ','DJ + strumento live','Karaoke','Karaoke + DJ'
]

export const WEDDING_MOMENTS = [
  'Accoglienza','Cerimonia','Firma','Uscita sposi',
  'Aperitivo / Cocktail','Cena / Pranzo','Taglio torta',
  'Primo ballo','Party / DJ set','Outro'
]

export const EVENT_MOMENTS = [
  'Accoglienza','Aperitivo / Cocktail','Cena / Pranzo','Intrattenimento','Chiusura'
]

export const MOMENT_EXTRA_COST = {
  'Accoglienza': 50, 'Cerimonia': 100, 'Firma': 50, 'Uscita sposi': 50,
  'Aperitivo / Cocktail': 100, 'Cena / Pranzo': 100, 'Taglio torta': 50,
  'Primo ballo': 50, 'Party / DJ set': 100, 'Outro': 50,
  'Intrattenimento': 100, 'Chiusura': 50
}

// Listino prezzi clienti
export const PRICE_LIST = {
  pop:      { 1: 350, 2: 600, 3: 750, 4: 900 },
  classica: { 1: 400, 2: 650, 3: 800, 4: 900 },
  karaoke:  200,
  dj:       500,
  dj_karaoke: 600
}

export const FOLLOW_UPS = [
  'Inviare preventivo','Inviare listino prezzi','Inviare libretto matrimoni',
  'Inviare link sito web','Inviare pacchetti speciali','Inviare repertorio'
]

export const REFUSALS = [
  'Budget troppo basso','Hanno scelto altri musicisti',
  'Matrimonio annullato','Nessuna risposta','Altro'
]

export const CAT_CFG = {
  matrimonio: { label: 'Matrimonio',    color: '#C9A84C', bg: 'rgba(201,168,76,.12)'  },
  fiera:      { label: 'Fiera / Promo', color: '#4A90D9', bg: 'rgba(74,144,217,.1)'   },
  aziendale:  { label: 'Aziendale',     color: '#3D9E6E', bg: 'rgba(61,158,110,.1)'   },
  privato:    { label: 'Festa privata', color: '#C96090', bg: 'rgba(201,96,144,.1)'   }
}

export const STATUS_CFG = {
  in_attesa:    { label: 'In attesa',    color: '#C98A1A', bg: 'rgba(201,138,26,.1)'  },
  confermato:   { label: 'Confermato',   color: '#3D9E6E', bg: 'rgba(61,158,110,.1)'  },
  rifiutato:    { label: 'Rifiutato',    color: '#C9503A', bg: 'rgba(201,80,58,.1)'   },
  non_risponde: { label: 'Non risponde', color: '#888',    bg: 'rgba(136,136,136,.1)' }
}

export const TERMINI_CONDIZIONI = `• Le quote indicate non includono eventuali costi SIAE.
• Per confermare definitivamente la data è richiesto un acconto pari al 25% dell'importo concordato.
• L'acconto garantisce il blocco esclusivo della data e non è rimborsabile in caso di annullamento dell'evento da parte degli sposi.
• Eventuali variazioni della data dell'evento verranno valutate in base al preavviso fornito e alla nuova disponibilità dei musicisti.`

export const SERVIZI_INCLUSI = `• Fornitura di tutta l'attrezzatura tecnica necessaria, comprensiva di impianto audio professionale, microfoni e strumentazione dedicata.
• Predisposizione di postazioni musicali complete comprensive di effetti luce già allestite e pronte all'uso nei diversi momenti dell'evento.
• Possibilità di personalizzare la scaletta musicale, inserendo nel nostro repertorio i vostri brani preferiti.
• Supporto nella definizione dei brani della cerimonia.
• Gestione completa degli aspetti organizzativi e tecnici, con sopralluogo e coordinamento preventivo.
• Assistenza e consulenza dedicata durante tutta la fase di preparazione dell'evento.`
