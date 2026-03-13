import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { ChatProvider } from '../contexts/ChatContext'
import { LoginPage } from '../pages/LoginPage'

// Mock fetch globally
beforeEach(() => {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }
})

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}

describe('Gate 3 — Frontend Smoke Tests', () => {
  it('renders login page with form elements', () => {
    render(<LoginPage />, { wrapper: TestWrapper })
    expect(screen.getByText('Super Agentes')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('has all 8 heroes defined in constants', async () => {
    const { HEROES } = await import('../constants')
    expect(Object.keys(HEROES)).toHaveLength(8)
    expect(HEROES.CALCULUS.materia).toBe('Matemática')
    expect(HEROES.VERBETTA.materia).toBe('Português')
    expect(HEROES.NEURON.materia).toBe('Ciências / Biologia')
    expect(HEROES.TEMPUS.materia).toBe('História')
    expect(HEROES.GAIA.materia).toBe('Geografia')
    expect(HEROES.VECTOR.materia).toBe('Física')
    expect(HEROES.ALKA.materia).toBe('Química')
    expect(HEROES.FLEX.materia).toBe('Inglês e Espanhol')
  })

  it('heroes have avatar images defined', async () => {
    const { HEROES } = await import('../constants')
    for (const hero of Object.values(HEROES)) {
      expect(hero.avatar).toBeTruthy()
      expect(hero.avatar).toContain('_buble.png')
      expect(hero.card).toContain('-card.png')
    }
  })

  it('API client module exports correctly', async () => {
    const { apiFetch, ApiError } = await import('../api/client')
    expect(typeof apiFetch).toBe('function')
    expect(ApiError).toBeDefined()
  })

  it('chat API module exports sendMessage', async () => {
    const { sendMessage } = await import('../api/chat')
    expect(typeof sendMessage).toBe('function')
  })

  it('interface colors defined for all 3 types', async () => {
    const { INTERFACE_COLORS } = await import('../constants')
    expect(INTERFACE_COLORS.fundamental).toBe('#2563EB')
    expect(INTERFACE_COLORS.medio).toBe('#7C3AED')
    expect(INTERFACE_COLORS.pai).toBe('#059669')
  })
})
