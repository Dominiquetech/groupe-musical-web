'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/lib/useRole' // ✅ AJOUT

interface Media {
  id: string
  titre: string
  description: string
  type: 'photo' | 'video'
  url: string
  date_prise: string
}

export default function PageMedias() {
  const [medias, setMedias] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [filtre, setFiltre] = useState<'tous' | 'photo' | 'video'>('tous')
  const [mediaEnPlein, setMediaEnPlein] = useState<Media | null>(null)
  const { estAdmin, loading: roleLoading } = useRole() // ✅ AJOUT

  const [form, setForm] = useState({
    titre: '',
    description: '',
    type: 'photo' as 'photo' | 'video',
    date_prise: new Date().toISOString().split('T')[0],
  })
  const [fichier, setFichier] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [chargement, setChargement] = useState(false)

  async function chargerMedias() {
    const { data } = await supabase
      .from('medias')
      .select('*')
      .order('created_at', { ascending: false })
    setMedias(data || [])
    setLoading(false)
  }

  useEffect(() => { chargerMedias() }, [])

  function onFichierChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFichier(f)
    setPreview(URL.createObjectURL(f))
    if (f.type.startsWith('video/')) {
      setForm(prev => ({ ...prev, type: 'video' }))
    } else {
      setForm(prev => ({ ...prev, type: 'photo' }))
    }
  }

  async function enregistrer() {
    if (!fichier) { alert('Sélectionne un fichier'); return }
    if (!form.titre) { alert('Le titre est obligatoire'); return }
    setChargement(true)

    const ext = fichier.name.split('.').pop()
    const nomFichier = `${Date.now()}.${ext}`

    const { data: uploadData, error } = await supabase.storage
      .from('medias-groupe')
      .upload(nomFichier, fichier)

    if (error) {
      alert('Erreur upload : ' + error.message)
      setChargement(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('medias-groupe')
      .getPublicUrl(nomFichier)

    await supabase.from('medias').insert({
      ...form,
      url: urlData.publicUrl,
    })

    setChargement(false)
    setModalOuvert(false)
    setFichier(null)
    setPreview('')
    setForm({
      titre: '',
      description: '',
      type: 'photo',
      date_prise: new Date().toISOString().split('T')[0],
    })
    chargerMedias()
  }

  async function supprimerMedia(media: Media) {
    if (!confirm('Supprimer ce média ?')) return
    await supabase.from('medias').delete().eq('id', media.id)
    chargerMedias()
  }

  const mediasFiltres = medias.filter(m => filtre === 'tous' || m.type === filtre)

  if (loading || roleLoading) return ( // ✅ AJOUT roleLoading
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Chargement...</p>
    </div>
  )

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Médias</h2>
          <p className="text-gray-500 mt-1">{medias.length} fichier{medias.length > 1 ? 's' : ''}</p>
        </div>

        {/* ✅ Bouton visible seulement pour l'admin */}
        {estAdmin && (
          <button
            onClick={() => setModalOuvert(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            + Ajouter un média
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {(['tous', 'photo', 'video'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtre === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'tous' ? '🗂️ Tous' : f === 'photo' ? '🖼️ Photos' : '🎬 Vidéos'}
          </button>
        ))}
      </div>

      {/* Grille de médias */}
      {mediasFiltres.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-4">🖼️</p>
          <p className="text-gray-500 text-lg mb-6">Aucun média pour l'instant</p>
          {/* ✅ Bouton vide seulement pour admin */}
          {estAdmin && (
            <button
              onClick={() => setModalOuvert(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ajouter le premier média
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediasFiltres.map(media => (
            <div key={media.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Aperçu */}
              <div
                className="relative h-48 bg-gray-100 cursor-pointer"
                onClick={() => setMediaEnPlein(media)}
              >
                {media.type === 'photo' ? (
                  <img
                    src={media.url}
                    alt={media.titre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <video src={media.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <span className="text-5xl">▶️</span>
                    </div>
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                  {media.type === 'photo' ? '🖼️ Photo' : '🎬 Vidéo'}
                </span>
              </div>

              {/* Infos */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{media.titre}</h3>
                {media.description && (
                  <p className="text-gray-500 text-sm mb-2">{media.description}</p>
                )}
                <p className="text-gray-400 text-xs mb-3">
                  📅 {new Date(media.date_prise).toLocaleDateString('fr-FR')}
                </p>

                {/* ✅ Bouton supprimer seulement pour admin */}
                {estAdmin && (
                  <button
                    onClick={() => supprimerMedia(media)}
                    className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout — visible seulement si admin (sécurité supplémentaire) */}
      {modalOuvert && estAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Ajouter un média</h3>
              <button onClick={() => setModalOuvert(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fichier *</label>
                <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 transition-colors">
                  {preview ? (
                    form.type === 'photo' ? (
                      <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                    ) : (
                      <video src={preview} className="w-full h-40 rounded-lg" controls />
                    )
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">📁</p>
                      <p className="text-gray-500 text-sm">Clique pour sélectionner</p>
                      <p className="text-gray-400 text-xs mt-1">JPG, PNG, MP4, MOV</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,video/mp4,video/quicktime"
                    onChange={onFichierChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => setForm({ ...form, titre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Répétition du 15 mai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  rows={3}
                  placeholder="Quelques mots sur ce média..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date_prise}
                  onChange={e => setForm({ ...form, date_prise: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
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
                {chargement ? 'Upload en cours...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visionneuse plein écran */}
      {mediaEnPlein && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setMediaEnPlein(null)}
        >
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">{mediaEnPlein.titre}</h3>
              <button
                onClick={() => setMediaEnPlein(null)}
                className="text-white text-3xl hover:text-gray-300"
              >
                ×
              </button>
            </div>
            {mediaEnPlein.type === 'photo' ? (
              <img src={mediaEnPlein.url} alt={mediaEnPlein.titre} className="w-full rounded-xl" />
            ) : (
              <video src={mediaEnPlein.url} controls className="w-full rounded-xl" autoPlay />
            )}
            {mediaEnPlein.description && (
              <p className="text-gray-300 mt-4 text-sm">{mediaEnPlein.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}