import assert from 'node:assert'

export class TestClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = process.env.API_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl
  }

  setToken(token: string): void {
    this.token = token
  }

  async health(): Promise<{ status: string; timestamp: string; version: string }> {
    const res = await fetch(`${this.baseUrl}/api/health`)
    assert.strictEqual(res.status, 200, 'Health check should return 200')
    return res.json()
  }

  async login(email: string, senha: string): Promise<{
    token: string
    familia: { id: string; email: string; plano: string }
    filhos: Array<{ id: string; nome: string; serie: string; nivel_ensino: string }>
    responsavel: { id: string; nome: string } | null
  }> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    })

    if (res.status === 401) {
      throw new Error('Login failed: invalid credentials')
    }

    assert.strictEqual(res.status, 200, `Login should return 200, got ${res.status}`)
    const data = await res.json()
    this.token = data.token
    return data
  }

  async selectProfile(perfilId: string, tipo: 'filho' | 'pai', pin?: string): Promise<{
    sessao: any
    tipo_interface: 'fundamental' | 'medio' | 'pai'
    aluno?: any
  }> {
    assert(this.token, 'Must be authenticated to select profile')

    const res = await fetch(`${this.baseUrl}/api/auth/select-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify({
        perfil_id: perfilId,
        tipo,
        pin
      })
    })

    assert.strictEqual(res.status, 200, `Select profile should return 200, got ${res.status}`)
    return res.json()
  }

  async sendMessageRaw(alunoId: string, mensagem: string): Promise<void> {
    // Sends message WITHOUT token — used to test 401
    const res = await fetch(`${this.baseUrl}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aluno_id: alunoId, mensagem })
    })

    if (res.status === 401) {
      throw new Error(`401 unauthorized`)
    }

    if (res.status !== 200) {
      throw new Error(`Unexpected status: ${res.status}`)
    }
  }

  async sendMessage(alunoId: string, mensagem: string, options?: { agente_override?: string; tipo_usuario?: 'filho' | 'pai' }): Promise<{
    events: Array<{ event: string; data: any }>
    agente: string | null
    chunks: string[]
    done: any | null
    error: any | null
    fullText: string
  }> {
    assert(this.token, 'Must be authenticated to send message')

    const res = await fetch(`${this.baseUrl}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify({
        aluno_id: alunoId,
        mensagem,
        agente_override: options?.agente_override,
        tipo_usuario: options?.tipo_usuario
      })
    })

    if (res.status === 401) {
      throw new Error('Message failed: unauthorized')
    }

    assert.strictEqual(res.status, 200, `Message should return 200, got ${res.status}`)

    // Parse SSE stream
    const events: Array<{ event: string; data: any }> = []
    const chunks: string[] = []
    let agente: string | null = null
    let done: any | null = null
    let error: any | null = null
    let fullText = ''

    const text = await res.text()
    const blocks = text.split('\n\n').filter(b => b.trim())

    for (const block of blocks) {
      const lines = block.split('\n')
      let eventName = ''
      let eventData = ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.replace('event:', '').trim()
        } else if (line.startsWith('data:')) {
          eventData = line.replace('data:', '').trim()
        }
      }

      if (eventName && eventData) {
        try {
          const parsed = JSON.parse(eventData)
          events.push({ event: eventName, data: parsed })

          if (eventName === 'agente') {
            agente = parsed.agente
          } else if (eventName === 'chunk') {
            chunks.push(parsed.texto)
            fullText += parsed.texto
          } else if (eventName === 'done') {
            done = parsed
          } else if (eventName === 'error') {
            error = parsed
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    return {
      events,
      agente,
      chunks,
      done,
      error,
      fullText
    }
  }
}
