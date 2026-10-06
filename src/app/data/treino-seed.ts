import { Treino } from '@models/treino.model';

// Ficha de treino do professor (out/2026): divisão A a E, substitui PUSH/PULL/LEGS/UPPER/LOWER.
// Nomes e faixas transcritos da ficha; o que não cabe na faixa de reps (cada lado, série
// combinada, isometria) vai em "obs".
// Ids fixos: reimportar sobrescreve os mesmos documentos e mantém o vínculo com o histórico.
// v2 (06/10/2026): panturrilha no simulador de escada é 15 minutos de escada, não 4 x 12-15.
// v3 (06/10/2026): nome pelo grupamento (como PUSH/PULL/LEGS eram), com a letra da ficha na frente.

/** Sobe a cada correção; ao carregar, o app reaplica a ficha nos treinos gravados com versão menor. */
export const FICHA_VERSAO = 3;

const PREFIXO = 'ficha-out26';

const DESCANSO =
  'Descanso: 90-120 s nos exercícios principais; 60-90 s nos isoladores e combinados. ' +
  'Priorize técnica e amplitude.';

const COMBINADO = 'Em sequência, sem pausa; descanse só depois de completar o par.';

type Ex = [nome: string, series: number, min: number, max: number, obs?: string, unidade?: 'min'];
interface TreinoSeed { letra: string; grupo: string; exercicios: Ex[] }

const DADOS: TreinoSeed[] = [
  {
    letra: 'A',
    grupo: 'PEITO E COSTAS',
    exercicios: [
      ['SUPINO RETO COM BARRA GUIADA NO SMITH', 4, 6, 8],
      ['SUPINO INCLINADO COM BARRA NO SMITH', 3, 8, 10],
      ['CRUCIFIXO NO BANCO 30 GRAUS COM HALTER', 3, 10, 12],
      ['PUXADA ALTA PEGADA NEUTRA', 4, 8, 10],
      ['PUXADA ALTA UNILATERAL', 3, 10, 12, 'Cada lado.'],
      ['PANTURRILHA NO SIMULADOR DE ESCADA', 1, 15, 15, undefined, 'min'],
    ],
  },
  {
    letra: 'B',
    grupo: 'POSTERIOR E GLÚTEO',
    exercicios: [
      ['TERRA SUMÔ', 3, 6, 8],
      ['AGACHAMENTO LIVRE', 4, 6, 8],
      ['LEVANTAMENTO TERRA', 3, 6, 8],
      ['FLEXÃO NÓRDICA', 3, 6, 10],
      ['CADEIRA FLEXORA', 3, 10, 12],
      ['TRÍCEPS COICE NA POLIA', 3, 10, 12],
    ],
  },
  {
    letra: 'C',
    grupo: 'PEITO E COSTAS',
    exercicios: [
      [
        'SUPINO RETO COM HALTERES + FLEXÃO DE BRAÇO DIAMANTE',
        3,
        8,
        10,
        `8-10 no supino + flexão diamante até próximo da falha. ${COMBINADO}`,
      ],
      ['SUPINO INCLINADO COM HALTERES', 3, 8, 10],
      ['PARALELA', 3, 8, 12],
      ['BARRA FIXA', 3, 6, 10],
      ['REMADA CAVALINHO', 3, 8, 10],
      ['PANTURRILHA EM PÉ ISOMETRIA', 4, 12, 15, '12-15 reps + 15 s de isometria.'],
    ],
  },
  {
    letra: 'D',
    grupo: 'QUADRÍCEPS E BRAÇOS',
    exercicios: [
      ['CADEIRA ABDUTORA ARTICULADA', 3, 12, 15],
      ['CADEIRA ADUTORA', 3, 12, 15],
      ['CADEIRA EXTENSORA', 4, 10, 12],
      ['TRÍCEPS NO BANCO', 3, 10, 15],
      ['BÍCEPS NA POLIA COM CORDA', 3, 10, 12],
      [
        'OMBROS COMBINADO: ELEVAÇÃO LATERAL + REMADA ALTA + DESENVOLVIMENTO',
        3,
        10,
        10,
        '10 elevação lateral + 10 remada alta + 10 desenvolvimento, em sequência; descanse só depois dos três.',
      ],
    ],
  },
  {
    letra: 'E',
    grupo: 'COSTAS E PEITO',
    exercicios: [
      ['REMADA BAIXA UNILATERAL NA POLIA', 3, 8, 10, 'Cada lado.'],
      ['REMADA PEGADA NEUTRA NA POLIA', 3, 8, 10],
      ['REMADA SERROTE UNILATERAL', 3, 10, 12, 'Cada lado.'],
      [
        'CROSS OVER NA POLIA ALTURA DO PEITO + FLEXÃO DE BRAÇO ABERTO',
        3,
        10,
        12,
        `10-12 no cross over + flexão aberta até próximo da falha. ${COMBINADO}`,
      ],
      [
        'CROSS OVER POLIA BAIXA + FLEXÃO DE BRAÇO INCLINADO',
        3,
        10,
        12,
        `10-12 no cross over + flexão inclinada até próximo da falha. ${COMBINADO}`,
      ],
      ['CRUCIFIXO INVERTIDO NA MÁQUINA', 3, 12, 15],
    ],
  },
];

export function idTreinoFicha(letra: string): string {
  return `${PREFIXO}-${letra.toLowerCase()}`;
}

/** Os 5 treinos da ficha, na ordem A a E. */
export function treinosFichaProfessor(): Treino[] {
  return DADOS.map((t, i) => {
    const id = idTreinoFicha(t.letra);
    return {
      id,
      nome: `${t.letra} · ${t.grupo}`,
      ordem: i,
      obs: DESCANSO,
      fichaVersao: FICHA_VERSAO,
      exercicios: t.exercicios.map(([nome, series, repsMin, repsMax, obs, unidade], j) => ({
        id: `${id}-${j + 1}`,
        nome,
        series,
        repsMin,
        repsMax,
        ...(obs ? { obs } : {}),
        ...(unidade ? { unidade } : {}),
      })),
    };
  });
}
