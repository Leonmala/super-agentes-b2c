const BASE_URL = '/api'

function getDeviceToken(): string {
  let token = localStorage.getItem('sa_device_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('sa_device_token', token)
  }
  return token
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('sa_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Device token para controle de dispositivos simultâneos
  headers['X-Device-Token'] = getDeviceToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ erro: 'Erro desconhecido' }))
    throw new ApiError(res.status, body.erro || `HTTP ${res.status}`)
  }

  return res.json()
}
