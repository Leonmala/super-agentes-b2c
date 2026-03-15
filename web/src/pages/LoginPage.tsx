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
    <div className="relative min-h-screen bg-gradient-to-b from-[#1E40AF] via-[#1E3A8A] to-[#0F172A] flex items-center justify-center p-4 overflow-hidden">
      {/* Organic blob 1 — sutil */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          top: '5%',
          left: '-5%',
          filter: 'blur(80px)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%)',
        }}
      />

      {/* Organic blob 2 */}
      <div
        className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          bottom: '10%',
          right: '-8%',
          filter: 'blur(80px)',
          background: 'radial-gradient(circle, rgba(30,64,175,0.3), transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand section */}
        <div className="text-center mb-10">
          <h1 className="text-white font-extrabold text-3xl mb-4 tracking-tight">Super Agentes</h1>
          <img
            src="/LogoPenseAI.png"
            alt="Pense-AI"
            className="h-12 mx-auto"
          />
        </div>

        {/* Glassmorphism card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-[40px] border border-white/[0.15] rounded-[28px] p-8 space-y-5"
        >
          {/* Card title */}
          <h2 className="text-white font-bold text-xl text-center mb-2">Entrar</h2>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/8 border-[1.5px] border-white/10 rounded-[16px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/12 transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full px-4 py-3 bg-white/8 border-[1.5px] border-white/10 rounded-[16px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/12 transition-all"
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
            className="w-full py-3.5 bg-white text-[#1E3A8A] rounded-full font-bold text-base hover:bg-white/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/45 text-sm">
            Ainda não tem conta?{' '}
            <a href="#" className="text-white/75 hover:text-white transition-colors font-semibold">
              Cadastre-se
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
