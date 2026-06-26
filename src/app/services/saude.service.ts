import { inject, Injectable } from '@angular/core';
import { DbService } from '@services/db.service';
import { DiaAgua, RegistroMedidas, RegistroPeso } from '@models/saude.model';

/** Medidas corporais acompanhadas (cm). */
export const NOMES_MEDIDAS = ['Braço', 'Peito', 'Cintura', 'Quadril', 'Coxa', 'Panturrilha'];

const META_AGUA_ID = 'meta-agua';
const META_AGUA_PADRAO = 3000; // ml

@Injectable({ providedIn: 'root' })
export class SaudeService {
  private readonly db = inject(DbService);

  hoje(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ---- Peso ----
  async listarPesos(): Promise<RegistroPeso[]> {
    const todos = await this.db.getAll<RegistroPeso>('pesos');
    return todos.sort((a, b) => a.data.localeCompare(b.data));
  }

  async salvarPeso(peso: number, data = this.hoje()): Promise<void> {
    await this.db.put('pesos', { id: data, data, peso });
  }

  // ---- Medidas ----
  async listarMedidas(): Promise<RegistroMedidas[]> {
    const todos = await this.db.getAll<RegistroMedidas>('medidas');
    return todos.sort((a, b) => a.data.localeCompare(b.data));
  }

  async salvarMedidas(valores: Record<string, number>, data = this.hoje()): Promise<void> {
    await this.db.put('medidas', { id: data, data, valores });
  }

  // ---- Água ----
  async obterAgua(data = this.hoje()): Promise<DiaAgua> {
    const a = await this.db.get<DiaAgua>('agua', data);
    return a ?? { id: data, data, ml: 0 };
  }

  async salvarAgua(agua: DiaAgua): Promise<void> {
    await this.db.put('agua', agua);
  }

  async obterMetaAgua(): Promise<number> {
    const c = await this.db.get<{ id: string; ml: number }>('config', META_AGUA_ID);
    return c?.ml ?? META_AGUA_PADRAO;
  }

  async salvarMetaAgua(ml: number): Promise<void> {
    await this.db.put('config', { id: META_AGUA_ID, ml });
  }
}
