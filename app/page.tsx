'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
  totalMembres: number
  parRole: { nom: string; count: number }[]
  totalRepetitions: number
  totalMedias: number
  totalChants: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMembres: 0,
    parRole: [],
    totalRepetitions: 0,
    totalMedias: 0,
    totalChants: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function chargerStats() {
      const [membres, roles, repetitions, medias, chants] = await Promise.all([
        supabase.from('membres').select('id', { count: 'exact' }),
        supabase.from('roles').select('nom, membre_roles(count)'),
        supabase.from('repetitions').select('id', { count: 'exact' }),
        supabase.from('medias').select('id', { count: 'exact' }),
        supabase.from('chants').select('id', { count: 'exact' }),
      ])

      setStats({
        totalMembres: membres.count || 0,
        parRole: (roles.data || []).map((r: any) => ({
          nom: r.nom,
          count: r.membre_roles?.[0]?.count || 0,
        })),
        totalRepetitions: repetitions.count || 0,
        totalMedias: medias.count || 0,
        totalChants: chants.count || 0,
      })
      setLoading(false)
    }
    chargerStats()
  }, [])

  const cartes = [
    { label: 'Membres', valeur: stats.totalMembres, emoji: '👥', href: '/membres', couleur: 'bg-blue-500' },
    { label: 'Répétitions', valeur: stats.totalRepetitions, emoji: '📅', href: '/repetitions', couleur: 'bg-green-500' },
    { label: 'Médias', valeur: stats.totalMedias, emoji: '🖼️', href: '/medias', couleur: 'bg-purple-500' },
    { label: 'Chants', valeur: stats.totalChants, emoji: '🎵', href: '/chants', couleur: 'bg-orange-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Tableau de bord</h2>
        <p className="text-gray-500 mt-1">Vue d'ensemble de votre groupe musical</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cartes.map((carte) => (
          <Link key={carte.label} href={carte.href}>
            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
              <div className={`w-12 h-12 ${carte.couleur} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                {carte.emoji}
              </div>
              <p className="text-gray-500 text-sm">{carte.label}</p>
              <p className="text-4xl font-bold text-gray-800 mt-1">{carte.valeur}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Répartition par rôle */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par rôle</h3>
        {stats.totalMembres === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Aucun membre pour l'instant</p>
            <Link
              href="/membres"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ajouter le premier membre
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.parRole.filter(r => r.count > 0).map((role) => (
              <div key={role.nom} className="flex items-center gap-3">
                <span className="w-32 text-sm text-gray-600">{role.nom}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.max(5, (role.count / stats.totalMembres) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-6">{role.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}