import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthApi, type AuthState } from './auth-context'
import { errorMessage } from './lib/errors'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [staffState, setStaffState] = useState<{ userId: string; staff: AuthApi['staff']; error: string | null } | null>(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => active && setSession(data.session))
    // Keep this callback synchronous: Supabase warns against awaiting other
    // Supabase calls inside it. The staff record loads in the effect below.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!userId) return
    let active = true
    supabase
      .from('staff_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        setStaffState({ userId, staff: data, error: error ? errorMessage(error) : null })
      })
    return () => {
      active = false
    }
  }, [userId])

  const state: AuthState = useMemo(() => {
    if (session === undefined) return { status: 'loading' }
    if (session === null) return { status: 'signed_out' }
    if (!staffState || staffState.userId !== session.user.id) return { status: 'loading' }
    return { status: 'signed_in', session, staff: staffState.staff, staffError: staffState.error }
  }, [session, staffState])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const api = useMemo<AuthApi>(() => {
    const staff = state.status === 'signed_in' && state.staff?.is_active ? state.staff : null
    return { state, signIn, signOut, staff, isAdmin: staff?.role === 'admin', userId }
  }, [state, signIn, signOut, userId])

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
