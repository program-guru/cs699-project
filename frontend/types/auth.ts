import type { DTO } from '@/types/dto'
import type { Admin } from '@/types/admin'

export interface AuthRequest {
  username: string
  password: string
}

export type AuthResponse = DTO<Admin>
export type CurrentUserResponse = DTO<Admin>

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'

export interface AuthState {
  user: Admin | null
  status: AuthStatus
  isAuthenticated: boolean
}
