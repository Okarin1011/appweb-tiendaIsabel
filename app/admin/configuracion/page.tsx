import { createClient } from '@/lib/supabase/server'
import { StoreSettingsForm } from '@/components/admin/store-settings-form'

async function getSettings() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('store_settings')
    .select('*')
    .single()

  return data
}

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">Ajustes generales de la tienda</p>
      </div>

      <StoreSettingsForm settings={settings} />
    </div>
  )
}
