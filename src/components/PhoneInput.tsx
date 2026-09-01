import { COUNTRY_CALLING_CODES } from '../data/countryCallingCodes'

function splitPhone(value: string) {
  const trimmed = value.trim()
  const match = [...COUNTRY_CALLING_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => trimmed.startsWith(item.code))
  if (!match) return { code: '+44', number: trimmed.replace(/^\+\d[\d\s-]*\s*/, '') }
  return { code: match.code, number: trimmed.slice(match.code.length).trim() }
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = '7700 900000',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const { code, number } = splitPhone(value)
  const update = (nextCode: string, nextNumber: string) => {
    const cleaned = nextNumber.replace(/[^0-9\s()-]/g, '')
    onChange(cleaned.trim() ? `${nextCode} ${cleaned}` : '')
  }

  return (
    <div className="flex rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500 overflow-hidden">
      <select
        aria-label="Country calling code"
        value={COUNTRY_CALLING_CODES.some((item) => item.code === code) ? code : '+44'}
        onChange={(e) => update(e.target.value, number)}
        className="w-[104px] shrink-0 border-r border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-700 focus:outline-none"
      >
        {COUNTRY_CALLING_CODES.map((item, index) => (
          <option key={`${item.iso}-${item.code}-${index}`} value={item.code}>{item.iso} {item.code}</option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        value={number}
        onChange={(e) => update(code, e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 px-3 py-2 text-sm text-slate-700 focus:outline-none"
      />
    </div>
  )
}
