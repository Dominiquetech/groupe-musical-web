'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Profil {
  email: string
  role: 'admin' | 'membre'
}

const navigationAdmin = [
  { nom: '🏠 Tableau de bord', href: '/', icone: '🏠' },
  { nom: '👥 Membres', href: '/membres', icone: '👥' },
  { nom: '🎭 Rôles', href: '/roles', icone: '🎭' },
  { nom: '🖼️ Médias', href: '/medias', icone: '🖼️' },
  { nom: '🎵 Chants', href: '/chants', icone: '🎵' },
  { nom: '📅 Répétitions', href: '/repetitions', icone: '📅' },
  { nom: '📊 Statistiques', href: '/statistiques', icone: '📊' },
]

const navigationMembre = [
  { nom: '🏠 Tableau de bord', href: '/', icone: '🏠' },
  { nom: '👥 Membres', href: '/membres', icone: '👥' },
  { nom: '🖼️ Médias', href: '/medias', icone: '🖼️' },
  { nom: '🎵 Chants', href: '/chants', icone: '🎵' },
  { nom: '📅 Répétitions', href: '/repetitions', icone: '📅' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profil, setProfil] = useState<Profil | null>(null)
  const [menuOuvert, setMenuOuvert] = useState(false) // ✅ état menu burger

  useEffect(() => {
    async function chargerProfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('profils')
        .select('email, role')
        .eq('id', user.id)
        .single()
      console.log('Profil chargé:', data, 'Erreur:', error)
      setProfil(data)
    }
    chargerProfil()
  }, [])

  // Fermer le menu quand on change de page
  useEffect(() => {
    setMenuOuvert(false)
  }, [pathname])

  async function seDeconnecter() {
    await supabase.auth.signOut()
    router.push('/connexion')
    router.refresh()
  }

  const navigation = profil?.role === 'admin' ? navigationAdmin : navigationMembre
  // Barre du bas : 5 premiers liens max
  const navBas = navigation.slice(0, 5)

  return (
    <>
      {/* ============================================
          DESKTOP : Sidebar classique à gauche
          ============================================ */}
      <aside className="hidden md:flex w-64 min-h-screen bg-indigo-900 text-white flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-indigo-700">
          <h1 className="text-xl font-bold">🎶 Fusion Gospel</h1>
          <p className="text-indigo-300 text-sm mt-1">
            {profil?.role === 'admin' ? '👑 Administrateur' : '🎵 Membre'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              {item.nom}
            </Link>
          ))}
        </nav>

        {/* Profil + déconnexion */}
        <div className="p-4 border-t border-indigo-700">
          {profil && (
            <div className="mb-3 px-2">
              <p className="text-indigo-300 text-xs truncate">{profil.email}</p>
            </div>
          )}
          <button
            onClick={seDeconnecter}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-indigo-300 hover:bg-indigo-800 hover:text-white transition-colors"
          >
            🚪 Se déconnecter
          </button>
        </div>
      </aside>

      {/* ============================================
          MOBILE : Header en haut avec burger
          ============================================ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-indigo-900 text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <h1 className="text-lg font-bold">🎶 Fusion Gospel</h1>
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          className="p-2 rounded-lg hover:bg-indigo-700 transition-colors"
          aria-label="Menu"
        >
          {menuOuvert ? (
            // Icône X
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Icône hamburger
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* ============================================
          MOBILE : Menu déroulant (burger ouvert)
          ============================================ */}
      {menuOuvert && (
        <>
          {/* Overlay sombre derrière le menu */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMenuOuvert(false)}
          />
          {/* Menu latéral */}
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-indigo-900 text-white z-50 flex flex-col shadow-2xl">
            {/* Header du menu */}
            <div className="p-6 border-b border-indigo-700 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">🎶 Fusion Gospel</h1>
                <p className="text-indigo-300 text-sm mt-1">
                  {profil?.role === 'admin' ? '👑 Administrateur' : '🎵 Membre'}
                </p>
              </div>
              <button
                onClick={() => setMenuOuvert(false)}
                className="p-2 rounded-lg hover:bg-indigo-700"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="15" y1="5" x2="5" y2="15" />
                  <line x1="5" y1="5" x2="15" y2="15" />
                </svg>
              </button>
            </div>

            {/* Liens navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-indigo-700 text-white'
                      : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                  }`}
                >
                  {item.nom}
                </Link>
              ))}
            </nav>

            {/* Profil + déconnexion */}
            <div className="p-4 border-t border-indigo-700">
              {profil && (
                <div className="mb-3 px-2">
                  <p className="text-indigo-300 text-xs truncate">{profil.email}</p>
                </div>
              )}
              <button
                onClick={seDeconnecter}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-indigo-300 hover:bg-indigo-800 hover:text-white transition-colors"
              >
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================
          MOBILE : Barre de navigation en bas
          ============================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-indigo-900 border-t border-indigo-700 flex">
        {navBas.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
              pathname === item.href
                ? 'text-white bg-indigo-700'
                : 'text-indigo-300 hover:text-white'
            }`}
          >
            <span className="text-xl mb-1">{item.icone}</span>
            <span className="text-[10px] truncate px-1">
              {item.nom.replace(/^[\S]+\s/, '')} {/* Enlève l'emoji du label */}
            </span>
          </Link>
        ))}
      </nav>
    </>
  )
}