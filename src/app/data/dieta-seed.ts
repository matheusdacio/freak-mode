import { DietaPlano, MetasDieta, OrientacoesPlano } from '@models/dieta.model';

// Plano alimentar de ganho de peso gradual (treinador, ago/2026).
// 6 refeições/dia. Café, lanches e ceia são combos fechados (componente "Opção");
// almoço e jantar são decompostos em componentes substituíveis, como no PDF.
// MACROS SÃO ESTIMATIVAS calculadas a partir das porções do PDF (ele não traz números), editáveis no app.
// Ids usam prefixo "g" para não colidir com os ids do plano anterior em dias de adesão antigos.

type Op = [nome: string, porcao: string, kcal: number, p: number, c: number, g: number];
interface CompSeed { nome: string; ops: Op[] }
interface RefSeed { nome: string; horario: string; comps: CompSeed[] }

const CARBO_ALMOCO: Op[] = [
  ['Arroz branco', '5 a 6 c. sopa (150-180g)', 210, 4, 46, 0.5],
  ['Batata cozida', 'porção equivalente (~250g)', 215, 5, 50, 0],
  ['Mandioca cozida', '~170g', 210, 1, 50, 0.5],
  ['Macarrão', '~2 pegadores (140g)', 220, 7, 43, 1.5],
];

const PROTEINA_ALMOCO: Op[] = [
  ['Frango grelhado', '1 filé grande (150g)', 248, 47, 0, 5],
  ['Carne moída magra', '4 a 5 c. sopa (150g)', 285, 40, 0, 13],
  ['Patinho', '1 bife grande (150g)', 245, 43, 0, 7],
  ['Ovos', '3 unid. (150g)', 235, 19, 1.5, 16.5],
  ['Peixe (preço acessível)', '1 filé grande (150g)', 195, 39, 0, 4],
];

const FEIJAO: Op[] = [['Feijão', '1 concha (100g)', 76, 5, 14, 0.5]];
const SALADA: Op[] = [['Salada e legumes variados', 'à vontade', 40, 2, 8, 0]];

const DADOS: RefSeed[] = [
  {
    nome: 'Café da manhã',
    horario: '07:30',
    comps: [
      {
        nome: 'Opção',
        ops: [
          ['Ovos + pão francês + banana', '3 ovos + 2 pães franceses + 1 banana', 625, 29, 82, 19.5],
          ['Ovos + pão integral + mamão', '3 ovos + 4 fatias de pão integral + 1 fatia de mamão', 555, 32, 64.5, 20.5],
          ['Vitamina + ovos', '300ml leite + 1 banana + 30g aveia + 30g whey + 2 ovos', 665, 52, 61, 25],
        ],
      },
    ],
  },
  {
    nome: 'Lanche da manhã',
    horario: '10:00',
    comps: [
      {
        nome: 'Opção',
        ops: [
          ['Iogurte + banana + aveia', '1 iogurte natural + 1 banana + 30g aveia', 310, 11, 51, 7.5],
          ['Sanduíche de ovos', '2 fatias de pão + 2 ovos', 285, 19, 25, 13],
          ['Vitamina', '250ml leite + 1 banana + 20-30g aveia + 30g whey', 460, 36.5, 55, 11.5],
        ],
      },
    ],
  },
  {
    nome: 'Almoço',
    horario: '12:00',
    comps: [
      { nome: 'Carboidrato', ops: CARBO_ALMOCO },
      { nome: 'Leguminosa', ops: FEIJAO },
      { nome: 'Proteína', ops: PROTEINA_ALMOCO },
      { nome: 'Salada / Legumes', ops: SALADA },
      { nome: 'Fruta', ops: [['1 porção de frutas', '1 porção', 70, 1, 17, 0]] },
    ],
  },
  {
    nome: 'Lanche da tarde',
    horario: '15:30',
    comps: [
      {
        nome: 'Opção',
        ops: [
          ['Pão francês + frango desfiado', '2 pães + 100g de frango', 465, 40, 58, 6.5],
          ['Arroz + frango', '150g de arroz + 120g de frango', 395, 41, 42, 4.5],
          ['Tapioca + ovos + fruta', '1 tapioca + 3 ovos + 1 fruta', 445, 20, 52.5, 16.5],
        ],
      },
    ],
  },
  {
    nome: 'Jantar',
    horario: '18:30',
    comps: [
      { nome: 'Carboidrato', ops: CARBO_ALMOCO },
      { nome: 'Leguminosa', ops: FEIJAO },
      { nome: 'Proteína', ops: PROTEINA_ALMOCO },
      { nome: 'Salada / Legumes', ops: SALADA },
    ],
  },
  {
    nome: 'Ceia',
    horario: '23:00',
    comps: [
      {
        nome: 'Opção',
        ops: [
          ['Vitamina', '300ml leite + 1 banana + 30g aveia + 30g whey', 510, 39, 60, 14],
          ['Iogurte + aveia + banana', '1 iogurte natural + 30g aveia + 1 banana', 310, 11, 51, 7.5],
          ['Ovos + pão integral', '3 ovos + 2 fatias de pão integral', 365, 25, 25.5, 18.5],
        ],
      },
    ],
  },
];

const ORIENTACOES: OrientacoesPlano = {
  estrategia:
    'Superávit moderado (2.500 a 2.600 kcal/dia) para ganho de massa sem acelerar o acúmulo de gordura. ' +
    'Acompanhar o peso pela média de 3 a 4 pesagens semanais, sempre em condições semelhantes. ' +
    'Se após 2 a 3 semanas o peso não apresentar tendência de alta, acrescentar 100 a 150 kcal/dia.',
  basicos: [
    { categoria: 'Carboidratos', itens: 'Arroz, feijão, pão, aveia, macarrão, batata, mandioca, tapioca' },
    { categoria: 'Proteínas', itens: 'Ovos, frango, carne moída magra, patinho, leite, iogurte, whey protein' },
    { categoria: 'Frutas e complementos', itens: 'Banana, mamão, maçã, frutas da estação, verduras e legumes' },
  ],
  rotacaoSemanal: [
    { dia: 'Segunda', proteina: 'Frango', carboidrato: 'Arroz + feijão' },
    { dia: 'Terça', proteina: 'Carne moída', carboidrato: 'Macarrão' },
    { dia: 'Quarta', proteina: 'Frango', carboidrato: 'Batata + arroz' },
    { dia: 'Quinta', proteina: 'Ovos + carne', carboidrato: 'Arroz + feijão' },
    { dia: 'Sexta', proteina: 'Frango', carboidrato: 'Macarrão ou mandioca' },
    { dia: 'Sábado', proteina: 'Carne magra', carboidrato: 'Arroz + feijão' },
    { dia: 'Domingo', proteina: 'Frango, carne ou peixe', carboidrato: 'Batata, arroz ou macarrão' },
  ],
  progressao: [
    { situacao: 'Peso subindo de forma lenta e consistente', ajuste: 'Manter as quantidades atuais.' },
    { situacao: 'Peso praticamente parado', ajuste: 'Adicionar 100 a 150 kcal/dia (mais arroz, aveia, pão ou leite).' },
    { situacao: 'Peso subindo rápido e cintura aumentando muito', ajuste: 'Evitar novo aumento de calorias e reavaliar as porções.' },
  ],
  observacao:
    'As quantidades são um ponto de partida e podem precisar de ajuste conforme rotina, treino, apetite e evolução do peso. ' +
    'Referência do plano: 71,1 kg, 15,9% de gordura corporal e ingestão estimada de 2.268 kcal/dia. ' +
    'Em caso de alergias, intolerâncias ou condições clínicas, revisar com nutricionista.',
};

/** Metas diárias derivadas do plano (meta de 2.500 a 2.600 kcal). */
export function metasGanhoDePeso(): MetasDieta {
  return { id: 'metas-dieta', kcal: 2550, proteina: 180, carbo: 300, gordura: 70 };
}

/** Monta o DietaPlano com ids estáveis (g{i}, g{i}c{j}, g{i}c{j}o{k}). */
export function planoGanhoDePeso(): DietaPlano {
  return {
    id: 'plano',
    orientacoes: ORIENTACOES,
    refeicoes: DADOS.map((r, i) => ({
      id: `g${i}`,
      nome: r.nome,
      horario: r.horario,
      componentes: r.comps.map((c, j) => ({
        id: `g${i}c${j}`,
        nome: c.nome,
        opcoes: c.ops.map((o, k) => ({
          id: `g${i}c${j}o${k}`,
          nome: o[0],
          porcao: o[1],
          kcal: o[2],
          proteina: o[3],
          carbo: o[4],
          gordura: o[5],
        })),
      })),
    })),
  };
}
