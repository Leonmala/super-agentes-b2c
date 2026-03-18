export interface ImagemComprimida {
  base64: string        // sem prefixo data:...
  dataUrl: string       // com prefixo, para <img src>
  tamanhoKB: number
}

/**
 * Comprime um File de imagem via Canvas API.
 * Redimensiona para max maxPx em qualquer dimensão, exporta como JPEG.
 * Retorna base64 limpo (sem prefixo) + dataUrl completo + tamanho em KB.
 */
export async function comprimirImagem(
  file: File,
  maxPx = 1024,
  qualidade = 0.8
): Promise<ImagemComprimida> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Arquivo não é uma imagem'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width >= height) {
            height = Math.round((height * maxPx) / width)
            width = maxPx
          } else {
            width = Math.round((width * maxPx) / height)
            height = maxPx
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas não suportado'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', qualidade)
        // Remover prefixo "data:image/jpeg;base64,"
        const base64 = dataUrl.split(',')[1]
        const tamanhoKB = Math.ceil((base64.length * 3) / 4 / 1024)

        resolve({ base64, dataUrl, tamanhoKB })
      }
      img.onerror = () => reject(new Error('Falha ao carregar imagem'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}
