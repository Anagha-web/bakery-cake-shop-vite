import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { StaffMember } from '../lib/database.types'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; session: Session; staff: StaffMember | null; staffError: string | null }

export type AuthApi = {
  state: AuthState
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** The active staff record, or null if the user is not (active) staff. */
  staff: StaffMember | null
  isAdmin: boolean
  userId: string | null
}

export const AuthContext = createContext<AuthApi | null>(null)

export function useAuth() {
  const api = useContext(AuthContext)
  if (!api) throw new Error('useAuth must be used inside <AuthProvider>')
  return api
}
