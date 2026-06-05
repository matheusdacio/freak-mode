# Treino — Controle de treino pessoal

App Angular 20 (standalone, signals, zoneless, OnPush) com persistência local em **IndexedDB**.
Roda 100% no navegador, **offline e sem custo**. Os dados ficam salvos no próprio dispositivo.

## Como rodar

```bash
npm install
npm start        # http://localhost:4200
```

## Build de produção

```bash
npm run build    # gera dist/treino-app
```

O roteamento usa `withHashLocation()`, então o build estático funciona direto no
**GitHub Pages** ou qualquer hospedagem de arquivos — ideal pra abrir no celular na academia.
Para "instalar" na tela inicial, abra no Chrome/Safari do celular → menu → *Adicionar à tela de início*.

## Como funciona

- **Treinos**: crie quantos quiser (Treino A, B, Legging…). Não há dias fixos — você escolhe qual treino fazer no dia.
- **Exercícios**: dentro de cada treino, adicione exercícios com nome e nº de séries. Pode editar/trocar a qualquer momento (a cada 3 meses, por ex.).
- **Execução**: ao iniciar, cada série já vem **pré-preenchida com o peso/reps da última vez** — é só ajustar. Notas opcionais por exercício.
- **Progressão**: gráfico por exercício ao longo das sessões (carga máxima ou volume = peso × reps). Sem datas, a evolução é medida por sessão (1ª, 2ª, 3ª…).

## Estrutura

```
src/app/
  models/      treino, exercicio, sessao
  services/    db (IndexedDB), treino, sessao
  pages/       treinos, treino-editor, execucao, historico
  shared/      line-chart (SVG, sem dependências)
```

Histórico é imutável: editar/excluir um treino não altera as sessões já salvas
(o nome do exercício é capturado no momento da execução).
