import type { DTO } from '@/types/dto'

export interface Admin {
  id: string | null
  username: string
}

export interface AdminRequest {
  username: string
  password: string
}

export type AdminResponse = DTO<Admin[]>
export type AdminMutationResponse = DTO<null>
