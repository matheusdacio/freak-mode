import { inject, Injectable } from '@angular/core';
import { DbService } from '@services/db.service';
import {
  Componente,
  DiaAdesao,
  DietaPlano,
  Macros,
  MetasDieta,
  OpcaoAlimento,
  RefeicaoPlano,
} from '@models/dieta.model';
import { planoMatheus } from '../data/dieta-seed';

function uid(): string {
  return crypto.randomUUID();
}

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

  hoje(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ---- Metas ----
  async obterMetas(): Promise<MetasDieta> {
    const m = await this.db.get<MetasDieta>('config', METAS_ID);
    return m ?? { ...METAS_PADRAO };
  }

  async salvarMetas(metas: MetasDieta): Promise<void> {
    await this.db.put('config', { ...metas, id: METAS_ID });
  }

  // ---- Plano ----
  async obterPlano(): Promise<DietaPlano> {
    const p = await this.db.get<DietaPlano>('dieta', PLANO_ID);
    // Compatibilidade: formatos antigos não tinham "componentes" — trata como vazio.
    const valido =
      p && Array.isArray(p.refeicoes) && p.refeicoes.every((r) => Array.isArray(r.componentes));
    return valido ? (p as DietaPlano) : { id: PLANO_ID, refeicoes: [] };
  }

  async salvarPlano(plano: DietaPlano): Promise<void> {
    await this.db.put('dieta', { ...plano, id: PLANO_ID });
  }

  /** Carrega o plano pré-montado do Matheus (Dietbox) e salva. */
  async importarPlanoMatheus(): Promise<DietaPlano> {
    const plano = planoMatheus();
    await this.salvarPlano(plano);
    return plano;
  }

  // ---- Adesão do dia ----
  async obterAdesao(data: string): Promise<DiaAdesao> {
    const a = await this.db.get<DiaAdesao>('adesao', data);
    // Compatibilidade: garante o objeto "escolhas".
    if (a && a.escolhas && typeof a.escolhas === 'object') return a;
    return { id: data, data, escolhas: {} };
  }

  async salvarAdesao(adesao: DiaAdesao): Promise<void> {
    await this.db.put('adesao', adesao);
  }

  // ---- Fábricas (itens novos no editor) ----
  novaOpcao(dados: Omit<OpcaoAlimento, 'id'>): OpcaoAlimento {
    return { id: uid(), ...dados };
  }
  novoComponente(nome: string): Componente {
    return { id: uid(), nome, opcoes: [] };
  }
  novaRefeicao(nome: string, horario?: string): RefeicaoPlano {
    return { id: uid(), nome, horario, componentes: [] };
  }

  // ---- Macros ----
  private mapaOpcoes(plano: DietaPlano): Map<string, OpcaoAlimento> {
    const m = new Map<string, OpcaoAlimento>();
    for (const r of plano.refeicoes)
      for (const c of r.componentes) for (const o of c.opcoes) m.set(o.id, o);
    return m;
  }

  /** Macros do que foi escolhido no dia (uma opção por componente). */
  macrosEscolhidos(plano: DietaPlano, adesao: DiaAdesao): Macros {
    const mapa = this.mapaOpcoes(plano);
    const opcoes = Object.values(adesao.escolhas)
      .map((id) => mapa.get(id))
      .filter((o): o is OpcaoAlimento => !!o);
    return this.somar(opcoes);
  }

  /** Macros escolhidos dentro de uma refeição específica. */
  macrosRefeicao(ref: RefeicaoPlano, adesao: DiaAdesao): Macros {
    const escolhidas = ref.componentes
      .map((c) => adesao.escolhas[c.id])
      .filter(Boolean);
    const opcoes = ref.componentes
      .flatMap((c) => c.opcoes)
      .filter((o) => escolhidas.includes(o.id));
    return this.somar(opcoes);
  }

  private somar(opcoes: OpcaoAlimento[]): Macros {
    return opcoes.reduce<Macros>(
      (acc, o) => ({
        kcal: acc.kcal + (o.kcal || 0),
        proteina: this.arred(acc.proteina + (o.proteina || 0)),
        carbo: this.arred(acc.carbo + (o.carbo || 0)),
        gordura: this.arred(acc.gordura + (o.gordura || 0)),
      }),
      { kcal: 0, proteina: 0, carbo: 0, gordura: 0 },
    );
  }

  private arred(n: number): number {
    return Math.round(n * 10) / 10;
  }
}
