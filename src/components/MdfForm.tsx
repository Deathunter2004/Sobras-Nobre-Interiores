import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Check, RotateCcw, AlertTriangle, Eye } from 'lucide-react';
import { MdfItem, MdfType, POPULAR_THICKNESSES, POPULAR_PATTERNS } from '../types';

interface MdfFormProps {
  onSave: (item: Omit<MdfItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  editingItem: MdfItem | null;
  onCancelEdit: () => void;
}

export const MdfForm: React.FC<MdfFormProps> = ({ onSave, editingItem, onCancelEdit }) => {
  const [type, setType] = useState<MdfType>('Sobra');
  const [pattern, setPattern] = useState('');
  const [thickness, setThickness] = useState('15mm');
  const [customThickness, setCustomThickness] = useState('');
  const [isCustomThickness, setIsCustomThickness] = useState(false);
  
  // Dimensions and Units
  const [unit, setUnit] = useState<'mm' | 'cm'>('mm');
  const [lengthInput, setLengthInput] = useState('');
  const [widthInput, setWidthInput] = useState('');
  
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form to blank defaults
  const resetForm = () => {
    setType('Sobra');
    setPattern('');
    setThickness('15mm');
    setCustomThickness('');
    setIsCustomThickness(false);
    setLengthInput('');
    setWidthInput('');
    setQuantity(1);
    setNotes('');
    setErrors({});
  };

  // Populate form if we are editing an item
  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setPattern(editingItem.pattern);
      
      if (POPULAR_THICKNESSES.includes(editingItem.thickness)) {
        setThickness(editingItem.thickness);
        setIsCustomThickness(false);
      } else {
        setThickness('Outro');
        setCustomThickness(editingItem.thickness);
        setIsCustomThickness(true);
      }
      
      // Keep dimensions in current selected unit
      if (unit === 'cm') {
        setLengthInput((editingItem.length / 10).toString());
        setWidthInput((editingItem.width / 10).toString());
      } else {
        setLengthInput(editingItem.length.toString());
        setWidthInput(editingItem.width.toString());
      }
      
      setQuantity(editingItem.quantity);
      setNotes(editingItem.notes || '');
      setErrors({});
    } else {
      resetForm();
    }
  }, [editingItem]);

  // Handle unit conversions on inputs when unit toggle changes
  const handleUnitToggle = (newUnit: 'mm' | 'cm') => {
    if (newUnit === unit) return;
    
    setUnit(newUnit);
    
    // If length/width are already entered, convert them visually
    if (lengthInput) {
      const lenVal = parseFloat(lengthInput);
      if (!isNaN(lenVal)) {
        setLengthInput(newUnit === 'cm' ? (lenVal / 10).toFixed(1) : Math.round(lenVal * 10).toString());
      }
    }
    
    if (widthInput) {
      const widVal = parseFloat(widthInput);
      if (!isNaN(widVal)) {
        setWidthInput(newUnit === 'cm' ? (widVal / 10).toFixed(1) : Math.round(widVal * 10).toString());
      }
    }
  };

  // Fill standard MDF sheet sizes in Brazil (2750 x 1840 mm)
  const fillStandardSize = () => {
    if (unit === 'cm') {
      setLengthInput('275');
      setWidthInput('184');
    } else {
      setLengthInput('2750');
      setWidthInput('1840');
    }
  };

  const handleQuickPatternSelect = (patName: string) => {
    setPattern(patName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Pattern validation
    if (!pattern.trim()) {
      newErrors.pattern = 'Informe a cor ou padrão do MDF.';
    }

    // Thickness validation
    const finalThickness = isCustomThickness ? customThickness.trim() : thickness;
    if (!finalThickness) {
      newErrors.thickness = 'Informe a espessura.';
    }

    // Dimensions validation
    const lenVal = parseFloat(lengthInput);
    if (isNaN(lenVal) || lenVal <= 0) {
      newErrors.length = `Informe um comprimento válido maior que zero.`;
    }

    const widVal = parseFloat(widthInput);
    if (isNaN(widVal) || widVal <= 0) {
      newErrors.width = `Informe uma largura válida maior que zero.`;
    }

    // Quantity validation
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      newErrors.quantity = 'A quantidade deve ser um número inteiro positivo.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert input lengths to standard mm internally
    const finalLengthInMm = unit === 'cm' ? Math.round(parseFloat(lengthInput) * 10) : Math.round(parseFloat(lengthInput));
    const finalWidthInMm = unit === 'cm' ? Math.round(parseFloat(widthInput) * 10) : Math.round(parseFloat(widthInput));

    onSave({
      id: editingItem?.id,
      type,
      pattern: pattern.trim(),
      thickness: finalThickness,
      length: finalLengthInMm,
      width: finalWidthInMm,
      quantity,
      notes: notes.trim() || undefined,
    });

    if (!editingItem) {
      // Clear form after adding
      resetForm();
    }
  };

  // Shortlists of patterns for instant clicking
  const quickPatterns = ['Branco Supremo (Matt)', 'Louro Freijó', 'Preto TX', 'Grafite Mate'];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl" id="mdf-form-container">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
        <h2 className="text-lg font-display font-semibold text-zinc-100 flex items-center gap-2">
          {editingItem ? (
            <>
              <Save className="w-5 h-5 text-amber-500" />
              Editar Item
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5 text-amber-500" />
              Adicionar ao Estoque
            </>
          )}
        </h2>
        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded transition"
          >
            Cancelar Edição
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Select */}
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">
            Tipo de Peça
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('Sobra')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 border ${
                type === 'Sobra'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-semibold shadow-inner'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${type === 'Sobra' ? 'bg-orange-500 animate-pulse' : 'bg-zinc-600'}`}></span>
              Sobra / Retalho
            </button>
            <button
              type="button"
              onClick={() => {
                setType('Chapa');
                // Auto fill helper
              }}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 border ${
                type === 'Chapa'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold shadow-inner'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${type === 'Chapa' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></span>
              Chapa Inteira
            </button>
          </div>
        </div>

        {/* Pattern Name */}
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
            Cor / Padrão do MDF
          </label>
          <input
            type="text"
            list="mdf-patterns-list"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Ex: Branco Supremo, Louro Freijó, Ébano..."
            className={`w-full bg-zinc-950 border ${
              errors.pattern ? 'border-red-500 text-red-100' : 'border-zinc-800 text-zinc-100'
            } rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition font-sans`}
          />
          <datalist id="mdf-patterns-list">
            {POPULAR_PATTERNS.map((pat) => (
              <option key={pat} value={pat} />
            ))}
          </datalist>
          {errors.pattern && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.pattern}</p>}

          {/* Quick chips for fastest possible click input */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] text-zinc-500 self-center uppercase tracking-wider mr-1">Rápido:</span>
            {quickPatterns.map((pat) => (
              <button
                key={pat}
                type="button"
                onClick={() => handleQuickPatternSelect(pat)}
                className={`text-[11px] px-2 py-0.5 rounded border transition ${
                  pattern === pat
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-medium'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {pat.split(' ')[0]} {/* Short display */}
              </button>
            ))}
          </div>
        </div>

        {/* Thickness Select */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Espessura
            </label>
            <select
              value={isCustomThickness ? 'Outro' : thickness}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Outro') {
                  setIsCustomThickness(true);
                  setThickness('Outro');
                } else {
                  setIsCustomThickness(false);
                  setThickness(val);
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition"
            >
              {POPULAR_THICKNESSES.map((thick) => (
                <option key={thick} value={thick}>
                  {thick}
                </option>
              ))}
              <option value="Outro">Outra (Digitar)</option>
            </select>
          </div>

          <div>
            {isCustomThickness ? (
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Digitar Espessura
                </label>
                <input
                  type="text"
                  value={customThickness}
                  onChange={(e) => setCustomThickness(e.target.value)}
                  placeholder="Ex: 22mm, 36mm"
                  className={`w-full bg-zinc-950 border ${
                    errors.thickness ? 'border-red-500' : 'border-zinc-800'
                  } text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition`}
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">
                  Espessura Selecionada
                </label>
                <div className="w-full bg-zinc-950/40 border border-zinc-800/40 text-zinc-400 rounded-lg px-3 py-2 text-sm font-semibold select-none">
                  {thickness}
                </div>
              </div>
            )}
            {errors.thickness && <p className="text-xs text-red-400 mt-1">{errors.thickness}</p>}
          </div>
        </div>

        {/* Dimensions Container (With Unit Switcher) */}
        <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
              Dimensões da Peça
            </span>
            
            {/* Unit Toggle */}
            <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800">
              <button
                type="button"
                onClick={() => handleUnitToggle('mm')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                  unit === 'mm' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Milímetros (mm)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('cm')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                  unit === 'cm' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Centímetros (cm)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                Comprimento ({unit})
              </label>
              <input
                type="number"
                step="any"
                value={lengthInput}
                onChange={(e) => setLengthInput(e.target.value)}
                placeholder={unit === 'mm' ? 'Ex: 1200' : 'Ex: 120'}
                className={`w-full bg-zinc-900 border ${
                  errors.length ? 'border-red-500 text-red-100' : 'border-zinc-800 text-zinc-100'
                } rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-amber-500 transition`}
              />
              {errors.length && <p className="text-[11px] text-red-400 mt-0.5">{errors.length}</p>}
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                Largura ({unit})
              </label>
              <input
                type="number"
                step="any"
                value={widthInput}
                onChange={(e) => setWidthInput(e.target.value)}
                placeholder={unit === 'mm' ? 'Ex: 650' : 'Ex: 65'}
                className={`w-full bg-zinc-900 border ${
                  errors.width ? 'border-red-500 text-red-100' : 'border-zinc-800 text-zinc-100'
                } rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-amber-500 transition`}
              />
              {errors.width && <p className="text-[11px] text-red-400 mt-0.5">{errors.width}</p>}
            </div>
          </div>

          {/* Fill standard size helper */}
          {type === 'Chapa' && (
            <button
              type="button"
              onClick={fillStandardSize}
              className="mt-2.5 w-full bg-zinc-900 hover:bg-zinc-850 text-amber-500 hover:text-amber-400 text-xs border border-zinc-800 hover:border-zinc-700 py-1.5 rounded flex items-center justify-center gap-1.5 transition font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              Preencher Chapa Padrão (2750 x 1840 mm)
            </button>
          )}
        </div>

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Quantidade de Peças
            </label>
            <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 text-lg transition border-r border-zinc-800"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center bg-transparent border-0 text-zinc-100 font-mono text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 text-lg transition border-l border-zinc-800"
              >
                +
              </button>
            </div>
            {errors.quantity && <p className="text-xs text-red-400 mt-1">{errors.quantity}</p>}
          </div>

          {/* Visual Area preview inside the Form */}
          <div className="flex flex-col justify-end">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
              Cálculo de Área Individual:
            </span>
            <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-lg p-2 font-mono text-xs text-zinc-400 flex flex-col justify-center h-[38px]">
              {(() => {
                const len = parseFloat(lengthInput);
                const wid = parseFloat(widthInput);
                if (!isNaN(len) && !isNaN(wid) && len > 0 && wid > 0) {
                  const mult = unit === 'cm' ? 100 : 1000000;
                  const itemM2 = (len * wid) / mult;
                  return (
                    <div className="flex justify-between">
                      <span>Total M²:</span>
                      <strong className="text-amber-500">{(itemM2 * quantity).toFixed(3)} m²</strong>
                    </div>
                  );
                }
                return <span className="text-zinc-600">Aguardando dimensões</span>;
              })()}
            </div>
          </div>
        </div>

        {/* Notes/Observações */}
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
            Observações / Detalhes (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Fita de borda em 1 lado, arranhão leve..."
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition font-sans"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            className={`w-full py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
              editingItem
                ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            }`}
          >
            {editingItem ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                Salvar Alterações
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                Cadastrar no Estoque
              </>
            )}
          </button>
          
          {/* Quick Clear Form */}
          {!editingItem && (lengthInput || widthInput || pattern) && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-2 w-full text-zinc-500 hover:text-zinc-400 text-xs flex items-center justify-center gap-1 py-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpar campos
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
