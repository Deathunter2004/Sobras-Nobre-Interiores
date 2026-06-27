import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Hammer, Download, Upload, Info, Check, Trash2, HelpCircle } from 'lucide-react';
import { MdfItem } from './types';
import { StatsPanel } from './components/StatsPanel';
import { MdfForm } from './components/MdfForm';
import { MdfList } from './components/MdfList';
import { supabase } from './lib/supabase';

// Seed items for a fresh look when localStorage is blank
const SEED_ITEMS: MdfItem[] = [
  {
    id: 'seed-1',
    type: 'Chapa',
    pattern: 'Branco Supremo (Matt)',
    thickness: '15mm',
    length: 2750,
    width: 1840,
    quantity: 2,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-2',
    type: 'Sobra',
    pattern: 'Louro Freijó',
    thickness: '18mm',
    length: 1500,
    width: 600,
    quantity: 1,
    notes: 'Verao de fita de borda aplicada em uma das laterais compridas',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-3',
    type: 'Sobra',
    pattern: 'Grafite Mate',
    thickness: '15mm',
    length: 800,
    width: 450,
    quantity: 3,
    notes: 'Sobras de tamponamento de cozinha',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-4',
    type: 'Sobra',
    pattern: 'Preto TX',
    thickness: '6mm',
    length: 1200,
    width: 500,
    quantity: 2,
    notes: 'Excelente para fundo de armários e gavetas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function App() {
  const [items, setItems] = useState<MdfItem[]>([]);
  const [editingItem, setEditingItem] = useState<MdfItem | null>(null);
  
  // Notification Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'danger',
    onConfirm: () => {},
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map Supabase rows to local MdfItem interface
  const mapToFrontend = (row: any): MdfItem => ({
    id: String(row.id),
    type: row.tipo as 'Chapa' | 'Sobra',
    pattern: row.cor,
    thickness: row.espessura,
    length: Number(row.comprimento),
    width: Number(row.largura),
    quantity: Number(row.quantidade),
    notes: row.observacoes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.created_at || new Date().toISOString(),
  });

  // Load items from Supabase
  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque_mdf')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setItems(data.map(mapToFrontend));
      }
    } catch (e: any) {
      console.error('Falha ao carregar dados do Supabase:', e);
      showToast('Erro ao carregar dados: ' + (e.message || e), 'error');
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Show auto-dismissing toast
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Add or edit item handler in Supabase
  const handleSaveItem = async (itemData: Omit<MdfItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    try {
      if (itemData.id) {
        // Edit existing
        const { error } = await supabase
          .from('estoque_mdf')
          .update({
            tipo: itemData.type,
            cor: itemData.pattern,
            espessura: itemData.thickness,
            comprimento: itemData.length,
            largura: itemData.width,
            quantidade: itemData.quantity,
            observacoes: itemData.notes || null,
          })
          .eq('id', parseInt(itemData.id, 10));

        if (error) throw error;

        setEditingItem(null);
        showToast(`MDF "${itemData.pattern}" atualizado com sucesso!`, 'success');
      } else {
        // Add new
        const { error } = await supabase
          .from('estoque_mdf')
          .insert({
            tipo: itemData.type,
            cor: itemData.pattern,
            espessura: itemData.thickness,
            comprimento: itemData.length,
            largura: itemData.width,
            quantidade: itemData.quantity,
            observacoes: itemData.notes || null,
          });

        if (error) throw error;

        showToast(`MDF "${itemData.pattern}" adicionado ao estoque!`, 'success');
      }
      await loadItems();
    } catch (e: any) {
      console.error('Erro ao salvar no Supabase:', e);
      showToast('Erro ao salvar no Supabase: ' + (e.message || e), 'error');
    }
  };

  // Actual deletion action (helper to bypass confirm prompt)
  const executeDelete = async (id: string) => {
    const item = items.find((itm) => itm.id === id);
    try {
      const { error } = await supabase
        .from('estoque_mdf')
        .delete()
        .eq('id', parseInt(id, 10));

      if (error) throw error;

      if (editingItem?.id === id) {
        setEditingItem(null);
      }
      
      if (item) {
        showToast(`Item "${item.pattern}" removido do estoque.`, 'info');
      }
      await loadItems();
    } catch (e: any) {
      console.error('Erro ao excluir do Supabase:', e);
      showToast('Erro ao excluir do Supabase: ' + (e.message || e), 'error');
    }
  };

  // Quick edit/deduct button handler from row
  const handleUpdateQuantity = async (id: string, newQty: number) => {
    const item = items.find((itm) => itm.id === id);
    if (!item) return;

    if (newQty <= 0) {
      // Trigger custom confirm modal if hits zero
      setConfirmDialog({
        isOpen: true,
        title: 'Remover Lote do Estoque',
        message: `A quantidade de "${item.pattern}" chegou a zero. Deseja remover este item permanentemente do estoque de MDF?`,
        confirmText: 'Remover',
        cancelText: 'Cancelar',
        type: 'danger',
        onConfirm: () => {
          executeDelete(id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      try {
        const { error } = await supabase
          .from('estoque_mdf')
          .update({ quantidade: newQty })
          .eq('id', parseInt(id, 10));

        if (error) throw error;

        showToast(`Quantidade de "${item.pattern}" atualizada para ${newQty}.`, 'info');
        await loadItems();
      } catch (e: any) {
        console.error('Erro ao atualizar quantidade no Supabase:', e);
        showToast('Erro ao atualizar quantidade: ' + (e.message || e), 'error');
      }
    }
  };

  // Delete handler triggered by garbage bin button
  const handleDeleteItem = (id: string) => {
    const item = items.find((itm) => itm.id === id);
    if (!item) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Item do Estoque',
      message: `Tem certeza que deseja excluir permanentemente o lote de MDF "${item.pattern}" (${item.thickness} - ${item.length}x${item.width} mm) do seu estoque? Esta ação é irreversível.`,
      confirmText: 'Excluir Item',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: () => {
        executeDelete(id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Export database to a .json file for safe backup
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `estoque-mdf-marcenaria-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup exportado com sucesso!', 'success');
    } catch (err) {
      showToast('Falha ao exportar backup', 'error');
    }
  };

  // Import database from a .json file
  const handleImportBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Basic validation of import schema
        if (Array.isArray(parsed) && (parsed.length === 0 || (parsed[0].pattern !== undefined && parsed[0].thickness !== undefined))) {
          showToast('Importando itens...', 'info');
          
          const dbRows = parsed.map((item) => ({
            tipo: item.type,
            cor: item.pattern,
            espessura: item.thickness,
            comprimento: item.length,
            largura: item.width,
            quantidade: item.quantity,
            observacoes: item.notes || null,
          }));

          const { error } = await supabase.from('estoque_mdf').insert(dbRows);
          if (error) throw error;

          await loadItems();
          showToast(`Backup restaurado! ${parsed.length} itens carregados no Supabase.`, 'success');
        } else {
          showToast('Arquivo de backup inválido!', 'error');
        }
      } catch (err: any) {
        showToast('Erro ao importar backup: ' + (err.message || err), 'error');
      }
    };
    reader.readAsText(file);
    
    // Clear value to allow re-upload of same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAllStorage = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Zerar Estoque de MDF',
      message: 'ATENÇÃO: Isso irá apagar permanentemente TODOS os itens cadastrados no seu estoque de MDF. Esta operação é irreversível e apagará todas as suas sobras e chapas!',
      confirmText: 'Sim, Apagar Tudo',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('estoque_mdf')
            .delete()
            .gt('id', 0);

          if (error) throw error;

          showToast('O estoque foi completamente limpo.', 'error');
          await loadItems();
        } catch (e: any) {
          console.error('Erro ao limpar estoque no Supabase:', e);
          showToast('Erro ao limpar estoque: ' + (e.message || e), 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 pb-12" id="app-root">
      {/* Toast notification overlay */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 py-3 px-5 rounded-lg shadow-2xl border transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success' 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
              : toast.type === 'info'
              ? 'bg-zinc-900 text-amber-400 border-zinc-800'
              : 'bg-red-950 text-red-300 border-red-900'
          }`}
          id="toast-notification"
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main Header navigation */}
      <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-850 sticky top-0 z-40 px-4 py-3 shadow-md" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-zinc-950 p-2 rounded-lg shadow-inner">
              <Hammer className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-zinc-100 flex items-center gap-1.5 tracking-tight">
                Estoque MDF
                <span className="text-[10px] font-normal uppercase tracking-wider bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">
                  Oficina Rápida
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Controle prático de chapas inteiras e retalhos de madeira</p>
            </div>
          </div>

          {/* Backup Action Bar */}
          <div className="flex items-center gap-2">
            {/* Import Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white px-3 py-2 rounded-lg border border-zinc-700/60 transition flex items-center gap-1.5 cursor-pointer"
              title="Restaurar de arquivo .json"
            >
              <Upload className="w-3.5 h-3.5" />
              Restaurar Backup
            </button>

            <button
              onClick={handleExportBackup}
              className="text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white px-3 py-2 rounded-lg border border-zinc-700/60 transition flex items-center gap-1.5 cursor-pointer"
              title="Salvar arquivo de backup .json"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Backup
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {/* Statistics Widgets */}
        <StatsPanel items={items} />

        {/* Form and List Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          
          {/* Left Column: Register Form */}
          <div className="lg:col-span-4 space-y-4">
            <MdfForm 
              onSave={handleSaveItem} 
              editingItem={editingItem} 
              onCancelEdit={(() => setEditingItem(null))} 
            />

            {/* Carpenter Guidelines Card */}
            <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-4 text-xs text-zinc-400" id="tips-container">
              <h3 className="text-zinc-200 font-semibold mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-500" />
                Dica de Oficina
              </h3>
              <p className="leading-relaxed">
                Antes de iniciar qualquer corte, verifique o estoque de <strong>Sobras Úteis</strong> no painel de buscas rápidas. Filtre pelas dimensões exatas que seu projeto precisa para aproveitar sobras antes de fatiar uma chapa MDF inteira de {items[0]?.length || 2750}x{items[0]?.width || 1840} mm.
              </p>
              
              <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Dados salvos localmente</span>
                <button 
                  onClick={handleClearAllStorage}
                  className="text-red-500 hover:text-red-400 font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Tudo
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Inventory List & Search */}
          <div className="lg:col-span-8">
            <MdfList 
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onDeleteItem={handleDeleteItem}
              onEditItem={((item) => {
                setEditingItem(item);
                // Scroll to form smoothly on mobile
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showToast(`Item "${item.pattern}" carregado para edição.`, 'info');
              })}
            />
          </div>
        </div>
      </main>

      {/* Custom Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" id="confirm-modal-overlay">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl p-6" id="confirm-modal-card">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full flex-shrink-0 ${confirmDialog.type === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {confirmDialog.type === 'danger' ? <Trash2 className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-display font-bold text-zinc-100 mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-850">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-sm font-semibold transition cursor-pointer"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition cursor-pointer ${
                  confirmDialog.type === 'danger' 
                    ? 'bg-red-500 hover:bg-red-400' 
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
