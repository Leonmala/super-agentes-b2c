export interface SendMessageOptions {
  alunoId: string
  mensagem: string
  tipoUsuario?: 'filho' | 'pai'
  agenteOverride?: string
  onAgente: (agente: string) => void
  onChunk: (texto: string) => void
  onDone: (data: Record<string, unknown>) => void
  onError: (erro: string) => void
  onLimite: (mensagem: string) => void
}

export async function sendMessage(opts: SendMessageOptions): Promise<void> {
  const token = localStorage.getItem('sa_token')
  if (!token) throw new Error('Não autenticado')

  const res = await fetch('/api/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      aluno_id: opts.alunoId,
      mensagem: opts.mensagem,
      tipo_usuario: opts.tipoUsuario || 'filho',
      agente_override: opts.agenteOverride,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ erro: 'Erro desconhecido' }))
    opts.onError(body.erro || `HTTP ${res.status}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    opts.onError('Stream não suportado')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        const dataStr = line.slice(6)
        try {
          const data = JSON.parse(dataStr)
          switch (currentEvent) {
            case 'agente':
              opts.onAgente(data.agente)
              break
            case 'chunk':
              opts.onChunk(data.texto)
              break
            case 'done':
              opts.onDone(data)
              break
            case 'error':
              opts.onError(data.erro)
              break
            case 'limite':
              opts.onLimite(data.mensagem)
              break
          }
        } catch {
          // ignore parse errors
        }
        currentEvent = ''
      }
    }
  }
}
