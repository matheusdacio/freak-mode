import { DietaPlano } from '@models/dieta.model';

// Plano alimentar do Matheus (Dietbox / nutri Talita Colaço, 18/06/2021).
// Estrutura: refeição -> componente -> opções de substituição.
// MACROS SÃO ESTIMATIVAS por porção (a nutri não passou números) — editáveis no app.

type Op = [nome: string, porcao: string, kcal: number, p: number, c: number, g: number];
interface CompSeed { nome: string; ops: Op[] }
interface RefSeed { nome: string; horario: string; comps: CompSeed[] }

const DADOS: RefSeed[] = [
  {
    nome: 'Café da manhã',
    horario: '06:30',
    comps: [
      { nome: 'Bebida', ops: [['Café sem açúcar', 'à vontade', 0, 0, 0, 0]] },
      {
        nome: 'Carboidrato',
        ops: [
          ['Pão integral', '2 fatias (50g)', 130, 6, 24, 2],
          ['Batata doce cozida', '6 rodelas méd. (130g)', 112, 2, 26, 0],
          ['Aipim cozido', '1 unid. média (80g)', 100, 1, 24, 0],
          ['Aveia', '4 c. sopa (35g)', 136, 5, 24, 3],
          ['Granola', '2 c. sopa (35g)', 150, 4, 24, 5],
          ['Rosca de polvilho', '2 pedaços méd. (34g)', 120, 1, 20, 4],
          ['Biscoito integral/gergelim', '6 unid. (40g)', 180, 4, 26, 6],
          ['Tapioca', '4 c. sopa (40g)', 140, 0, 34, 0],
          ['Torrada integral/multigrão', '4 unid. (40g)', 150, 5, 28, 3],
          ['Bolo integral s/ açúcar', '1 fatia méd. (60g)', 180, 4, 28, 6],
        ],
      },
      {
        nome: 'Gordura',
        ops: [
          ['Manteiga', '1 c. sob. (5g)', 36, 0, 0, 4],
          ['Azeite de oliva', '1 c. sob. rasa (5g)', 44, 0, 0, 5],
          ['Abacate/guacamole', '1 c. sopa (30g)', 48, 1, 3, 4],
          ['Pasta de amendoim', '1/2 c. sopa (10g)', 60, 2.5, 2, 5],
        ],
      },
      {
        nome: 'Proteína',
        ops: [
          ['Ovo mexido', '1 unid. (50g)', 90, 6, 0.5, 7],
          ['Ricota', '1 fatia grossa (25g)', 35, 3, 1, 2],
          ['Creme de ricota', '2 c. sopa', 60, 3, 2, 4],
          ['Cottage', '3 c. sopa (50g)', 50, 6, 2, 2],
          ['Requeijão', '1 c. sopa (13g)', 35, 1.5, 1, 3],
          ['Queijo minas', '1 fatia (25g)', 60, 4, 1, 4],
          ['Patê de atum c/ iogurte', '2 c. sopa', 70, 8, 1, 4],
        ],
      },
      { nome: 'Fruta', ops: [['1 porção de frutas', '1 porção', 70, 1, 17, 0]] },
    ],
  },
  {
    nome: 'Lanche da manhã',
    horario: '09:30',
    comps: [
      { nome: 'Fruta', ops: [['1 porção de frutas', '1 porção', 70, 1, 17, 0]] },
      {
        nome: 'Oleaginosa',
        ops: [
          ['Castanha do Brasil', '2 unid. grandes (8g)', 52, 1, 1, 5],
          ['Amêndoa', '8 unid. (9g)', 54, 2, 2, 5],
          ['Caju', '4 unid. (9g)', 52, 1.5, 3, 4],
          ['Nozes', '3,5 unid. (8g)', 52, 1, 1, 5],
          ['Coco', '1 pedaço peq. (15g)', 50, 0.5, 2, 5],
          ['Abacate', '2 c. sopa (60g)', 96, 1, 5, 9],
          ['Pasta de amendoim', '0,5 c. sopa (8g)', 48, 2, 1.5, 4],
          ['Semente de girassol', '2 c. sopa (8g)', 46, 1.5, 1.5, 4],
          ['Pistache', '1 c. sopa (9g)', 52, 2, 2.5, 4],
          ['Macadâmia', '3,5 unid. (7g)', 50, 0.5, 1, 5],
        ],
      },
      {
        nome: 'Laticínio/Proteína',
        ops: [
          ['Iogurte natural desnatado/kefir', '200ml (1 copo)', 90, 10, 12, 0],
          ['Leite desnatado', '200ml (1 copo)', 70, 7, 10, 0],
          ['Grego simples', '100g (½ copo)', 100, 9, 4, 5],
          ['Leite em pó desnatado', '2 c. sopa (20g)', 72, 7, 11, 0],
          ['Leite fermentado', '100ml (½ copo)', 70, 2, 15, 0],
          ['Suco verde', '200ml (1 copo)', 80, 2, 18, 0],
          ['Whey protein', '1 scoop (25g)', 100, 20, 2, 1.5],
        ],
      },
    ],
  },
  {
    nome: 'Almoço',
    horario: '12:00',
    comps: [
      {
        nome: 'Carboidrato',
        ops: [
          ['Arroz integral', '4 c. sopa (100g)', 124, 3, 26, 1],
          ['Arroz 7 grãos', '4 c. sopa (100g)', 130, 3, 27, 1],
          ['Batata doce', '7 fatias méd. (160g)', 138, 2, 32, 0],
          ['Batata salsa', '2 unid. peq. (160g)', 140, 3, 30, 0],
          ['Aipim', '1 unid. méd. (100g)', 125, 1, 30, 0],
          ['Polenta', '4 c. servir (120g)', 110, 2, 24, 1],
          ['Macarrão integral', '2 c. servir (100g)', 150, 6, 30, 1.5],
          ['Moranga', '6 c. sopa (300g)', 120, 3, 24, 1],
          ['Milho verde', '5 c. sopa (120g)', 115, 4, 24, 1.5],
          ['Quinoa em grãos', '~100g cozida', 120, 4, 21, 2],
        ],
      },
      {
        nome: 'Leguminosa',
        ops: [
          ['Feijão', '1 concha peq. (100g)', 76, 5, 13, 0.5],
          ['Feijão branco', '½ concha (50g)', 70, 5, 12, 0.5],
          ['Grão de bico', '2,5 c. sopa (50g)', 82, 4, 14, 1.5],
          ['Lentilha', '4,5 c. sopa (85g)', 98, 7, 17, 0.4],
          ['Ervilha', '6 c. sopa (90g)', 75, 5, 13, 0.4],
          ['Vagem', '5,5 c. sopa (90g)', 30, 2, 6, 0],
        ],
      },
      {
        nome: 'Proteína',
        ops: [
          ['Carne bovina magra', '1 bife méd. (100g)', 190, 28, 0, 8],
          ['Frango grelhado', '1 filé méd. (100g)', 165, 31, 0, 4],
          ['Ovo', '2 unid. (100g)', 155, 13, 1, 11],
          ['Peixe (salmão/tilápia/atum)', '1 filé méd. (100g)', 120, 22, 0, 3],
        ],
      },
      { nome: 'Salada crua', ops: [['Salada (mín. 3 tipos)', 'à vontade', 25, 1, 5, 0]] },
      { nome: 'Legumes cozidos', ops: [['Legumes cozidos', 'à vontade', 40, 2, 8, 0]] },
      {
        nome: 'Gordura',
        ops: [
          ['Azeite de oliva', '1 c. sopa (10g)', 88, 0, 0, 10],
          ['Abacate/guacamole', '1 c. sopa', 50, 1, 3, 4.5],
        ],
      },
    ],
  },
  {
    nome: 'Lanche da tarde',
    horario: '15:00',
    comps: [
      { nome: 'Bebida', ops: [['Café sem açúcar', 'à vontade', 0, 0, 0, 0]] },
      {
        nome: 'Laticínio',
        ops: [
          ['Leite semidesnatado', '100ml (½ copo)', 50, 3.5, 5, 2],
          ['Iogurte natural desnatado/kefir', '100ml (½ copo)', 45, 5, 6, 0],
          ['Grego simples', '65g (1/3 copo)', 65, 6, 2.5, 3],
          ['Leite em pó desnatado', '1 c. sopa (10g)', 36, 3.5, 5.5, 0],
          ['Leite fermentado', '50ml (¼ copo)', 35, 1, 7.5, 0],
          ['Suco verde', '200ml (1 copo)', 80, 2, 18, 0],
        ],
      },
      {
        nome: 'Carboidrato',
        ops: [
          ['Pão integral', '1 fatia (25g)', 65, 3, 12, 1],
          ['Batata doce', '3 rodelas méd. (65g)', 56, 1, 13, 0],
          ['Aipim cozido', '½ unid. méd. (40g)', 50, 0.5, 12, 0],
          ['Aveia', '2 c. sopa (18g)', 70, 2.5, 12, 1.5],
          ['Granola', '1 c. sopa (18g)', 78, 2, 12, 2.5],
          ['Rosca de polvilho', '1 pedaço méd. (17g)', 60, 0.5, 10, 2],
          ['Biscoito integral/gergelim', '3 unid. (20g)', 90, 2, 13, 3],
          ['Tapioca', '2 c. sopa (20g)', 70, 0, 17, 0],
          ['Torrada integral', '2 unid. (20g)', 75, 2.5, 14, 1.5],
          ['Bolo integral s/ açúcar', '1 fatia peq. (30g)', 90, 2, 14, 3],
          ['Cookies integral', '3 unid. peq.', 110, 2, 16, 4],
        ],
      },
      {
        nome: 'Proteína',
        ops: [
          ['Ricota', '1 fatia grossa (25g)', 35, 3, 1, 2],
          ['Ovo mexido', '1 unid. (50g)', 78, 6, 0.5, 5.5],
          ['Cottage', '3 c. sopa (50g)', 50, 6, 2, 2],
          ['Requeijão', '1 c. sopa (13g)', 35, 1.5, 1, 3],
          ['Queijo minas', '1 fatia (25g)', 60, 4, 1, 4],
          ['Patê de atum c/ iogurte', '2 c. sopa', 70, 8, 1, 4],
        ],
      },
      { nome: 'Fruta', ops: [['1 porção de frutas', '1 porção', 70, 1, 17, 0]] },
    ],
  },
  {
    nome: 'Lanche da tarde 2',
    horario: '18:00',
    comps: [
      {
        nome: 'Carboidrato',
        ops: [
          ['Pão integral', '2 fatias (50g)', 130, 6, 24, 2],
          ['Rap 10 integral', '1 unid.', 120, 4, 22, 2],
          ['Pão sírio integral', '1 unid. peq.', 130, 5, 26, 1.5],
          ['Tapioca + chia/linhaça', '2 c. sopa (20g)', 80, 1, 18, 1],
          ['Aipim cozido', '1½ unid. méd. (115g)', 145, 1, 35, 0],
          ['Batata doce cozida', '7,5 rodelas méd. (185g)', 160, 2.5, 37, 0],
        ],
      },
      {
        nome: 'Proteína',
        ops: [
          ['Frango', '½ filé (50g)', 82, 15, 0, 2],
          ['Atum em conserva', '3 c. sopa (60g)', 80, 14, 0, 2.5],
          ['Sardinha em conserva', '1 unid. méd. (60g)', 120, 14, 0, 7],
          ['Carne moída magra', '3 c. sopa (45g)', 90, 12, 0, 4.5],
          ['Ovo', '1 unid. (50g)', 78, 6, 0.5, 5.5],
        ],
      },
      {
        nome: 'Vegetais',
        ops: [['Tomate (3) + alface (3) + cenoura ralada (1 c.sp)', 'fixo', 18, 0.6, 3.5, 0]],
      },
    ],
  },
  {
    nome: 'Jantar',
    horario: '21:00',
    comps: [
      {
        nome: 'Carboidrato',
        ops: [
          ['Arroz integral', '3 c. sopa (75g)', 93, 2, 20, 0.8],
          ['Arroz 7 grãos', '3 c. sopa (75g)', 98, 2.5, 20, 0.8],
          ['Batata doce', '5 fatias méd. (120g)', 104, 1.5, 24, 0],
          ['Batata salsa', '1 unid. peq. (80g)', 70, 1.5, 15, 0],
          ['Aipim', '1 unid. peq. (75g)', 94, 0.7, 22, 0],
          ['Polenta', '3 c. servir (90g)', 82, 1.5, 18, 0.7],
          ['Macarrão integral', '1½ c. servir (75g)', 112, 4.5, 22, 1],
          ['Moranga', '5 c. sopa (280g)', 112, 3, 22, 1],
          ['Milho verde', '4 c. sopa (90g)', 86, 3, 18, 1],
          ['Quinoa em grãos', '~75g cozida', 90, 3, 16, 1.5],
        ],
      },
      {
        nome: 'Proteína',
        ops: [
          ['Carne bovina magra', '1 bife méd. (100g)', 190, 28, 0, 8],
          ['Frango grelhado', '1 filé méd. (100g)', 165, 31, 0, 4],
          ['Ovo', '2 unid. (100g)', 155, 13, 1, 11],
          ['Peixe (salmão/tilápia/atum)', '1 filé méd. (100g)', 120, 22, 0, 3],
        ],
      },
      { nome: 'Salada crua', ops: [['Salada (mín. 3 tipos)', 'à vontade', 25, 1, 5, 0]] },
      { nome: 'Legumes cozidos', ops: [['Legumes cozidos', 'à vontade', 40, 2, 8, 0]] },
      {
        nome: 'Gordura',
        ops: [
          ['Azeite de oliva', '1 c. sopa (10g)', 88, 0, 0, 10],
          ['Abacate/guacamole', '1 c. sopa', 50, 1, 3, 4.5],
        ],
      },
    ],
  },
];

/** Monta o DietaPlano com ids estáveis (r{i}, r{i}c{j}, r{i}c{j}o{k}). */
export function planoMatheus(): DietaPlano {
  return {
    id: 'plano',
    refeicoes: DADOS.map((r, i) => ({
      id: `r${i}`,
      nome: r.nome,
      horario: r.horario,
      componentes: r.comps.map((c, j) => ({
        id: `r${i}c${j}`,
        nome: c.nome,
        opcoes: c.ops.map((o, k) => ({
          id: `r${i}c${j}o${k}`,
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
