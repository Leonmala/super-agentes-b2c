import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login, loading, token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) navigate('/', { replace: true })
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    try {
      await login(email, senha)
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login'
      setErro(msg)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#172554] flex items-center justify-center p-4 overflow-hidden">
      {/* Organic blob 1 */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl opacity-40"></div>

      {/* Organic blob 2 */}
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-40"></div>

      {/* Organic blob 3 */}
      <div className="absolute top-1/2 right-32 w-80 h-80 bg-indigo-300 rounded-full blur-3xl opacity-40"></div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand section */}
        <div className="text-center mb-12">
          <h1 className="text-white font-extrabold text-3xl mb-4">Super Agentes</h1>
          <img
            src="/logo-penseai.png"
            alt="Pense-AI"
            className="h-7 mx-auto opacity-60 brightness-0 invert"
          />
        </div>

        {/* Glassmorphism card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/12 backdrop-blur-[40px] border border-white/[0.18] rounded-[28px] p-8 space-y-5"
        >
          <div>
            <label className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/8 border-[1.5px] border-white/12 rounded-[16px] text-white placeholder:text-white/28 focus:outline-none focus:border-white/30 focus:bg-white/12 transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-wide">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full px-4 py-3 bg-white/8 border-[1.5px] border-white/12 rounded-[16px] text-white placeholder:text-white/28 focus:outline-none focus:border-white/30 focus:bg-white/12 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {erro && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-blue-700 rounded-full font-bold hover:bg-white/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/50 text-sm">
            Ainda não tem conta? <a href="#" className="text-white/80 hover:text-white transition-colors underline">Cadastre-se</a>
          </p>
        </div>
      </div>
    </div>
  )
}
