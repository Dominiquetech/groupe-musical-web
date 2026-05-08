'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PageConnexion() {
  const router = useRouter()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function seConnecter() {
    if (!form.email || !form.password) {
      setErreur('Email et mot de passe requis')
      return
    }

    try {
      setChargement(true)
      setErreur('')

      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (error) {
        setErreur('Email ou mot de passe incorrect')
        return
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      console.error(err)
      setErreur("Une erreur est survenue")
    } finally {
      setChargement(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      seConnecter()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Logo Fusion Gospel */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo_sami.jpeg"
              alt="Logo Fusion Gospel"
              width={140}
              height={140}
              className="rounded-2xl object-contain"
              priority
            />
          </div>
          <p className="text-gray-500 mt-2 text-sm">
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="votre@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Erreur */}
          {erreur && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-red-600 text-sm text-center">❌ {erreur}</p>
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={seConnecter}
            disabled={chargement}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 mt-2"
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>

        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Contactez l'administrateur pour obtenir un accès
        </p>

      </div>
    </div>
  )
}