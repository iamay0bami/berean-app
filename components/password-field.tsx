'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

type PasswordFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
  minLength?: number
  label?: string
  id?: string
  name?: string
  describedBy?: string
  invalid?: boolean
  inputClassName?: string
}

export default function PasswordField({ value, onChange, placeholder, autoComplete, minLength = 6, label = 'password', id, name, describedBy, invalid = false, inputClassName }: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  return <div className="password-field"><input id={id} name={name} className={inputClassName} required minLength={minLength} type={show ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-describedby={describedBy} aria-invalid={invalid || undefined} /><button type="button" className="password-toggle" aria-label={`${show ? 'Hide' : 'Show'} ${label}`} onClick={() => setShow(current => !current)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
}
