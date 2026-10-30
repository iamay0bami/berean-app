export function normalizeHumanText(value: string): string {
  return value.trim().normalize('NFC')
}

export function normalizeHumanTextArray(values: readonly string[] | null | undefined): string[] {
  return (values ?? []).map(normalizeHumanText).filter(Boolean)
}

export function normalizeOptionalHumanText(value: string | null | undefined): string | null {
  const normalized = normalizeHumanText(value ?? '')
  return normalized || null
}
