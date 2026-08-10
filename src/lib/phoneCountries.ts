/** Claves telefónicas internacionales (E.164). Default: México +52. */

export type PhoneCountry = {
  iso: string
  dial: string
  flag: string
  names: { es: string; en: string; pt: string }
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'MX', dial: '52', flag: '🇲🇽', names: { es: 'México', en: 'Mexico', pt: 'México' } },
  { iso: 'US', dial: '1', flag: '🇺🇸', names: { es: 'Estados Unidos', en: 'United States', pt: 'Estados Unidos' } },
  { iso: 'CA', dial: '1', flag: '🇨🇦', names: { es: 'Canadá', en: 'Canada', pt: 'Canadá' } },
  { iso: 'GT', dial: '502', flag: '🇬🇹', names: { es: 'Guatemala', en: 'Guatemala', pt: 'Guatemala' } },
  { iso: 'BZ', dial: '501', flag: '🇧🇿', names: { es: 'Belice', en: 'Belize', pt: 'Belize' } },
  { iso: 'SV', dial: '503', flag: '🇸🇻', names: { es: 'El Salvador', en: 'El Salvador', pt: 'El Salvador' } },
  { iso: 'HN', dial: '504', flag: '🇭🇳', names: { es: 'Honduras', en: 'Honduras', pt: 'Honduras' } },
  { iso: 'NI', dial: '505', flag: '🇳🇮', names: { es: 'Nicaragua', en: 'Nicaragua', pt: 'Nicarágua' } },
  { iso: 'CR', dial: '506', flag: '🇨🇷', names: { es: 'Costa Rica', en: 'Costa Rica', pt: 'Costa Rica' } },
  { iso: 'PA', dial: '507', flag: '🇵🇦', names: { es: 'Panamá', en: 'Panama', pt: 'Panamá' } },
  { iso: 'CU', dial: '53', flag: '🇨🇺', names: { es: 'Cuba', en: 'Cuba', pt: 'Cuba' } },
  { iso: 'DO', dial: '1', flag: '🇩🇴', names: { es: 'República Dominicana', en: 'Dominican Republic', pt: 'República Dominicana' } },
  { iso: 'PR', dial: '1', flag: '🇵🇷', names: { es: 'Puerto Rico', en: 'Puerto Rico', pt: 'Porto Rico' } },
  { iso: 'CO', dial: '57', flag: '🇨🇴', names: { es: 'Colombia', en: 'Colombia', pt: 'Colômbia' } },
  { iso: 'VE', dial: '58', flag: '🇻🇪', names: { es: 'Venezuela', en: 'Venezuela', pt: 'Venezuela' } },
  { iso: 'EC', dial: '593', flag: '🇪🇨', names: { es: 'Ecuador', en: 'Ecuador', pt: 'Equador' } },
  { iso: 'PE', dial: '51', flag: '🇵🇪', names: { es: 'Perú', en: 'Peru', pt: 'Peru' } },
  { iso: 'BO', dial: '591', flag: '🇧🇴', names: { es: 'Bolivia', en: 'Bolivia', pt: 'Bolívia' } },
  { iso: 'CL', dial: '56', flag: '🇨🇱', names: { es: 'Chile', en: 'Chile', pt: 'Chile' } },
  { iso: 'AR', dial: '54', flag: '🇦🇷', names: { es: 'Argentina', en: 'Argentina', pt: 'Argentina' } },
  { iso: 'UY', dial: '598', flag: '🇺🇾', names: { es: 'Uruguay', en: 'Uruguay', pt: 'Uruguai' } },
  { iso: 'PY', dial: '595', flag: '🇵🇾', names: { es: 'Paraguay', en: 'Paraguay', pt: 'Paraguai' } },
  { iso: 'BR', dial: '55', flag: '🇧🇷', names: { es: 'Brasil', en: 'Brazil', pt: 'Brasil' } },
  { iso: 'ES', dial: '34', flag: '🇪🇸', names: { es: 'España', en: 'Spain', pt: 'Espanha' } },
  { iso: 'PT', dial: '351', flag: '🇵🇹', names: { es: 'Portugal', en: 'Portugal', pt: 'Portugal' } },
  { iso: 'FR', dial: '33', flag: '🇫🇷', names: { es: 'Francia', en: 'France', pt: 'França' } },
  { iso: 'DE', dial: '49', flag: '🇩🇪', names: { es: 'Alemania', en: 'Germany', pt: 'Alemanha' } },
  { iso: 'IT', dial: '39', flag: '🇮🇹', names: { es: 'Italia', en: 'Italy', pt: 'Itália' } },
  { iso: 'GB', dial: '44', flag: '🇬🇧', names: { es: 'Reino Unido', en: 'United Kingdom', pt: 'Reino Unido' } },
  { iso: 'IE', dial: '353', flag: '🇮🇪', names: { es: 'Irlanda', en: 'Ireland', pt: 'Irlanda' } },
  { iso: 'NL', dial: '31', flag: '🇳🇱', names: { es: 'Países Bajos', en: 'Netherlands', pt: 'Países Baixos' } },
  { iso: 'BE', dial: '32', flag: '🇧🇪', names: { es: 'Bélgica', en: 'Belgium', pt: 'Bélgica' } },
  { iso: 'CH', dial: '41', flag: '🇨🇭', names: { es: 'Suiza', en: 'Switzerland', pt: 'Suíça' } },
  { iso: 'AT', dial: '43', flag: '🇦🇹', names: { es: 'Austria', en: 'Austria', pt: 'Áustria' } },
  { iso: 'SE', dial: '46', flag: '🇸🇪', names: { es: 'Suecia', en: 'Sweden', pt: 'Suécia' } },
  { iso: 'NO', dial: '47', flag: '🇳🇴', names: { es: 'Noruega', en: 'Norway', pt: 'Noruega' } },
  { iso: 'DK', dial: '45', flag: '🇩🇰', names: { es: 'Dinamarca', en: 'Denmark', pt: 'Dinamarca' } },
  { iso: 'FI', dial: '358', flag: '🇫🇮', names: { es: 'Finlandia', en: 'Finland', pt: 'Finlândia' } },
  { iso: 'PL', dial: '48', flag: '🇵🇱', names: { es: 'Polonia', en: 'Poland', pt: 'Polônia' } },
  { iso: 'CZ', dial: '420', flag: '🇨🇿', names: { es: 'Chequia', en: 'Czechia', pt: 'Tchéquia' } },
  { iso: 'RO', dial: '40', flag: '🇷🇴', names: { es: 'Rumanía', en: 'Romania', pt: 'Romênia' } },
  { iso: 'GR', dial: '30', flag: '🇬🇷', names: { es: 'Grecia', en: 'Greece', pt: 'Grécia' } },
  { iso: 'TR', dial: '90', flag: '🇹🇷', names: { es: 'Turquía', en: 'Turkey', pt: 'Turquia' } },
  { iso: 'RU', dial: '7', flag: '🇷🇺', names: { es: 'Rusia', en: 'Russia', pt: 'Rússia' } },
  { iso: 'UA', dial: '380', flag: '🇺🇦', names: { es: 'Ucrania', en: 'Ukraine', pt: 'Ucrânia' } },
  { iso: 'IL', dial: '972', flag: '🇮🇱', names: { es: 'Israel', en: 'Israel', pt: 'Israel' } },
  { iso: 'AE', dial: '971', flag: '🇦🇪', names: { es: 'Emiratos Árabes', en: 'United Arab Emirates', pt: 'Emirados Árabes' } },
  { iso: 'SA', dial: '966', flag: '🇸🇦', names: { es: 'Arabia Saudita', en: 'Saudi Arabia', pt: 'Arábia Saudita' } },
  { iso: 'EG', dial: '20', flag: '🇪🇬', names: { es: 'Egipto', en: 'Egypt', pt: 'Egito' } },
  { iso: 'ZA', dial: '27', flag: '🇿🇦', names: { es: 'Sudáfrica', en: 'South Africa', pt: 'África do Sul' } },
  { iso: 'NG', dial: '234', flag: '🇳🇬', names: { es: 'Nigeria', en: 'Nigeria', pt: 'Nigéria' } },
  { iso: 'KE', dial: '254', flag: '🇰🇪', names: { es: 'Kenia', en: 'Kenya', pt: 'Quênia' } },
  { iso: 'IN', dial: '91', flag: '🇮🇳', names: { es: 'India', en: 'India', pt: 'Índia' } },
  { iso: 'PK', dial: '92', flag: '🇵🇰', names: { es: 'Pakistán', en: 'Pakistan', pt: 'Paquistão' } },
  { iso: 'BD', dial: '880', flag: '🇧🇩', names: { es: 'Bangladés', en: 'Bangladesh', pt: 'Bangladesh' } },
  { iso: 'CN', dial: '86', flag: '🇨🇳', names: { es: 'China', en: 'China', pt: 'China' } },
  { iso: 'JP', dial: '81', flag: '🇯🇵', names: { es: 'Japón', en: 'Japan', pt: 'Japão' } },
  { iso: 'KR', dial: '82', flag: '🇰🇷', names: { es: 'Corea del Sur', en: 'South Korea', pt: 'Coreia do Sul' } },
  { iso: 'TW', dial: '886', flag: '🇹🇼', names: { es: 'Taiwán', en: 'Taiwan', pt: 'Taiwan' } },
  { iso: 'HK', dial: '852', flag: '🇭🇰', names: { es: 'Hong Kong', en: 'Hong Kong', pt: 'Hong Kong' } },
  { iso: 'SG', dial: '65', flag: '🇸🇬', names: { es: 'Singapur', en: 'Singapore', pt: 'Singapura' } },
  { iso: 'MY', dial: '60', flag: '🇲🇾', names: { es: 'Malasia', en: 'Malaysia', pt: 'Malásia' } },
  { iso: 'TH', dial: '66', flag: '🇹🇭', names: { es: 'Tailandia', en: 'Thailand', pt: 'Tailândia' } },
  { iso: 'VN', dial: '84', flag: '🇻🇳', names: { es: 'Vietnam', en: 'Vietnam', pt: 'Vietnã' } },
  { iso: 'PH', dial: '63', flag: '🇵🇭', names: { es: 'Filipinas', en: 'Philippines', pt: 'Filipinas' } },
  { iso: 'ID', dial: '62', flag: '🇮🇩', names: { es: 'Indonesia', en: 'Indonesia', pt: 'Indonésia' } },
  { iso: 'AU', dial: '61', flag: '🇦🇺', names: { es: 'Australia', en: 'Australia', pt: 'Austrália' } },
  { iso: 'NZ', dial: '64', flag: '🇳🇿', names: { es: 'Nueva Zelanda', en: 'New Zealand', pt: 'Nova Zelândia' } },
]

export const DEFAULT_PHONE_COUNTRY_ISO = 'MX'

export function findPhoneCountry(iso: string): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((c) => c.iso === iso) ||
    PHONE_COUNTRIES.find((c) => c.iso === DEFAULT_PHONE_COUNTRY_ISO)!
  )
}

export function filterPhoneCountries(
  query: string,
  lang: 'es' | 'en' | 'pt',
): PhoneCountry[] {
  const q = query.trim().toLowerCase()
  if (!q) return PHONE_COUNTRIES
  const digits = q.replace(/\D/g, '')
  return PHONE_COUNTRIES.filter((c) => {
    const name = c.names[lang].toLowerCase()
    if (name.includes(q)) return true
    if (c.iso.toLowerCase().includes(q)) return true
    if (digits && c.dial.includes(digits)) return true
    if (`+${c.dial}`.includes(q) || c.dial.includes(q)) return true
    return false
  })
}

/** Une clave de país + número local → "+52XXXXXXXXXX" */
export function buildInternationalPhone(
  dial: string,
  localNumber: string,
): string {
  const localDigits = String(localNumber || '').replace(/\D/g, '')
  const dialDigits = String(dial || '').replace(/\D/g, '')
  if (!dialDigits || !localDigits) return ''
  return `+${dialDigits}${localDigits}`
}
