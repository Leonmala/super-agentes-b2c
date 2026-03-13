SISTEMA INICIALMENTE FEITO EM N8N - AGENTE QUE SOBE NO QDRANT PODE CONTINUAR EM N8N...ABAIXO ESTA A CONFIGURACAO DO NODO DE ACESSO PARA OS AGENTES NO SISTEMA ANTIGO.

QdrantApi account
Operation Mode
Retrieve Documents (As Tool for AI Agent)
Description
Busca memória semântica no Qdrant (coleção memoria_semantica) e retorna trechos relevantes. Use filtros por estudante_id/turma quando disponíveis.
Qdrant Collection
From list
memoria_semantica
Limit
8
Include Metadata

Rerank Results

Options
Search Filter
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
{
  "must": [
    {
      "key": "metadata.estudante_id",
      "match": {
        "value": "={{ $json.estudante_id }}"
      }
    }
  ],
  "should": [
    {
      "key": "metadata.turma",
      "match": {
        "value": "={{ $json.turma }}"
      }
    },
    {
      "key": "metadata.etapa",
      "match": {
        "value": "={{ $json.etapa }}"
      }
    },
    {
      "key": "metadata.semana",
      "match": {
        "value": "={{ $json.semana }}"
      }
    }
  ]
}

Add Option
