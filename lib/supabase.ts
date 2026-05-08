import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fxuqajkqqwlpphugqhdv.supabase.co'
const supabaseKey = 'sb_publishable_mYnLIca9Kqbj-qXLPwYHng_9XLW_R2n'

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profils')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}