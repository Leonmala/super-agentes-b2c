---
name: Não reescrever prompts sem autorização
description: Leon não autoriza reescrita completa de prompts — apenas alterações cirúrgicas
type: feedback
---

Nunca reescrever completamente um arquivo de prompt (.md em server/src/personas/) sem autorização explícita do Leon.

**Why:** Prompts têm estrutura, tom e decisões pedagógicas que Leon definiu e não quer perder. Uma reescrita completa destrói essas decisões mesmo quando bem-intencionada.

**How to apply:** Quando precisar corrigir um prompt:
- Fazer alterações cirúrgicas: remover seções específicas, adicionar seções, ajustar trechos
- Nunca usar Write para substituir o arquivo inteiro
- Se a mudança for grande, mostrar o diff para aprovação antes de aplicar
- "Ajustar", "tirar referências erradas" ≠ autorização para reescrever
