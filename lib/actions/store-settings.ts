'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { StoreSettingsUpdate } from '@/lib/types/database'

// =============================================
// CONFIGURACIÓN DE LA TIENDA
// =============================================

export async function getStoreSettings() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data
}

export async function updateStoreSettings(idOrSettings: string | StoreSettingsUpdate | null, settingsArg?: StoreSettingsUpdate) {
  const supabase = await createClient()

  // Support both updateStoreSettings(data) and updateStoreSettings(id, data)
  let settings: StoreSettingsUpdate
  let explicitId: string | null = null

  if (typeof idOrSettings === 'string') {
    explicitId = idOrSettings
    settings = settingsArg!
  } else {
    settings = idOrSettings || {}
  }

  // Get the existing settings ID
  const { data: existing, error: fetchError } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') throw new Error(fetchError.message)

  const targetId = explicitId || existing?.id

  let data
  let error

  if (targetId) {
    // Update existing
    const result = await supabase
      .from('store_settings')
      .update(settings)
      .eq('id', targetId)
      .select()
      .single()

    data = result.data
    error = result.error
  } else {
    // Insert new
    const result = await supabase
      .from('store_settings')
      .insert({
        store_name: settings.store_name || 'Mi Tienda',
        ...settings
      })
      .select()
      .single()

    data = result.data
    error = result.error
  }

  if (error) throw new Error(error.message)

  revalidateTag('store-settings')
  return data
}

export async function updateStoreLogo(logoUrl: string) {
  return updateStoreSettings({ logo_url: logoUrl })
}

export async function updateStoreSocialMedia(socialMedia: {
  instagram_url?: string
  facebook_url?: string
  tiktok_url?: string
}) {
  return updateStoreSettings(socialMedia)
}

export async function updateStoreContact(contact: {
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  city?: string
}) {
  return updateStoreSettings(contact)
}

export async function updateStoreTaxRate(taxRate: number) {
  return updateStoreSettings({ tax_rate: taxRate })
}
