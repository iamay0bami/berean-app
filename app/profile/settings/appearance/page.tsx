import AppShell from '@/components/app-shell'
import SettingsAppearanceView from '@/components/settings-appearance-view'
import { readTheme } from '@/lib/theme'

export default async function AppearancePage() {
  const theme = await readTheme()
  return <AppShell><SettingsAppearanceView initialTheme={theme} /></AppShell>
}
