import type { DTO } from '@/types/dto'

export interface LoginRequest {
  username: string
  password: string
}

export type AuthResponse = DTO<null>

export interface AuthState {
  username: string | null
  isAuthenticated: boolean
}
