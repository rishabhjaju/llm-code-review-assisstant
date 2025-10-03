'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export function Tabs({ defaultValue = 'code', value, onValueChange, children }: { defaultValue?: string, value?: string, onValueChange?: (v: string) => void, children: React.ReactNode }) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} value={value} onValueChange={onValueChange} className="w-full">
      {children}
    </TabsPrimitive.Root>
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <TabsPrimitive.List className="flex gap-2 overflow-auto" aria-label="Manage Tabs">
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ value, children }: { value: string, children: React.ReactNode }) {
  return (
    <TabsPrimitive.Trigger value={value} className={cn('px-3 py-1 rounded-md border flex items-center gap-2', 'data-[state=active]:bg-primary-600 data-[state=active]:text-white', 'transition-all duration-150') }>
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({ value, children }: { value: string, children: React.ReactNode }) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn(
        'p-4',
        // animate slide + fade using radix data-state selectors
        'data-[state=active]:opacity-100 data-[state=inactive]:opacity-0',
        'data-[state=active]:translate-y-0 data-[state=inactive]:-translate-y-2',
        // ensure inactive content doesn't take layout space
        'data-[state=inactive]:hidden data-[state=active]:block',
        'transition-all duration-300 ease-in-out'
      )}
    >
      {children}
    </TabsPrimitive.Content>
  )
}
