'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [verifie, setVerifie] = useState(false)
  const [connecte, setConnecte] = useState(false)

  useEffect(() => {
    async function verifierAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && pathname !== '/connexion' && pathname !== '/inscription') {
        router.push('/connexion')
      } else {
        setConnecte(!!user)
        setVerifie(true)
      }
    }
    verifierAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/connexion')
      } else if (event === 'SIGNED_IN') {
        setConnecte(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (pathname === '/connexion' || pathname === '/inscription') {
    return <>{children}</>
  }

  // Vérification en cours
  if (!verifie) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🎶</p>
          <p className="text-indigo-300">Chargement...</p>
        </div>
      </div>
    )
  }

  // Connecté — afficher avec sidebar
  if (connecte) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className={`
          flex-1 overflow-y-auto
          p-4 md:p-8
          pt-20 md:pt-8
          pb-24 md:pb-8
        `}>
          {/* 
            pt-20  → padding top sur mobile (56px header + marge)
            pb-24  → padding bottom sur mobile (64px barre bas + marge)
            md:pt-8 md:pb-8 → padding normal sur desktop
          */}
          {children}
        </main>
      </div>
    )
  }

  return null
}