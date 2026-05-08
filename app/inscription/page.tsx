'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PageInscription() {
  const [form, setForm] = useState({ email: '', password: '', confirmation: '' })
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  async function sInscrire() {
    if (!form.email || !form.password) {
      setErreur('Email et mot de passe requis')
      return
    }
    if (form.password.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (form.password !== form.confirmation) {
      setErreur('Les mots de passe ne correspondent pas')
      return
    }

    setChargement(true)
    setErreur('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setErreur(error.message === 'User already registered'
        ? 'Cet email est déjà utilisé'
        : 'Erreur lors de l\'inscription')
      setChargement(false)
    } else {
      setSucces(true)
      setChargement(false)
    }
  }

  if (succes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Compte créé !</h2>
          <p className="text-gray-500 mb-6">
            Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.
          </p>
          <Link
            href="/connexion"
            className="block w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
            🎶
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Créer un compte</h1>
          <p className="text-gray-500 mt-1">Rejoignez le groupe musical</p>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="votre@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 caractères"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              value={form.confirmation}
              onChange={e => setForm({ ...form, confirmation: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && sInscrire()}
              placeholder="Répétez le mot de passe"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {erreur && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-red-600 text-sm text-center">❌ {erreur}</p>
            </div>
          )}

          <button
            onClick={sInscrire}
            disabled={chargement}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {chargement ? 'Création...' : 'Créer mon compte'}
          </button>

          <div className="text-center">
            <Link href="/connexion" className="text-indigo-600 text-sm hover:underline">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
