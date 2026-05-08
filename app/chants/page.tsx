'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/lib/useRole' // ✅ AJOUT

interface Chant {
  id: string
  titre: string
  auteur: string
  tonalite: string
  type_chant: string
  fichier_url: string
}

const TYPES_CHANT = ['Adoration', 'Louange', 'Cantique', 'Prière', 'Autre']
const TONALITES = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do#', 'Ré#', 'Fa#', 'Sol#', 'La#']

export default function PageChants() {
  const [chants, setChants] = useState<Chant[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(false)
  const [fichier, setFichier] = useState<File | null>(null)
  const { estAdmin, loading: roleLoading } = useRole() // ✅ AJOUT

  const [form, setForm] = useState({
    titre: '',
    auteur: '',
    tonalite: 'Do',
    type_chant: 'Louange',
  })

  async function chargerChants() {
    const { data } = await supabase.from('chants').select('*').order('titre')
    setChants(data || [])
    setLoading(false)
  }

  useEffect(() => { chargerChants() }, [])

  async function enregistrer() {
    if (!form.titre) { alert('Le titre est obligatoire'); return }
    setChargement(true)
    let fichier_url = ''
    if (fichier) {
      const ext = fichier.name.split('.').pop()
      const nomFichier = `chants/${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('medias-groupe').upload(nomFichier, fichier)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('medias-groupe').getPublicUrl(nomFichier)
        fichier_url = urlData.publicUrl
      }
    }
    await supabase.from('chants').insert({ ...form, fichier_url })
    setChargement(false)
    setModalOuvert(false)
    setFichier(null)
    setForm({ titre: '', auteur: '', tonalite: 'Do', type_chant: 'Louange' })
    chargerChants()
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ce chant ?')) return
    await supabase.from('chants').delete().eq('id', id)
    chargerChants()
  }

  const chantsFiltres = chants.filter(c =>
    c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    c.auteur?.toLowerCase().includes(recherche.toLowerCase())
  )

  const couleurType: Record<string, string> = {
    Adoration: 'bg-purple-50 text-purple-700',
    Louange: 'bg-yellow-50 text-yellow-700',
    Cantique: 'bg-blue-50 text-blue-700',
    Prière: 'bg-green-50 text-green-700',
    Autre: 'bg-gray-50 text-gray-700',
  }

  if (loading || roleLoading) return ( // ✅ AJOUT roleLoading
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Chargement...</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Chants</h2>
          <p className="text-gray-500 mt-1">{chants.length} chant{chants.length > 1 ? 's' : ''}</p>
        </div>

        {/* ✅ Bouton visible seulement pour admin */}
        {estAdmin && (
          <button
            onClick={() => setModalOuvert(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            + Ajouter un chant
          </button>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher un chant ou un auteur..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      {chantsFiltres.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-4">🎵</p>
          <p className="text-gray-500 text-lg mb-6">
            {recherche ? 'Aucun chant trouvé' : 'Aucun chant enregistré'}
          </p>
          {/* ✅ Bouton vide seulement pour admin */}
          {!recherche && estAdmin && (
            <button
              onClick={() => setModalOuvert(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ajouter le premier chant
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {chantsFiltres.map((chant, index) => (
            <div
              key={chant.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                index !== chantsFiltres.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">🎵</div>
                <div>
                  <h3 className="font-semibold text-gray-800">{chant.titre}</h3>
                  <p className="text-gray-500 text-sm">
                    {chant.auteur && `${chant.auteur} · `}
                    Tonalité : <span className="font-medium">{chant.tonalite}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${couleurType[chant.type_chant] || 'bg-gray-50 text-gray-700'}`}>
                  {chant.type_chant}
                </span>
                {chant.fichier_url && (
                  <a
                    href={chant.fichier_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    ▶️ Écouter
                  </a>
                )}

                {/* ✅ Bouton supprimer seulement pour admin */}
                {estAdmin && (
                  <button
                    onClick={() => supprimer(chant.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal — visible seulement si admin */}
      {modalOuvert && estAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Ajouter un chant</h3>
              <button onClick={() => setModalOuvert(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => setForm({ ...form, titre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Nom du chant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
                <input
                  type="text"
                  value={form.auteur}
                  onChange={e => setForm({ ...form, auteur: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Nom de l'auteur"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tonalité</label>
                  <select
                    value={form.tonalite}
                    onChange={e => setForm({ ...form, tonalite: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {TONALITES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type_chant}
                    onChange={e => setForm({ ...form, type_chant: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {TYPES_CHANT.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier audio (optionnel)</label>
                <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors">
                  <p className="text-gray-500 text-sm">
                    {fichier ? `✅ ${fichier.name}` : '🎵 Cliquer pour ajouter un fichier audio'}
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={e => setFichier(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModalOuvert(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={enregistrer}
                disabled={chargement}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                {chargement ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}