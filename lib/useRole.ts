'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useRole() {
  const [role, setRole] = useState<'admin' | 'membre' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('profils')
        .select('role')
        .eq('id', user.id)
        .single()
      setRole(data?.role || 'membre')
      setLoading(false)
    }
    charger()
  }, [])

  return { role, loading, estAdmin: role === 'admin' }
}
