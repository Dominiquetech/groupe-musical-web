'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import FormulaireMembreModal from '@/components/FormulaireMembreModal'
import { useRole } from '@/lib/useRole' // ✅ AJOUT 1 — import du hook

interface Role {
  id: string
  nom: string
}

interface Membre {
  id: string
  nom: string
  prenoms: string
  telephone: string
  email: string
  date_integration: string
  photo_url: string
  membre_roles: { roles: Role }[]
}

export default function PageMembres() {
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [membreSelectionne, setMembreSelectionne] = useState<Membre | null>(null)
  const { estAdmin, loading: roleLoading } = useRole() // ✅ AJOUT 2 — lecture du rôle

  async function chargerMembres() {
    const { data } = await supabase
      .from('membres')
      .select(`
        *,
        membre_roles (
          roles ( id, nom )
        )
      `)
      .order('nom')
    setMembres(data || [])
    setLoading(false)
  }

  useEffect(() => { chargerMembres() }, [])

  async function supprimerMembre(id: string) {
    if (!confirm('Supprimer ce membre ?')) return
    await supabase.from('membres').delete().eq('id', id)
    chargerMembres()
  }

  function ouvrirAjout() {
    setMembreSelectionne(null)
    setModalOuvert(true)
  }

  function ouvrirModification(membre: Membre) {
    setMembreSelectionne(membre)
    setModalOuvert(true)
  }

  function apresEnregistrement() {
    setModalOuvert(false)
    chargerMembres()
  }

  // Attendre que les deux chargements soient terminés
  if (loading || roleLoading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Chargement...</p>
    </div>
  )

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Membres</h2>
          <p className="text-gray-500 mt-1">{membres.length} membre{membres.length > 1 ? 's' : ''} au total</p>
        </div>

        {/* ✅ AJOUT 3 — bouton visible seulement pour l'admin */}
        {estAdmin && (
          <button
            onClick={ouvrirAjout}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            + Ajouter un membre
          </button>
        )}
      </div>

      {/* Liste des membres */}
      {membres.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-gray-500 text-lg mb-6">Aucun membre pour l'instant</p>
          {/* Bouton ajout vide seulement pour admin */}
          {estAdmin && (
            <button
              onClick={ouvrirAjout}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ajouter le premier membre
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {membres.map((membre) => (
            <div key={membre.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                {membre.photo_url ? (
                  <img
                    src={membre.photo_url}
                    alt={membre.nom}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                    {membre.prenoms[0]}{membre.nom[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-800">{membre.prenoms} {membre.nom}</h3>
                  <p className="text-gray-500 text-sm">{membre.telephone || 'Pas de téléphone'}</p>
                </div>
              </div>

              {/* Rôles */}
              <div className="flex flex-wrap gap-2 mb-4">
                {membre.membre_roles?.length > 0 ? (
                  membre.membre_roles.map((mr, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium">
                      {mr.roles?.nom}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">Aucun rôle attribué</span>
                )}
              </div>

              <p className="text-gray-400 text-xs mb-4">
                Intégré le {new Date(membre.date_integration).toLocaleDateString('fr-FR')}
              </p>

              {/* ✅ Boutons Modifier / Supprimer — visibles seulement pour l'admin */}
              {estAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => ouvrirModification(membre)}
                    className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => supprimerMembre(membre.id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {modalOuvert && (
        <FormulaireMembreModal
          membre={membreSelectionne}
          onFermer={() => setModalOuvert(false)}
          onEnregistrer={apresEnregistrement}
        />
      )}
    </div>
  )
}