'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface StatRole {
  nom: string
  count: number
  couleur: string
}

interface Stats {
  totalMembres: number
  totalRepetitions: number
  totalMedias: number
  totalChants: number
  rolesStats: StatRole[]
  membresParMois: { mois: string; count: number }[]
}

const COULEURS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
  'bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-red-500'
]

export default function PageStatistiques() {
  const [stats, setStats] = useState<Stats>({
    totalMembres: 0,
    totalRepetitions: 0,
    totalMedias: 0,
    totalChants: 0,
    rolesStats: [],
    membresParMois: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function charger() {
      const [membres, repetitions, medias, chants, roles] = await Promise.all([
        supabase.from('membres').select('id, date_integration', { count: 'exact' }),
        supabase.from('repetitions').select('id', { count: 'exact' }),
        supabase.from('medias').select('id', { count: 'exact' }),
        supabase.from('chants').select('id', { count: 'exact' }),
        supabase.from('roles').select('nom, membre_roles(count)'),
      ])

      // Statistiques par rôle
      const rolesStats = (roles.data || [])
        .map((r: any, i: number) => ({
          nom: r.nom,
          count: r.membre_roles?.[0]?.count || 0,
          couleur: COULEURS[i % COULEURS.length],
        }))
        .sort((a, b) => b.count - a.count)

      // Membres par mois (6 derniers mois)
      const tousLesMembres = membres.data || []
      const maintenant = new Date()
      const membresParMois = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - (5 - i), 1)
        const mois = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
        const count = tousLesMembres.filter(m => {
          const d = new Date(m.date_integration)
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
        }).length
        return { mois, count }
      })

      setStats({
        totalMembres: membres.count || 0,
        totalRepetitions: repetitions.count || 0,
        totalMedias: medias.count || 0,
        totalChants: chants.count || 0,
        rolesStats,
        membresParMois,
      })
      setLoading(false)
    }
    charger()
  }, [])

  const maxRole = Math.max(...stats.rolesStats.map(r => r.count), 1)
  const maxMois = Math.max(...stats.membresParMois.map(m => m.count), 1)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Chargement...</p>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Statistiques</h2>
        <p className="text-gray-500 mt-1">Vue d'ensemble chiffrée du groupe</p>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Membres', valeur: stats.totalMembres, emoji: '👥', couleur: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Répétitions', valeur: stats.totalRepetitions, emoji: '📅', couleur: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Médias', valeur: stats.totalMedias, emoji: '🖼️', couleur: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Chants', valeur: stats.totalChants, emoji: '🎵', couleur: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {c.emoji}
            </div>
            <p className="text-gray-500 text-sm">{c.label}</p>
            <p className={`text-4xl font-bold mt-1 ${c.couleur}`}>{c.valeur}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique rôles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Membres par rôle</h3>
          {stats.totalMembres === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Aucun membre enregistré</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.rolesStats.map(role => (
                <div key={role.nom}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 font-medium">{role.nom}</span>
                    <span className="text-sm font-bold text-gray-800">{role.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${role.couleur} h-3 rounded-full transition-all duration-700`}
                      style={{ width: `${(role.count / maxRole) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Graphique intégrations par mois */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Nouvelles intégrations (6 mois)</h3>
          <div className="flex items-end gap-3 h-40">
            {stats.membresParMois.map(({ mois, count }) => (
              <div key={mois} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-gray-700">
                  {count > 0 ? count : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '100px' }}>
                  <div
                    className="w-full bg-indigo-400 rounded-t-lg transition-all duration-700 hover:bg-indigo-500"
                    style={{ height: `${Math.max(4, (count / maxMois) * 100)}px` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{mois}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition médias */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition des médias</h3>
          <MediasRepartition />
        </div>

        {/* Taux de présence */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé global</h3>
          <div className="space-y-3">
            {[
              { label: 'Total membres', valeur: stats.totalMembres, couleur: 'bg-indigo-500' },
              { label: 'Total répétitions', valeur: stats.totalRepetitions, couleur: 'bg-green-500' },
              { label: 'Photos & vidéos', valeur: stats.totalMedias, couleur: 'bg-purple-500' },
              { label: 'Chants enregistrés', valeur: stats.totalChants, couleur: 'bg-orange-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.couleur}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="font-bold text-gray-800">{item.valeur}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MediasRepartition() {
  const [photos, setPhotos] = useState(0)
  const [videos, setVideos] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from('medias').select('id', { count: 'exact' }).eq('type', 'photo'),
      supabase.from('medias').select('id', { count: 'exact' }).eq('type', 'video'),
    ]).then(([p, v]) => {
      setPhotos(p.count || 0)
      setVideos(v.count || 0)
    })
  }, [])

  const total = photos + videos
  const pctPhotos = total > 0 ? Math.round((photos / total) * 100) : 0
  const pctVideos = total > 0 ? Math.round((videos / total) * 100) : 0

  if (total === 0) return (
    <div className="text-center py-8">
      <p className="text-gray-400">Aucun média enregistré</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">🖼️ Photos</span>
          <span className="text-sm font-bold text-gray-800">{photos} ({pctPhotos}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4">
          <div className="bg-purple-400 h-4 rounded-full" style={{ width: `${pctPhotos}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">🎬 Vidéos</span>
          <span className="text-sm font-bold text-gray-800">{videos} ({pctVideos}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4">
          <div className="bg-pink-400 h-4 rounded-full" style={{ width: `${pctVideos}%` }} />
        </div>
      </div>
      <p className="text-center text-gray-400 text-sm mt-2">Total : {total} fichier{total > 1 ? 's' : ''}</p>
    </div>
  )
}