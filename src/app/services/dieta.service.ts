import { inject, Injectable } from '@angular/core';
import { DbService } from '@services/db.service';
import {
  Alimento,
  DiaAdesao,
  DietaPlano,
  ItemRefeicao,
  Macros,
  MetasDieta,
  Refeicao,
} from '@models/dieta.model';

function uid(): string {
  return crypto.randomUUID();
}

const REFEICOES_PADRAO = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar'];
const PLANO_ID = 'plano';
const METAS_ID = 'metas-dieta';
const METAS_PADRAO: MetasDieta = {
  id: METAS_ID,
  kcal: 2000,
  proteina: 150,
  carbo: 200,
  gordura: 60,
};

@Injectable({ providedIn: 'root' })
export class DietaService {
  private readonly db = inject(DbService);

  /** Data de hoje no formato YYYY-MM-DD (local). */
  hoje(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ---- Biblioteca de alimentos ----
  async listarAlimentos(): Promise<Alimento[]> {
    const todos = await this.db.getAll<Alimento>('alimentos');
    return todos.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  novoAlimento(dados: Omit<Alimento, 'id'>): Alimento {
    return { id: uid(), ...dados };
  }

  async salvarAlimento(alimento: Alimento): Promise<void> {
    await this.db.put('alimentos', alimento);
  }

  async removerAlimento(id: string): Promise<void> {
    await this.db.delete('alimentos', id);
  }

  // ---- Metas ----
  async obterMetas(): Promise<MetasDieta> {
    const m = await this.db.get<MetasDieta>('config', METAS_ID);
    return m ?? { ...METAS_PADRAO };
  }

  async salvarMetas(metas: MetasDieta): Promise<void> {
    await this.db.put('config', { ...metas, id: METAS_ID });
  }

  // ---- Plano fixo ----
  /** Plano de dieta (único). Se não existir, retorna um novo com refeições padrão vazias. */
  async obterPlano(): Promise<DietaPlano> {
    const p = await this.db.get<DietaPlano>('dieta', PLANO_ID);
    if (p) return p;
    return {
      id: PLANO_ID,
      refeicoes: REFEICOES_PADRAO.map((nome) => ({ id: uid(), nome, itens: [] })),
    };
  }

  async salvarPlano(plano: DietaPlano): Promise<void> {
    await this.db.put('dieta', { ...plano, id: PLANO_ID });
  }

  // ---- Adesão do dia ----
  async obterAdesao(data: string): Promise<DiaAdesao> {
    const a = await this.db.get<DiaAdesao>('adesao', data);
    return a ?? { id: data, data, comidos: [] };
  }

  async salvarAdesao(adesao: DiaAdesao): Promise<void> {
    await this.db.put('adesao', adesao);
  }

  // ---- Helpers de macros ----
  criarItem(alimento: Alimento, quantidade: number): ItemRefeicao {
    const q = quantidade > 0 ? quantidade : 1;
    return {
      id: uid(),
      alimentoId: alimento.id,
      nome: alimento.nome,
      porcao: alimento.porcao,
      quantidade: q,
      kcal: Math.round(alimento.kcal * q),
      proteina: this.arred(alimento.proteina * q),
      carbo: this.arred(alimento.carbo * q),
      gordura: this.arred(alimento.gordura * q),
    };
  }

  totaisRefeicao(ref: Refeicao): Macros {
    return this.somar(ref.itens);
  }

  /** Macros totais do plano inteiro (a dieta completa). */
  macrosPlano(plano: DietaPlano): Macros {
    return this.somar(plano.refeicoes.flatMap((r) => r.itens));
  }

  /** Macros do que foi comido num dia (itens do plano marcados na adesão). */
  macrosComidos(plano: DietaPlano, adesao: DiaAdesao): Macros {
    const comidos = new Set(adesao.comidos);
    const itens = plano.refeicoes.flatMap((r) => r.itens).filter((i) => comidos.has(i.id));
    return this.somar(itens);
  }

  private somar(itens: ItemRefeicao[]): Macros {
    return itens.reduce<Macros>(
      (acc, i) => ({
        kcal: acc.kcal + (i.kcal || 0),
        proteina: this.arred(acc.proteina + (i.proteina || 0)),
        carbo: this.arred(acc.carbo + (i.carbo || 0)),
        gordura: this.arred(acc.gordura + (i.gordura || 0)),
      }),
      { kcal: 0, proteina: 0, carbo: 0, gordura: 0 },
    );
  }

  private arred(n: number): number {
    return Math.round(n * 10) / 10;
  }
}
