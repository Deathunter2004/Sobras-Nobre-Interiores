import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, Edit2, Grid, List as ListIcon, HelpCircle, ArrowUpDown, Filter, X } from 'lucide-react';
import { MdfItem, MdfType } from '../types';
import { BoardVisualizer } from './BoardVisualizer';

interface MdfListProps {
  items: MdfItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: MdfItem) => void;
}

type ViewMode = 'grid' | 'table';
type SortField = 'pattern' | 'length' | 'width' | 'quantity' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const MdfList: React.FC<MdfListProps> = ({
  items,
  onUpdateQuantity,
  onDeleteItem,
  onEditItem,
}) => {
  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | MdfType>('All');
  const [thicknessFilter, setThicknessFilter] = useState<string>('All');
  
  // Dimensions filter (very useful to find a scrap that fits a specific cut!)
  const [minLen, setMinLen] = useState('');
  const [minWid, setMinWid] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // List of unique thicknesses available in the current inventory for filtering
  const uniqueThicknesses = Array.from(new Set(items.map((item) => item.thickness))).sort();

  // Filter & Sort Logic
  const filteredItems = items
    .filter((item) => {
      // Search text
      const matchesSearch =
        item.pattern.toLowerCase().includes(search.toLowerCase()) ||
        item.thickness.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));

      // Type Filter
      const matchesType = typeFilter === 'All' || item.type === typeFilter;

      // Thickness Filter
      const matchesThickness = thicknessFilter === 'All' || item.thickness === thicknessFilter;

      // Min Length Filter
      const parsedMinLen = parseFloat(minLen);
      const matchesMinLen = isNaN(parsedMinLen) || item.length >= parsedMinLen;

      // Min Width Filter
      const parsedMinWid = parseFloat(minWid);
      const matchesMinWid = isNaN(parsedMinWid) || item.width >= parsedMinWid;

      return matchesSearch && matchesType && matchesThickness && matchesMinLen && matchesMinWid;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'pattern') {
        comparison = a.pattern.localeCompare(b.pattern);
      } else if (sortField === 'length') {
        comparison = a.length - b.length;
      } else if (sortField === 'width') {
        comparison = a.width - b.width;
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setThicknessFilter('All');
    setMinLen('');
    setMinWid('');
  };

  const hasActiveFilters =
    search !== '' ||
    typeFilter !== 'All' ||
    thicknessFilter !== 'All' ||
    minLen !== '' ||
    minWid !== '';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl" id="mdf-list-container">
      {/* Top Controls: Search and View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
        <h2 className="text-lg font-display font-semibold text-zinc-100 flex items-center gap-2">
          Itens no Estoque
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-mono">
            {filteredItems.length} de {items.length} itens
          </span>
        </h2>

        <div className="flex items-center gap-2">
          {/* View Toggle Buttons */}
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${
                viewMode === 'grid' ? 'bg-zinc-800 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Exibição em Grade"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition ${
                viewMode === 'table' ? 'bg-zinc-800 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Exibição em Tabela Compacta"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* Text Search */}
          <div className="relative md:col-span-5">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por cor, espessura, tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition placeholder-zinc-600"
            />
          </div>

          {/* Quick Type Selectors */}
          <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 md:col-span-4 justify-between">
            {(['All', 'Chapa', 'Sobra'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-xs px-3 py-1 rounded transition-all font-medium flex-1 ${
                  typeFilter === t
                    ? t === 'Chapa'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : t === 'Sobra'
                      ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {t === 'All' ? 'Tudo' : t === 'Chapa' ? 'Chapas' : 'Sobras'}
              </button>
            ))}
          </div>

          {/* Thickness Dropdown */}
          <div className="md:col-span-3">
            <select
              value={thicknessFilter}
              onChange={(e) => setThicknessFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition"
            >
              <option value="All">Todas as espessuras</option>
              {uniqueThicknesses.map((thick) => (
                <option key={thick} value={thick}>
                  {thick}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle Advanced Sizing Filters (Crucial for woodworking remnants) */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-xs text-amber-500/90 hover:text-amber-400 flex items-center gap-1.5 font-medium transition cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            {showAdvancedFilters ? 'Ocultar Filtro de Medidas Mínimas' : 'Filtrar por Medidas Mínimas (Achar retalhos)'}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Advanced Dimensional Sizing Form */}
        {showAdvancedFilters && (
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                Comprimento Mínimo (mm)
              </label>
              <input
                type="number"
                placeholder="Ex: 800"
                value={minLen}
                onChange={(e) => setMinLen(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                Largura Mínima (mm)
              </label>
              <input
                type="number"
                placeholder="Ex: 400"
                value={minWid}
                onChange={(e) => setMinWid(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-end text-zinc-500 text-[11px] pb-1 gap-1">
              <HelpCircle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              <span>Mostra apenas peças grandes o suficiente para o seu corte de MDF.</span>
            </div>
          </div>
        )}
      </div>

      {/* Sorting Tabs for Desktop / Quick Indicators */}
      <div className="flex gap-2 text-xs text-zinc-500 mb-3 bg-zinc-950/20 py-1.5 px-3 rounded-lg border border-zinc-800/40 items-center">
        <span className="font-medium mr-1">Ordenar por:</span>
        <button
          onClick={() => handleSort('createdAt')}
          className={`px-2 py-0.5 rounded transition ${
            sortField === 'createdAt' ? 'bg-zinc-800 text-zinc-200' : 'hover:text-zinc-300'
          }`}
        >
          Data {sortField === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
        </button>
        <button
          onClick={() => handleSort('pattern')}
          className={`px-2 py-0.5 rounded transition ${
            sortField === 'pattern' ? 'bg-zinc-800 text-zinc-200' : 'hover:text-zinc-300'
          }`}
        >
          Cor {sortField === 'pattern' && (sortOrder === 'asc' ? '▲' : '▼')}
        </button>
        <button
          onClick={() => handleSort('length')}
          className={`px-2 py-0.5 rounded transition ${
            sortField === 'length' ? 'bg-zinc-800 text-zinc-200' : 'hover:text-zinc-300'
          }`}
        >
          Comprimento {sortField === 'length' && (sortOrder === 'asc' ? '▲' : '▼')}
        </button>
        <button
          onClick={() => handleSort('width')}
          className={`px-2 py-0.5 rounded transition ${
            sortField === 'width' ? 'bg-zinc-800 text-zinc-200' : 'hover:text-zinc-300'
          }`}
        >
          Largura {sortField === 'width' && (sortOrder === 'asc' ? '▲' : '▼')}
        </button>
        <button
          onClick={() => handleSort('quantity')}
          className={`px-2 py-0.5 rounded transition ${
            sortField === 'quantity' ? 'bg-zinc-800 text-zinc-200' : 'hover:text-zinc-300'
          }`}
        >
          Qtd {sortField === 'quantity' && (sortOrder === 'asc' ? '▲' : '▼')}
        </button>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-850" id="empty-state">
          <p className="text-zinc-400 font-medium">Nenhum item encontrado.</p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm bg-zinc-800 hover:bg-zinc-755 text-amber-500 font-semibold px-4 py-1.5 rounded-lg border border-zinc-700 transition"
            >
              Remover Filtros
            </button>
          ) : (
            <p className="text-xs text-zinc-600 mt-1">Insira MDFs usando o formulário ao lado para começar.</p>
          )}
        </div>
      )}

      {/* Item Display - Card Grid Mode */}
      {viewMode === 'grid' && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="inventory-grid">
          {filteredItems.map((item) => {
            const areaM2 = (item.length * item.width * item.quantity) / 1000000;
            return (
              <div
                key={item.id}
                className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700/80 rounded-xl p-4 flex flex-col justify-between transition-all group relative"
              >
                {/* Header info */}
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        item.type === 'Chapa'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-zinc-500">
                      {item.thickness}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-zinc-100 text-sm group-hover:text-amber-400 transition truncate" title={item.pattern}>
                    {item.pattern}
                  </h3>

                  {/* Dimensions specs */}
                  <div className="mt-3 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/40 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Comprimento:</span>
                      <span className="font-mono text-zinc-200 font-medium">
                        {item.length} mm <span className="text-zinc-500 text-[10px]">({(item.length / 10).toFixed(1)} cm)</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Largura:</span>
                      <span className="font-mono text-zinc-200 font-medium">
                        {item.width} mm <span className="text-zinc-500 text-[10px]">({(item.width / 10).toFixed(1)} cm)</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-800/60 font-mono">
                      <span className="text-zinc-500 font-sans text-[11px]">Área total:</span>
                      <span className="text-amber-500/90 font-bold">{areaM2.toFixed(3)} m²</span>
                    </div>
                  </div>

                  {/* Optional notes */}
                  {item.notes && (
                    <p className="text-xs text-zinc-500 italic mt-2 bg-zinc-900/20 p-1.5 px-2.5 rounded border border-zinc-800/30 truncate" title={item.notes}>
                      “{item.notes}”
                    </p>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="mt-4 pt-3 border-t border-zinc-900 flex flex-col gap-3">
                  {/* Visualizer inside card */}
                  <div className="mx-auto">
                    <BoardVisualizer length={item.length} width={item.width} type={item.type} />
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    {/* Quantity Quick Modifier */}
                    <div className="flex items-center bg-zinc-900 border border-zinc-850 rounded overflow-hidden p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="p-1 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
                        title="Subtrair 1 peça"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold font-mono text-zinc-200 min-w-8 text-center select-none">
                        {item.quantity} un
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
                        title="Adicionar 1 peça"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Edit and Delete Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition cursor-pointer"
                        title="Editar Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        title="Excluir Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Display - Dense Table List Mode */}
      {viewMode === 'table' && filteredItems.length > 0 && (
        <div className="overflow-x-auto border border-zinc-800 rounded-xl" id="inventory-table-container">
          <table className="w-full text-left text-zinc-300 text-sm">
            <thead className="bg-zinc-950 text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Cor / Padrão</th>
                <th className="py-3 px-4">Espessura</th>
                <th className="py-3 px-4">Dimensões (mm)</th>
                <th className="py-3 px-4">Dimensões (cm)</th>
                <th className="py-3 px-4 text-center">Qtd</th>
                <th className="py-3 px-4">Área Total</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
              {filteredItems.map((item) => {
                const totalM2 = (item.length * item.width * item.quantity) / 1000000;
                return (
                  <tr key={item.id} className="hover:bg-zinc-900/30 transition-colors group">
                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          item.type === 'Chapa'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/10'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    {/* Pattern and notes */}
                    <td className="py-3 px-4 font-medium text-zinc-100 font-display">
                      <div className="flex flex-col">
                        <span>{item.pattern}</span>
                        {item.notes && (
                          <span className="text-xs text-zinc-500 italic mt-0.5 truncate max-w-xs">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Thickness */}
                    <td className="py-3 px-4 font-mono text-zinc-400 text-xs">
                      {item.thickness}
                    </td>

                    {/* Size in mm */}
                    <td className="py-3 px-4 font-mono text-xs text-zinc-300">
                      {item.length} x {item.width} mm
                    </td>

                    {/* Size in cm */}
                    <td className="py-3 px-4 font-mono text-xs text-zinc-500">
                      {(item.length / 10).toFixed(1)} x {(item.width / 10).toFixed(1)} cm
                    </td>

                    {/* Quantity Quick adjustment */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded w-fit mx-auto p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-2 font-semibold font-mono text-zinc-200 min-w-6 text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>

                    {/* Total Area in M² */}
                    <td className="py-3 px-4 font-mono text-xs text-amber-500/90 font-bold">
                      {totalM2.toFixed(2)} m²
                    </td>

                    {/* Action icons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
