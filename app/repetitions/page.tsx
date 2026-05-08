'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/lib/useRole' // ✅ AJOUT

interface Membre {
  id: string
  nom: string
  prenoms: string
}

interface Repetition {
  id: string
  date: string
  heure: string
  lieu: string
  notes: string
  presences: { membre_id: string }[]
}

export default function PageRepetitions() {
  const [repetitions, setRepetitions] = useState<Repetition[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const { estAdmin, loading: roleLoading } = useRole() // ✅ AJOUT

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heure: '18:00',
    lieu: '',
    notes: '',
  })
  const [membresPresents, setMembresPresents] = useState<string[]>([])

  async function chargerDonnees() {
    const [reps, mems] = await Promise.all([
      supabase
        .from('repetitions')
        .select('*, presences(membre_id)')
        .order('date', { ascending: false }),
      supabase.from('membres').select('id, nom, prenoms').order('nom'),
    ])
    setRepetitions(reps.data || [])
    setMembres(mems.data || [])
    setLoading(false)
  }

  useEffect(() => { chargerDonnees() }, [])

  function togglePresence(id: string) {
    setMembresPresents(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  async function enregistrer() {
    if (!form.date || !form.lieu) {
      alert('La date et le lieu sont obligatoires')
      return
    }
    setChargement(true)

    const { data } = await supabase
      .from('repetitions')
      .insert(form)
      .select()
      .single()

    if (data && membresPresents.length > 0) {
      await supabase.from('presences').insert(
        membresPresents.map(membre_id => ({
          repetition_id: data.id,
          membre_id,
        }))
      )
    }

    setChargement(false)
    setModalOuvert(false)
    setForm({
      date: new Date().toISOString().split('T')[0],
      heure: '18:00',
      lieu: '',
      notes: '',
    })
    setMembresPresents([])
    chargerDonnees()
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette répétition ?')) return
    await supabase.from('repetitions').delete().eq('id', id)
    chargerDonnees()
  }

  if (loading || roleLoading) return ( // ✅ AJOUT roleLoading
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Chargement...</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Répétitions</h2>
          <p className="text-gray-500 mt-1">{repetitions.length} répétition{repetitions.length > 1 ? 's' : ''} enregistrée{repetitions.length > 1 ? 's' : ''}</p>
        </div>

        {/* ✅ Bouton visible seulement pour admin */}
        {estAdmin && (
          <button
            onClick={() => setModalOuvert(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            + Nouvelle répétition
          </button>
        )}
      </div>

      {repetitions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-gray-500 text-lg mb-6">Aucune répétition enregistrée</p>
          {/* ✅ Bouton vide seulement pour admin */}
          {estAdmin && (
            <button
              onClick={() => setModalOuvert(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ajouter la première répétition
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {repetitions.map(rep => (
            <div key={rep.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="bg-indigo-50 rounded-xl p-3 text-center min-w-16">
                    <p className="text-indigo-600 font-bold text-xl">
                      {new Date(rep.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                    </p>
                    <p className="text-indigo-400 text-xs uppercase">
                      {new Date(rep.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-800">📍 {rep.lieu}</h3>
                      {rep.heure && (
                        <span className="text-gray-500 text-sm">⏰ {rep.heure}</span>
                      )}
                    </div>
                    {rep.notes && (
                      <p className="text-gray-500 text-sm mb-2">{rep.notes}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                        👥 {rep.presences?.length || 0} présent{(rep.presences?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ✅ Bouton supprimer seulement pour admin */}
                {estAdmin && (
                  <button
                    onClick={() => supprimer(rep.id)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Nouvelle répétition</h3>
              <button onClick={() => setModalOuvert(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                  <input
                    type="time"
                    value={form.heure}
                    onChange={e => setForm({ ...form, heure: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu *</label>
                <input
                  type="text"
                  value={form.lieu}
                  onChange={e => setForm({ ...form, lieu: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Salle de répétition, Église..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  rows={2}
                  placeholder="Remarques sur la répétition..."
                />
              </div>

              {membres.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membres présents ({membresPresents.length}/{membres.length})
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3">
                    {membres.map(m => (
                      <label key={m.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={membresPresents.includes(m.id)}
                          onChange={() => togglePresence(m.id)}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-sm text-gray-700">{m.prenoms} {m.nom}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                {chargement ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}