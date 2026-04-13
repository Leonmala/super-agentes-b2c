# QA v2 — Fluxo 1 — BLOCO B RE-RUN
**Data:** 2026-04-07  
**Perfil:** Layla Estefan Malatesta (7º Ano)  
**App:** https://independent-eagerness-production-7da9.up.railway.app  
**Conta:** leon@pense-ai.com  
**Commit testado:** 7a16ff5 (fix BUG-006 deployado)  
**Estado da sessão no boot:** agente_atual=PSICOPEDAGOGICO, tema_atual=NULL, turno_atual=0, turnos deletados (reset pelo OSCAR)

---

## RESULTADO GERAL: GATE APROVADO

| Bug | Status | Severidade |
|-----|--------|-----------|
| BUG-006 | ✅ PASS | MAIOR |
| BUG-005 | ✅ PASS | MÉDIO |
| BUG-004 regressão | ✅ PASS | MAIOR |

**Score: 10/10 — GATE APROVADO — pronto para Fluxo 2 Maria Paz**

---

## PARTE 1 — BUG-006: Roteador semântico sem intenção explícita

**Cenário:** Com GAIA (Geografia) ativa após clique no botão, enviar mensagem de intenção implícita de matéria diferente.

**Input enviado:** `preciso estudar história para a prova`

**Comportamento observado:**
1. Clique em "Geografia" → Header mudou para "Gaia / Geografia" ✅
2. GAIA respondeu com apresentação inicial construtivista (perguntou o que Layla queria explorar)
3. Mensagem "preciso estudar história para a prova" enviada com GAIA ativa
4. Após ~12s: **header mudou para "Tempus / História"**
5. TEMPUS respondeu: *"Que ótimo que você veio viajar no tempo comigo para se preparar para a prova de História! Para começarmos, qual período ou assunto específico você precisa revisar para a prova?"*

**Resultado:** PASS ✅  
**Evidência:** Header "Gaia / Geografia" → "Tempus / História". GAIA não respondeu à mensagem de história. TEMPUS assumiu o contexto sem mencionar Geografia.

---

## PARTE 2 — BUG-005: Carry-over cross-sessão TEMPUS

**Cenário:** Com TEMPUS ativo (chegou via roteamento semântico, sessão anterior resetada), enviar pergunta de história e verificar ausência de contexto de sessão anterior.

**Input enviado:** `quando foi a Proclamação da República?`

**Header no momento:** "Tempus / História" ✅

**Comportamento observado:**
TEMPUS respondeu:
- *"Essa é uma ótima pergunta, Layla!"*
- *"A Proclamação da República no Brasil aconteceu em 15 de novembro de 1889."*
- Explicou contexto histórico (insatisfação de militares, abolição da escravatura, ideias republicanas)
- Encerrou com pergunta construtivista: *"o que você acha que mudou na vida das pessoas logo depois que o Brasil deixou de ter um imperador e passou a ser uma República?"*

**Contexto de sessão anterior presente?** NÃO ✅  
Nenhuma menção a Português, redação, gramática, ou qualquer outro tema de sessões anteriores.

**Resultado:** PASS ✅  
**Evidência:** Resposta exclusivamente sobre História do Brasil, sem qualquer referência a contexto anterior.

**Nota pedagógica (fora do escopo do bug):** TEMPUS forneceu a data diretamente antes de construir raciocínio. Isso pode ser revisado numa próxima iteração de qualidade pedagógica, mas não impacta o teste do BUG-005.

---

## PARTE 3 — Regressão BUG-004: Herói explícito funciona

**Cenário:** Com TEMPUS ativo, solicitar troca explícita para CALCULUS.

**Input enviado:** `quero falar com o CALCULUS sobre frações`

**Comportamento observado:**
1. Header mudou de "Tempus / História" para **"Calculus / Matemática"** ✅
2. CALCULUS respondeu com analogia da pizza (pedagogia construtivista):  
   *"Se a gente cortar essa pizza em 8 pedaços iguais, e você comer 3 desses pedaços, como você representaria essa parte que você comeu usando números?"*

**Resultado:** PASS ✅  
**Evidência:** Header "Calculus / Matemática". CALCULUS respondeu sem dar a fração diretamente — usou analogia concreta para guiar o raciocínio.

---

## SEQUÊNCIA COMPLETA DO TESTE

```
1. Login: leon@pense-ai.com / 3282
2. Seleção perfil: Layla Estefan Malatesta (7º Ano)
3. Clique: botão "Geografia" → Header: "Gaia / Geografia"
   GAIA responde: apresentação + pergunta sobre tema
4. Envio: "preciso estudar história para a prova"
   → Header muda para "Tempus / História"        [BUG-006 PASS]
   TEMPUS responde: apresentação + pergunta sobre período
5. Envio: "quando foi a Proclamação da República?"
   → TEMPUS responde SEM contexto de sessão anterior [BUG-005 PASS]
   Resposta limpa: apenas conteúdo de História BR
6. Envio: "quero falar com o CALCULUS sobre frações"
   → Header muda para "Calculus / Matemática"    [BUG-004 PASS]
   CALCULUS responde: analogia da pizza (construtivista)
```

---

## GATE APROVADO — pronto para Fluxo 2 Maria Paz

Todos os bugs validados neste bloco estão corrigidos e confirmados em produção no commit 7a16ff5.

- BUG-006: PASS — roteador semântico funciona com herói ativo
- BUG-005: PASS — turnos de sessões anteriores não vazam cross-sessão
- BUG-004: PASS (regressão) — pedido explícito de herói ainda funciona

**Próxima ação:** Executar Fluxo 2 (Maria Paz, 3º Ano) com reset de contador.
