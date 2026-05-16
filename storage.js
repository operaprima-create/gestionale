import { supabase, hasSupabase } from './supabase.js'

// ── SUPABASE STORAGE ──────────────────────────────────────────────────────────
// Usa Supabase se configurato, altrimenti localStorage (solo offline/demo)
// La tabella Supabase si chiama "events" con colonne: id (text PK), data (jsonb)

export async function loadItems() {
  if (hasSupabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('data')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data.map(row => row.data)
    } catch (e) {
      console.error('Supabase load error:', e)
      return []
    }
  }
  // Fallback localStorage
  try {
    const raw = localStorage.getItem('opera_prima_v6')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export async function saveItem(item) {
  if (hasSupabase) {
    try {
      const { error } = await supabase
        .from('events')
        .upsert({ id: item.id, data: item }, { onConflict: 'id' })
      if (error) throw error
      return true
    } catch (e) {
      console.error('Supabase save error:', e)
      return false
    }
  }
  // Fallback localStorage
  try {
    const items = await loadItems()
    const idx = items.findIndex(x => x.id === item.id)
    if (idx >= 0) items[idx] = item; else items.push(item)
    localStorage.setItem('opera_prima_v6', JSON.stringify(items))
    return true
  } catch { return false }
}

export async function deleteItem(id) {
  if (hasSupabase) {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (e) {
      console.error('Supabase delete error:', e)
      return false
    }
  }
  // Fallback localStorage
  try {
    const items = await loadItems()
    localStorage.setItem('opera_prima_v6', JSON.stringify(items.filter(x => x.id !== id)))
    return true
  } catch { return false }
}

// Realtime subscription (solo con Supabase)
export function subscribeToChanges(callback) {
  if (!hasSupabase) return () => {}
  const channel = supabase
    .channel('events-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
