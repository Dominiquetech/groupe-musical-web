'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

interface Props {
  membre: Membre | null
  onFermer: () => void
  onEnregistrer: () => void
}

export default function FormulaireMembreModal({ membre, onFermer, onEnregistrer }: Props) {
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesSelectionnes, setRolesSelectionnes] = useState<string[]>([])
  const [photoFichier, setPhotoFichier] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [chargement, setChargement] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    prenoms: '',
    telephone: '',
    email: '',
    date_integration: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    // Charger les rôles disponibles
    supabase.from('roles').select('*').order('nom').then(({ data }) => {
      setRoles(data || [])
    })

    // Si modification, pré-remplir le formulaire
    if (membre) {
      setForm({
        nom: membre.nom,
        prenoms: membre.prenoms,
        telephone: membre.telephone || '',
        email: membre.email || '',
        date_integration: membre.date_integration,
      })
      setPhotoPreview(membre.photo_url || '')
      setRolesSelectionnes(membre.membre_roles?.map(mr => mr.roles?.id) || [])
    }
  }, [membre])

  function toggleRole(roleId: string) {
    setRolesSelectionnes(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    setPhotoFichier(fichier)
    setPhotoPreview(URL.createObjectURL(fichier))
  }

  async function enregistrer() {
    if (!form.nom || !form.prenoms) {
      alert('Le nom et les prénoms sont obligatoires')
      return
    }
    setChargement(true)

    let photo_url = membre?.photo_url || ''

    // Upload photo si nouvelle photo sélectionnée
    if (photoFichier) {
      const ext = photoFichier.name.split('.').pop()
      const nomFichier = `${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('photos-membres')
        .upload(nomFichier, photoFichier)

      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('photos-membres')
          .getPublicUrl(nomFichier)
        photo_url = urlData.publicUrl
      }
    }

    // Créer ou modifier le membre
    let membreId = membre?.id

    if (membre) {
      await supabase.from('membres').update({ ...form, photo_url }).eq('id', membre.id)
    } else {
      const { data } = await supabase.from('membres').insert({ ...form, photo_url }).select().single()
      membreId = data?.id
    }

    // Mettre à jour les rôles
    if (membreId) {
      await supabase.from('membre_roles').delete().eq('membre_id', membreId)
      if (rolesSelectionnes.length > 0) {
        await supabase.from('membre_roles').insert(
          rolesSelectionnes.map(roleId => ({ membre_id: membreId, role_id: roleId }))
        )
      }
    }

    setChargement(false)
    onEnregistrer()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            {membre ? 'Modifier le membre' : 'Ajouter un membre'}
          </h3>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">👤</div>
            )}
            <label className="cursor-pointer bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
              📷 Choisir une photo
              <input type="file" accept="image/jpeg,image/png" onChange={onPhotoChange} className="hidden" />
            </label>
          </div>

          {/* Nom & Prénoms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénoms *</label>
              <input
                type="text"
                value={form.prenoms}
                onChange={e => setForm({ ...form, prenoms: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Dupont"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="+225 07 00 00 00 00"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="jean@email.com"
            />
          </div>

          {/* Date d'intégration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'intégration</label>
            <input
              type="date"
              value={form.date_integration}
              onChange={e => setForm({ ...form, date_integration: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Rôles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôles</label>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    rolesSelectionnes.includes(role.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {role.nom}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onFermer}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={enregistrer}
            disabled={chargement}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {chargement ? 'Enregistrement...' : membre ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}