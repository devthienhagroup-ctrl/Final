export type LocaleMode = 'vi' | 'en-US' | 'de'

export async function autoTranslateFromVietnamese(text: string, target: 'en-US' | 'de'): Promise<string> {
  const source = text.trim()
  if (!source) return ''

  const targetLocale = target === 'en-US' ? 'en' : target
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLocale}&dt=t&q=${encodeURIComponent(source)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('translate-failed')
    const data = await response.json()
    const translated = Array.isArray(data?.[0]) ? data[0].map((part: any) => part?.[0] || '').join('') : ''
    return translated || source
  } catch {
    return source
  }
}
