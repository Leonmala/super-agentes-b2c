# PROMPT DE DELEGAÇÃO — Claude Code CLI
# Data: 2026-04-01 | Projeto: Super Agentes Educacionais B2C V1
# De: Claude (guardião do projeto) → Para: Claude Code CLI (executor)

---

## CONTEXTO E IDENTIDADE

Você está continuando o desenvolvimento do **Super Agentes Educacionais** — uma clínica educacional digital com 8 professores super-heróis IA para alunos brasileiros.

**Pasta local:** `C:\Users\Leon\Desktop\SuperAgentes_B2C_V2`
**Repo GitHub:** `https://github.com/Leonmala/super-agentes-b2c`
**Branch:** `main`
**Deploy:** Railway (automático no push)

Antes de qualquer coisa, leia os documentos de memória na ordem:

```
1. docs/MEMORIA_CURTA.md        ← estado imediato (leia PRIMEIRO)
2. docs/CHECKLIST_PROJETO.md    ← o que falta (linhas com BUG-51 e BUG-52)
3. docs/LOG_ERROS.md            ← erros #51 e #52 documentados
```

---

## CRITÉRIOS DE DESENVOLVIMENTO — NÃO NEGOCIÁVEIS

1. **TypeScript strict** — zero erros em `npx tsc --noEmit` antes de qualquer commit
2. **Sem `any` explícito** — use tipos adequados ou `unknown` com narrowing
3. **Sem reinventar arquitetura** — o GESTOR + personas funciona, não tocar na estrutura de fluxo
4. **Testar manualmente cada fix** antes de avançar (ver Gates abaixo)
5. **Persistir estado** — atualizar `docs/MEMORIA_CURTA.md` e `docs/CHECKLIST_PROJETO.md` ao final
6. **Commit atômico por fix** — não agrupar mudanças não relacionadas
7. **Push só após todos os gates passarem**

---

## TAREFAS — EXECUTAR NA ORDEM

---

### TAREFA 1 — BUG-52: Cor do Prof. Pense-AI (5 minutos)

**Arquivo:** `web/src/constants.ts`

**Problema:** `AGENTES_ESPECIAIS.professor_ia` usa gradiente teal/verde (`#0F766E` / `#042F2E`).
Leon quer: **PROFESSOR_IA = âmbar/amarelo**, Supervisor = verde (já está correto).

**Fix exato — altere apenas estes dois campos em `AGENTES_ESPECIAIS.professor_ia`:**

```typescript
// ANTES:
gradientFrom: '#0F766E',
gradientTo: '#042F2E',

// DEPOIS:
gradientFrom: '#B45309',
gradientTo: '#3B1A00',
```

**Gate 1 (go/no-go):**
```bash
cd C:\Users\Leon\Desktop\SuperAgentes_B2C_V2\web
npx tsc --noEmit
```
→ Zero erros = APROVADO. Qualquer erro = PARE, corrija antes de continuar.

**Commit:**
```bash
git add web/src/constants.ts
git commit -m "fix(ui): cor Prof. Pense-AI header — âmbar/amarelo (era teal)"
```

---

### TAREFA 2 — BUG-51: Supervisor busca dados do pai em vez das filhas (~45 min)

**Arquivos principais:**
- `server/src/routes/message.ts` ← alteração principal
- `server/src/db/persistence.ts` ← nova query (buscarFilhosDaFamilia)
- `server/src/db/qdrant.ts` ← injetar contexto Qdrant das filhas
- `server/src/personas/SUPERVISOR_EDUCACIONAL.md` ← adicionar instruções multi-filho

---

#### 2.1 — Entender o problema antes de tocar no código

Leia estes arquivos ANTES de escrever qualquer linha:
- `server/src/routes/message.ts` (linhas 130–230: como o aluno_id chega, como sessao é criada)
- `server/src/db/persistence.ts` (funções `buscarOuCriarSessao` e `buscarUltimosTurnos`)
- `server/src/core/context.ts` (montarContexto — o que o SUPERVISOR recebe hoje)

**Diagnóstico esperado:**
O `aluno_id` enviado pelo frontend para o SUPERVISOR é o `selectedFilhoId` (correto).
Mas o contexto montado (`montarContexto`) usa os turnos da **sessão PAI** do filho
(tipoUsuario='pai'), que contém conversas do pai com os heróis sobre como ensinar —
não o histórico de aprendizado real do filho como aluno.
Além disso, o SUPERVISOR não injeta contexto Qdrant (ao contrário do PROFESSOR_IA).
O pai tem duas filhas (Layla e Maria Paz) mas o SUPERVISOR nunca oferece seleção.

---

#### 2.2 — Nova query: buscarFilhosDaFamilia

**Arquivo:** `server/src/db/persistence.ts`

Adicione ao final do arquivo (antes do último export se houver):

```typescript
// Retorna todos os alunos de uma família — usado pelo SUPERVISOR para listar filhos
export async function buscarFilhosDaFamilia(familiaId: string): Promise<Aluno[]> {
  const { data, error } = await supabase
    .from('t6_alunos')
    .select('*')
    .eq('familia_id', familiaId)
    .order('nome', { ascending: true })

  if (error) throw new Error(`Erro ao buscar filhos: ${error.message}`)
  return (data || []) as Aluno[]
}
```

---

#### 2.3 — Injetar contexto correto para SUPERVISOR em message.ts

**Arquivo:** `server/src/routes/message.ts`

**Adicione o import no topo** (junto aos outros imports de persistence):
```typescript
import { buscarFilhosDaFamilia } from '../db/persistence.js'
```

**Adicione o import de Qdrant** (junto ao import existente de buscarContextoProfessorIA):
```typescript
// já existe: import { buscarContextoProfessorIA } from '../db/qdrant.js'
// adicione ao mesmo import:
import { buscarContextoProfessorIA, buscarContextoLongoPrazo } from '../db/qdrant.js'
```

> ⚠️ Verifique se `buscarContextoLongoPrazo` já está exportada em `server/src/db/qdrant.ts`.
> Se não estiver exportada publicamente, exporte-a.

**No CASO B (`else { // Herói direto }`), após a injeção de contexto do PROFESSOR_IA,
adicione o bloco para SUPERVISOR_EDUCACIONAL:**

```typescript
// Injetar contexto rico para SUPERVISOR_EDUCACIONAL
if (persona === 'SUPERVISOR_EDUCACIONAL') {
  // 1. Buscar todas as filhas da família
  const todasFilhas = await buscarFilhosDaFamilia(familia_id).catch(() => [])

  // 2. Buscar histórico Qdrant da filha atualmente selecionada
  const memoriaFilha = await buscarContextoLongoPrazo(aluno_id, 'educacional').catch(() => null)

  // 3. Montar lista de filhas para o agente saber quem existe
  const listaFilhas = todasFilhas
    .map(f => `- ${f.nome} (${f.serie})`)
    .join('\n')

  const filhaAtual = todasFilhas.find(f => f.id === aluno_id)
  const nomeFilhaAtual = filhaAtual?.nome || 'filha selecionada'

  contextoFinal = contexto +
    `\n\n═══════════════════════════════════════════\n` +
    `SUPERVISOR — DADOS PEDAGÓGICOS\n` +
    `═══════════════════════════════════════════\n` +
    `FILHAS DESTA FAMÍLIA:\n${listaFilhas}\n\n` +
    `RELATÓRIO SENDO GERADO PARA: ${nomeFilhaAtual}\n` +
    (memoriaFilha
      ? `\nHISTÓRICO DE APRENDIZADO (${nomeFilhaAtual}):\n${memoriaFilha}\n`
      : `\nNOTA: Ainda não há histórico semanal consolidado para ${nomeFilhaAtual}. Use os turnos recentes disponíveis.\n`) +
    `═══════════════════════════════════════════\n`

  console.log(`[${aluno_id}] SUPERVISOR: contexto enriquecido (${todasFilhas.length} filha(s), memória=${!!memoriaFilha})`)
}
```

> ⚠️ Este bloco deve ficar DEPOIS do bloco do PROFESSOR_IA e ANTES de `chamarLLMStream`.
> Verifique que `contextoFinal` já está declarado antes (linha `let contextoFinal = contexto`).

---

#### 2.4 — Atualizar prompt do SUPERVISOR_EDUCACIONAL

**Arquivo:** `server/src/personas/SUPERVISOR_EDUCACIONAL.md`

Leia o arquivo completo primeiro. Localize a seção de instruções iniciais ou o início do comportamento do agente. Adicione (ou substitua se já existir seção parecida) a seção:

```markdown
## ABERTURA DA CONVERSA — MULTI-FILHO

Quando o pai iniciar a conversa, você tem acesso no contexto a:
- `FILHAS DESTA FAMÍLIA` — lista completa de filhas
- `RELATÓRIO SENDO GERADO PARA` — a filha atualmente selecionada

**Se houver 2 ou mais filhas:**
Comece SEMPRE reconhecendo as filhas disponíveis e confirmando sobre qual está falando:
> "Olá! Posso te dar um panorama sobre **[nome da filha selecionada]** ou sobre outra filha. Quer que eu comece com [nome]? Ou prefere falar sobre outra?"

**Se houver apenas 1 filha:**
Comece diretamente com o relatório dela, sem perguntar.

**Nunca** invente dados que não estão no histórico fornecido.
Se não houver histórico Qdrant, trabalhe apenas com os turnos recentes disponíveis e
diga ao pai: "Ainda não temos um histórico completo desta semana para [nome], mas posso te contar sobre as últimas interações."
```

**Depois, sincronize para dist:**
```bash
cp server/src/personas/SUPERVISOR_EDUCACIONAL.md server/dist/personas/SUPERVISOR_EDUCACIONAL.md
```

---

#### 2.5 — Gate 2 (go/no-go antes de commit)

```bash
# TypeScript check — server
cd C:\Users\Leon\Desktop\SuperAgentes_B2C_V2\server
npx tsc --noEmit

# TypeScript check — web (não mudou nada, mas sempre confirmar)
cd C:\Users\Leon\Desktop\SuperAgentes_B2C_V2\web
npx tsc --noEmit
```

Ambos → zero erros = APROVADO.

**Commit:**
```bash
cd C:\Users\Leon\Desktop\SuperAgentes_B2C_V2
git add server/src/routes/message.ts \
        server/src/db/persistence.ts \
        server/src/db/qdrant.ts \
        server/src/personas/SUPERVISOR_EDUCACIONAL.md \
        server/dist/personas/SUPERVISOR_EDUCACIONAL.md
git commit -m "fix(supervisor): contexto correto das filhas + multi-filho awareness

- persistence.ts: buscarFilhosDaFamilia(familiaId) — lista todas as filhas da família
- message.ts: SUPERVISOR injeta lista de filhas + histórico Qdrant da filha selecionada
- SUPERVISOR_EDUCACIONAL.md: instrução de abertura multi-filho (confirma com o pai de qual falar)"
```

---

### TAREFA 3 — PUSH FINAL

Após os dois commits acima:

```bash
cd C:\Users\Leon\Desktop\SuperAgentes_B2C_V2
git push origin main
```

Railway faz deploy automático. Aguarde ~2 minutos e teste manualmente:
1. Login como León (pai) → PIN → menu Supervisor
2. Verificar se o header mostra "Supervisor Educacional" com gradiente verde
3. Verificar se PROFESSOR_IA mostra gradiente âmbar/amarelo
4. Enviar primeira mensagem para Supervisor → deve perguntar sobre qual filha
5. Responder "Layla" → deve gerar relatório baseado no histórico dela

---

### TAREFA 4 — PERSISTIR ESTADO (obrigatório)

Após testes manuais passarem, atualize:

**`docs/MEMORIA_CURTA.md`** — marque:
- ✅ BUG-52 resolvido (cor PROFESSOR_IA âmbar)
- ✅ BUG-51 resolvido (SUPERVISOR com contexto correto das filhas)
- Próximo passo: Brainstorm Super Prova com Leon

**`docs/CHECKLIST_PROJETO.md`** — marque [x] nos itens BUG-52 e BUG-51

**Commit de docs:**
```bash
git add docs/MEMORIA_CURTA.md docs/CHECKLIST_PROJETO.md
git commit -m "docs: BUG-51 e BUG-52 resolvidos — memória atualizada"
git push origin main
```

---

## ATENÇÃO — ARMADILHAS CONHECIDAS

| Situação | O que fazer |
|----------|-------------|
| `buscarContextoLongoPrazo` não exportada | Adicionar `export` à função em `qdrant.ts` — não criar nova função |
| SUPERVISOR sem turnos no Qdrant (usuário novo) | Já tratado no fallback da Tarefa 2.3 — não é erro |
| TypeScript erro em `Aluno[]` | Verificar tipo `Aluno` em `server/src/db/supabase.ts` e usar o tipo correto |
| `tsc` não copia .md para dist/ | Sempre rodar `cp` manualmente após editar qualquer .md em personas/ |
| Qualquer dúvida sobre arquitetura | Ler `CLAUDE.md` na raiz do projeto — o princípio é: um GESTOR, personas são figurinos |

---

## NÃO FAZER (RESTRIÇÕES ABSOLUTAS)

- ❌ NÃO criar novos agentes ou novas personas
- ❌ NÃO criar abstrações ou classes onde uma função resolve
- ❌ NÃO reinventar o fluxo GESTOR → persona
- ❌ NÃO fazer push sem TypeScript check limpo
- ❌ NÃO fazer push sem atualizar os docs de memória
- ❌ NÃO alterar a lógica de cascata PSICOPEDAGOGICO → Herói (está perfeita)
- ❌ NÃO mexer em router.ts, llm.ts (exceto se bug óbvio), ou response-processor.ts

---

*Fim do prompt. Execute na ordem, respeite os gates, persista o estado.*
*Você é o guardião desta base de código. Deixe-a melhor do que encontrou.*
