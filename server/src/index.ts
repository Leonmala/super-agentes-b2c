import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import authRouter from './routes/auth.js'
import messageRouter from './routes/message.js'
import { registrarCronSemanal } from './core/cron.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Registrar rotas API
app.use('/api/auth', authRouter)
app.use('/api', messageRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modelo: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  })
})

// Servir frontend estático em produção
const clientDist = path.join(__dirname, '..', '..', 'web-dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  const indexPath = path.join(clientDist, 'index.html')
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Frontend não encontrado' })
    }
  })
})

app.listen(PORT, () => {
  console.log(`\n🚀 Super Agentes B2C V1 — porta ${PORT}\n`)

  // Registrar CRON semanal (flush → Qdrant → cleanup)
  registrarCronSemanal()
})

export default app
