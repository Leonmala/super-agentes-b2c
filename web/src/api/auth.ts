import { apiFetch } from './client'
import type { LoginResponse, SelectProfileResponse } from '../types'

export async function login(email: string, senha: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
}

export async function selectProfile(
  perfilId: string,
  tipo: 'filho' | 'pai',
  pin?: string
): Promise<SelectProfileResponse> {
  return apiFetch<SelectProfileResponse>('/auth/select-profile', {
    method: 'POST',
    body: JSON.stringify({ perfil_id: perfilId, tipo, pin }),
  })
}
