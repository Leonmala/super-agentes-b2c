// Controle de dispositivos simultâneos por família
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../db/supabase.js'

const LIMITE_DISPOSITIVOS_V1 = 3 // V1: hardcode máximo plano Familiar
const TIMEOUT_INATIVO_MS = 5 * 60 * 1000 // 5 minutos
const TIMEOUT_CLEANUP_MS = 10 * 60 * 1000 // 10 minutos

// ============================================================
// MIDDLEWARE EXPRESS
// ============================================================

export function middlewareDispositivos() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const deviceToken = req.headers['x-device-token'] as string | undefined
    const familiaId = (req as any).familiaId as string | undefined

    // Se não tem device token, pular (endpoints sem autenticação)
    if (!deviceToken || !familiaId) {
      next()
      return
    }

    const perfilId = req.body?.aluno_id || 'unknown'
    const tipoPerfil = req.body?.tipo_usuario || 'filho'

    try {
      // Registrar/atualizar dispositivo
      await registrarDispositivo(familiaId, perfilId, tipoPerfil, deviceToken)

      // Verificar limite
      const resultado = await verificarLimiteDispositivos(familiaId)

      if (!resultado.permitido) {
        res.status(429).json({
          erro: 'Limite de dispositivos simultâneos atingido',
          mensagem: `Sua família tem ${resultado.ativos} dispositivos ativos (limite: ${resultado.limite}). Feche a sessão em outro dispositivo.`,
          ativos: resultado.ativos,
          limite: resultado.limite
        })
        return
      }

      next()
    } catch (erro: any) {
      console.error('[Dispositivos] Erro no middleware:', erro.message)
      // Não bloquear por erro de dispositivo — let it pass
      next()
    }
  }
}

// ============================================================
// REGISTRAR DISPOSITIVO
// ============================================================

export async function registrarDispositivo(
  familiaId: string,
  perfilId: string,
  tipoPerfil: string,
  deviceToken: string
): Promise<void> {
  // Upsert: atualizar ultimo_ping se device_token já existe, senão insertar
  const { data: existente } = await supabase
    .from('b2c_dispositivos_ativos')
    .select('id')
    .eq('device_token', deviceToken)
    .single()

  if (existente) {
    await supabase
      .from('b2c_dispositivos_ativos')
      .update({
        familia_id: familiaId,
        perfil_id: perfilId,
        tipo_perfil: tipoPerfil,
        ultimo_ping: new Date().toISOString()
      })
      .eq('id', existente.id)
  } else {
    await supabase
      .from('b2c_dispositivos_ativos')
      .insert({
        familia_id: familiaId,
        perfil_id: perfilId,
        tipo_perfil: tipoPerfil,
        device_token: deviceToken,
        ultimo_ping: new Date().toISOString()
      })
  }
}

// ============================================================
// VERIFICAR LIMITE
// ============================================================

export async function verificarLimiteDispositivos(
  familiaId: string
): Promise<{ permitido: boolean; ativos: number; limite: number }> {
  const limiteAtivo = new Date(Date.now() - TIMEOUT_INATIVO_MS).toISOString()

  const { count, error } = await supabase
    .from('b2c_dispositivos_ativos')
    .select('*', { count: 'exact', head: true })
    .eq('familia_id', familiaId)
    .gte('ultimo_ping', limiteAtivo)

  if (error) {
    console.error('[Dispositivos] Erro ao contar:', error.message)
    return { permitido: true, ativos: 0, limite: LIMITE_DISPOSITIVOS_V1 }
  }

  const ativos = count || 0

  // V1: hardcode limite. Fase 5: ler de b2c_familias.max_dispositivos
  return {
    permitido: ativos <= LIMITE_DISPOSITIVOS_V1,
    ativos,
    limite: LIMITE_DISPOSITIVOS_V1
  }
}

// ============================================================
// CLEANUP DISPOSITIVOS INATIVOS
// ============================================================

export async function limparDispositivosInativos(): Promise<number> {
  const limiteInativo = new Date(Date.now() - TIMEOUT_CLEANUP_MS).toISOString()

  const { data, error } = await supabase
    .from('b2c_dispositivos_ativos')
    .delete()
    .lt('ultimo_ping', limiteInativo)
    .select('id')

  if (error) {
    console.error('[Dispositivos] Erro no cleanup:', error.message)
    return 0
  }

  const removidos = data?.length || 0
  if (removidos > 0) {
    console.log(`[Dispositivos] ${removidos} dispositivos inativos removidos`)
  }

  return removidos
}
