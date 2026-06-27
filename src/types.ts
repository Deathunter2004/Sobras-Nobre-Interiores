export type MdfType = 'Chapa' | 'Sobra';

export interface MdfItem {
  id: string;
  type: MdfType;
  pattern: string; // Cor / Padrão (ex: Branco Supremo, Louro Freijó)
  thickness: string; // Espessura (ex: 6mm, 15mm, 18mm)
  length: number; // Comprimento em mm
  width: number; // Largura em mm
  quantity: number; // Quantidade de peças idênticas
  notes?: string; // Observações opcionais (ex: "Sem fita de borda", "Lascado no canto")
  createdAt: string;
  updatedAt: string;
}

export const POPULAR_THICKNESSES = [
  '3mm',
  '6mm',
  '9mm',
  '12mm',
  '15mm',
  '18mm',
  '25mm',
  '30mm',
];

// Popular MDF patterns in Brazil for quick selection/autocomplete
export const POPULAR_PATTERNS = [
  'Branco Supremo (Matt)',
  'Branco Texturizado (TX)',
  'Louro Freijó',
  'Carvalho Munique',
  'Freijó Puro',
  'Nogal Malaga',
  'Preto Silk',
  'Preto TX',
  'Grafite Mate',
  'Titanium',
  'Arezzo',
  'Gianduia',
  'Cariola',
  'Nórdico',
  'Noce Autunno',
  'Cinza Sagrado',
  'Verde Floresta',
  'Azul Secreto',
];
