import type { DTO } from '@/types/dto'

export interface Admin {
  _id: string
  username: string
}

export interface AdminRequest {
  username: string
  password: string
}

export interface AdminUpdateRequest {
  username: string
  password?: string
}

export type AdminResponse = DTO<Admin[]>
export type AdminMutationResponse = DTO<null>
