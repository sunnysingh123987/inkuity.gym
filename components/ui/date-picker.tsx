'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  type?: 'date' | 'datetime-local' | 'month'
  placeholder?: string
  className?: string
  id?: string
  min?: string
  max?: string
  required?: boolean
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  type = 'date',
  placeholder,
  className,
  id,
  min,
  max,
  required,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const parseDate = (val: string): Date | undefined => {
    if (!val) return undefined
    const d = new Date(val + (type === 'date' ? 'T00:00:00' : ''))
    return isNaN(d.getTime()) ? undefined : d
  }

  const formatDisplay = (val: string) => {
    if (!val) return placeholder || 'Select date...'
    const d = parseDate(val)
    if (!d) return placeholder || 'Select date...'
    if (type === 'datetime-local') {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (type === 'month') {
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    }
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    // Format as YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    onChange(`${year}-${month}-${day}`)
    setOpen(false)
  }

  const selectedDate = parseDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left truncate">{formatDisplay(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
