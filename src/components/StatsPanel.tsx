import React from 'react';
import { Layers, Grid, Palette, Scissors } from 'lucide-react';
import { MdfItem } from '../types';

interface StatsPanelProps {
  items: MdfItem[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ items }) => {
  // Calculate stats
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const totalAreaM2 = items.reduce((acc, item) => {
    const itemArea = (item.length * item.width * item.quantity) / 1000000;
    return acc + itemArea;
  }, 0);

  const chapasCount = items
    .filter(item => item.type === 'Chapa')
    .reduce((acc, item) => acc + item.quantity, 0);

  const sobrasCount = items
    .filter(item => item.type === 'Sobra')
    .reduce((acc, item) => acc + item.quantity, 0);

  const uniquePatterns = new Set(items.map(item => item.pattern.trim().toLowerCase())).size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="stats-panel">
      {/* Total Area Card */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg transition-all hover:border-zinc-700/60">
        <div>
          <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Área de Estoque</span>
          <span className="text-2xl font-bold font-mono text-amber-500 mt-1 block">
            {totalAreaM2.toFixed(2)} <span className="text-sm font-normal text-zinc-400">m²</span>
          </span>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
          <Grid className="w-5 h-5" />
        </div>
      </div>

      {/* Total Items Card */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg transition-all hover:border-zinc-700/60">
        <div>
          <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Total de Peças</span>
          <span className="text-2xl font-bold font-mono text-zinc-100 mt-1 block">
            {totalItemsCount} <span className="text-sm font-normal text-zinc-500">un</span>
          </span>
        </div>
        <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* Chapas Completas */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg transition-all hover:border-zinc-700/60">
        <div>
          <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Chapas Inteiras</span>
          <span className="text-2xl font-bold font-mono text-emerald-500 mt-1 block">
            {chapasCount} <span className="text-sm font-normal text-zinc-500">un</span>
          </span>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
          <Grid className="w-5 h-5 opacity-80" />
        </div>
      </div>

      {/* Sobras Cadastradas */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg transition-all hover:border-zinc-700/60">
        <div>
          <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Sobras Úteis</span>
          <span className="text-2xl font-bold font-mono text-orange-500 mt-1 block">
            {sobrasCount} <span className="text-sm font-normal text-zinc-500">un</span>
          </span>
        </div>
        <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
          <Scissors className="w-5 h-5" />
        </div>
      </div>

      {/* Unique Colors Count - Small inline summary */}
      <div className="col-span-2 lg:col-span-4 bg-zinc-900/40 border border-zinc-800/40 rounded-lg py-2 px-4 flex items-center gap-2 text-xs text-zinc-400 font-mono">
        <Palette className="w-3.5 h-3.5 text-zinc-500" />
        <span>Padrões de cores cadastrados: </span>
        <strong className="text-zinc-200">{uniquePatterns} cores diferentes</strong>
        <span className="text-zinc-600">|</span>
        <span>Aproveitamento médio: </span>
        <strong className="text-zinc-200">
          {totalItemsCount > 0 ? (totalAreaM2 / totalItemsCount).toFixed(2) : '0.00'} m² por peça
        </strong>
      </div>
    </div>
  );
};
