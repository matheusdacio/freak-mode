/** Registro de peso corporal num dia. id = YYYY-MM-DD (um por dia). */
export interface RegistroPeso {
  readonly id: string;
  data: string;
  peso: number; // kg
}

/** Registro de medidas corporais num dia. id = YYYY-MM-DD. */
export interface RegistroMedidas {
  readonly id: string;
  data: string;
  /** nome da medida (ex: "Braço") -> valor em cm. */
  valores: Record<string, number>;
}

/** Consumo de água de um dia. id = YYYY-MM-DD. */
export interface DiaAgua {
  readonly id: string;
  data: string;
  ml: number;
}
