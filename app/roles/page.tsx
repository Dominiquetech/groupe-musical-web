'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Role {
  id: string
  nom: string
  membre_roles: { count: number }[]
}

const COULEURS = [
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-red-100 text-red-700',
]

export default function PageRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [nouveauRole, setNouveauRole] = useState('')
  const [ajoutEnCours, setAjoutEnCours] = useState(false)
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)

  async function chargerRoles() {
    const { data } = await supabase
      .from('roles')
      .select('id, nom, membre_roles(count)')
      .order('nom')
    setRoles(data || [])
    setLoading(false)
  }

  useEffect(() => { chargerRoles() }, [])

  async function ajouterRole() {
    if (!nouveauRole.trim()) { alert('Le nom du rôle est obligatoire'); return }
    setAjoutEnCours(true)
    const { error } = await supabase.from('roles').insert({ nom: nouveauRole.trim() })
    if (error) {
      if (error.code === '23505') {
        alert('Ce rôle existe déjà')
      } else {
        alert('Erreur : ' + error.message)
      }
    } else {
      setNouveauRole('')
      setAfficherFormulaire(false)
      chargerRoles()
    }
    setAjoutEnCours(false)
  }

  async function supprimerRole(id: string, count: number) {
    if (count > 0) {
      alert(`Ce rôle est attribué à ${count} membre${count > 1 ? 's' : ''}. Retirez-le d'abord des membres avant de le supprimer.`)
      return
    }
    if (!confirm('Supprimer ce rôle ?')) return
    await supabase.from('roles').delete().eq('id', id)
    chargerRoles()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Chargement...</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Rôles</h2>
          <p className="text-gray-500 mt-1">{roles.length} rôle{roles.length > 1 ? 's' : ''} disponible{roles.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          + Nouveau rôle
        </button>
      </div>

      {/* Formulaire ajout */}
      {afficherFormulaire && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter un nouveau rôle</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={nouveauRole}
              onChange={e => setNouveauRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ajouterRole()}
              placeholder="Ex : Claviériste, Trompettiste..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
            <button
              onClick={ajouterRole}
              disabled={ajoutEnCours}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {ajoutEnCours ? 'Ajout...' : 'Ajouter'}
            </button>
            <button
              onClick={() => { setAfficherFormulaire(false); setNouveauRole('') }}
              className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Liste des rôles */}
      {roles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-4">🎭</p>
          <p className="text-gray-500 text-lg mb-6">Aucun rôle enregistré</p>
          <button
            onClick={() => setAfficherFormulaire(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Ajouter le premier rôle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, index) => {
            const count = role.membre_roles?.[0]?.count || 0
            return (
              <div
                key={role.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${COULEURS[index % COULEURS.length]}`}>
                      🎭 {role.nom}
                    </div>
                  </div>
                  <button
                    onClick={() => supprimerRole(role.id, count)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg"
                    title="Supprimer ce rôle"
                  >
                    🗑️
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-400 h-2 rounded-full transition-all"
                      style={{ width: count > 0 ? '100%' : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 min-w-fit">
                    {count} membre{count > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-blue-700 text-sm">
          💡 <strong>Astuce :</strong> Pour attribuer des rôles aux membres, va dans la page <strong>Membres</strong> et modifie le profil d'un membre.
        </p>
      </div>
    </div>
  )
}