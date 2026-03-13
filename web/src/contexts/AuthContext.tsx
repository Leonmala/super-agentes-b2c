import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Familia, Filho, Responsavel, TipoInterface, TipoUsuario } from '../types'
import * as authApi from '../api/auth'

interface PerfilAtivo {
  alunoId?: string
  responsavelId?: string
  selectedFilhoId?: string
  tipoUsuario: TipoUsuario
  tipoInterface: TipoInterface
  nome: string
}

interface AuthState {
  token: string | null
  familia: Familia | null
  filhos: Filho[]
  responsavel: Responsavel | null
  perfilAtivo: PerfilAtivo | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>
  selectFilho: (filhoId: string) => Promise<void>
  selectPai: (pin: string) => Promise<void>
  selectFilhoPai: (filhoId: string) => void
  trocarPerfil: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('sa_token'),
    familia: null,
    filhos: [],
    responsavel: null,
    perfilAtivo: null,
    loading: false,
  })

  useEffect(() => {
    const saved = localStorage.getItem('sa_familia_data')
    if (saved && state.token) {
      try {
        const data = JSON.parse(saved)
        setState(prev => ({
          ...prev,
          familia: data.familia,
          filhos: data.filhos,
          responsavel: data.responsavel,
        }))
      } catch {
        // corrupted data
      }
    }
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const res = await authApi.login(email, senha)
      localStorage.setItem('sa_token', res.token)
      localStorage.setItem('sa_familia_data', JSON.stringify({
        familia: res.familia,
        filhos: res.filhos,
        responsavel: res.responsavel,
      }))
      setState({
        token: res.token,
        familia: res.familia,
        filhos: res.filhos,
        responsavel: res.responsavel,
        perfilAtivo: null,
        loading: false,
      })
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }))
      throw err
    }
  }, [])

  const selectFilho = useCallback(async (filhoId: string) => {
    const filho = state.filhos.find(f => f.id === filhoId)
    if (!filho) throw new Error('Filho não encontrado')

    const res = await authApi.selectProfile(filhoId, 'filho')
    setState(prev => ({
      ...prev,
      perfilAtivo: {
        alunoId: filho.id,
        tipoUsuario: 'filho',
        tipoInterface: res.tipo_interface,
        nome: filho.nome,
      },
    }))
  }, [state.filhos])

  const selectPai = useCallback(async (pin: string) => {
    if (!state.responsavel) throw new Error('Responsável não encontrado')

    await authApi.selectProfile(state.responsavel.id, 'pai', pin)
    const firstChild = state.filhos[0]
    setState(prev => ({
      ...prev,
      perfilAtivo: {
        responsavelId: state.responsavel!.id,
        selectedFilhoId: firstChild?.id,
        tipoUsuario: 'pai',
        tipoInterface: 'pai',
        nome: state.responsavel!.nome,
      },
    }))
  }, [state.responsavel, state.filhos])

  const selectFilhoPai = useCallback((filhoId: string) => {
    setState(prev => prev.perfilAtivo ? ({
      ...prev,
      perfilAtivo: { ...prev.perfilAtivo, selectedFilhoId: filhoId },
    }) : prev)
  }, [])

  const trocarPerfil = useCallback(() => {
    setState(prev => ({ ...prev, perfilAtivo: null }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_familia_data')
    setState({
      token: null,
      familia: null,
      filhos: [],
      responsavel: null,
      perfilAtivo: null,
      loading: false,
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, selectFilho, selectPai, selectFilhoPai, trocarPerfil, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
