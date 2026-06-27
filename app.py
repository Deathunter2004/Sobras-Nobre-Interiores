import streamlit as pd_st
import streamlit as st
import pandas as pd
from supabase import create_client, Client

# Configuração da página - Otimizada para Celular
st.set_page_config(
    page_title="Estoque MDF - Marcenaria",
    page_icon="🪵",
    layout="centered", # Centralizado fica perfeito em telas verticais de celular
    initial_sidebar_state="collapsed"
)

# Estilo CSS personalizado para melhorar a usabilidade no celular (botões grandes, design limpo)
st.markdown("""
    <style>
    /* Remover margens excessivas no topo */
    .block-container {
        padding-top: 1rem;
        padding-bottom: 2rem;
        max-width: 600px;
    }
    /* Estilo para botões de quantidade rápidos */
    div.stButton > button:first-child {
        width: 100%;
        border-radius: 8px;
    }
    /* Deixar os inputs com bordas mais visíveis e amigáveis para touch */
    input, select, textarea {
        font-size: 16px !important; /* Evita zoom automático no iOS */
    }
    </style>
""", unsafe_allow_html=True)

# Inicialização da conexão com o Supabase
@st.cache_resource
def init_supabase() -> Client:
    # Busca chaves das variáveis de ambiente ou do arquivo de segredos do Streamlit
    supabase_url = st.secrets.get("SUPABASE_URL") or st.secrets.get("connections", {}).get("supabase", {}).get("url")
    supabase_key = st.secrets.get("SUPABASE_KEY") or st.secrets.get("connections", {}).get("supabase", {}).get("key")
    
    if not supabase_url or not supabase_key:
        st.error("🔑 Credenciais do Supabase não encontradas! Configure st.secrets ou o arquivo secrets.toml.")
        st.info("Para rodar localmente, crie a pasta `.streamlit/secrets.toml` com as chaves SUPABASE_URL e SUPABASE_KEY.")
        st.stop()
        
    return create_client(supabase_url, supabase_key)

try:
    supabase = init_supabase()
except Exception as e:
    st.error(f"Erro ao conectar ao Supabase: {e}")
    st.stop()

# --- FUNÇÕES DE OPERAÇÃO NO BANCO DE DADOS ---

def buscar_dados():
    """Busca todas as peças cadastradas ordenando pelas mais recentes"""
    try:
        response = supabase.table("estoque_mdf").select("*").order("created_at", desc=True).execute()
        return pd.DataFrame(response.data) if response.data else pd.DataFrame()
    except Exception as e:
        st.error(f"Erro ao carregar dados: {e}")
        return pd.DataFrame()

def adicionar_item(tipo, cor, espessura, comprimento, largura, quantidade, observacoes):
    """Insere um novo item no banco de dados"""
    try:
        data = {
            "tipo": tipo,
            "cor": cor.strip(),
            "espessura": espessura,
            "comprimento": int(comprimento),
            "largura": int(largura),
            "quantidade": int(quantidade),
            "observacoes": observacoes.strip() if observacoes else None
        }
        supabase.table("estoque_mdf").insert(data).execute()
        return True
    except Exception as e:
        st.error(f"Erro ao salvar: {e}")
        return False

def dar_baixa_item(item_id, qtd_baixa, qtd_atual):
    """Subtrai da quantidade em estoque ou deleta se chegar a zero"""
    try:
        nova_qtd = qtd_atual - qtd_baixa
        if nova_qtd <= 0:
            supabase.table("estoque_mdf").delete().eq("id", item_id).execute()
            st.success("Item removido do estoque por atingir quantidade zero!")
        else:
            supabase.table("estoque_mdf").update({"quantidade": nova_qtd}).eq("id", item_id).execute()
            st.success(f"Baixa realizada! Restam {nova_qtd} unidades.")
        return True
    except Exception as e:
        st.error(f"Erro ao dar baixa: {e}")
        return False

# --- CABEÇALHO ---
st.title("🪵 Estoque MDF")
st.caption("Controle rápido de chapas e sobras para uso diário na oficina 📱")

# Carregar dados atuais
df = buscar_dados()

# --- PAINEL DE MÉTRICAS RÁPIDAS ---
if not df.empty:
    # Cálculo m² total: (Comprimento em mm * Largura em mm / 1.000.000) * Quantidade
    df['area_m2'] = (df['comprimento'] * df['largura'] / 1000000.0) * df['quantidade']
    total_area = df['area_m2'].sum()
    total_pecas = df['quantidade'].sum()
    
    col_m1, col_m2 = st.columns(2)
    col_m1.metric("Estoque Total (m²)", f"{total_area:.2f} m²")
    col_m2.metric("Total de Peças", f"{total_pecas} un")
else:
    st.info("Nenhum item cadastrado no estoque de MDF.")

# --- FORMULÁRIO 1: ADICIONAR ITEM (EXPANDER PARA ECONOMIA DE TELA) ---
with st.expander("➕ Adicionar Nova Sobra ou Chapa", expanded=False):
    with st.form("add_form", clear_on_submit=True):
        tipo = st.radio("Tipo:", ["Sobra", "Chapa"], horizontal=True, help="Selecione se é um retalho (Sobra) ou uma placa inteira (Chapa)")
        cor = st.text_input("Cor / Padrão:", placeholder="Ex: Branco Supremo, Louro Freijó, Grafite")
        
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            espessura = st.selectbox("Espessura:", ["6mm", "15mm", "18mm", "25mm", "3mm", "9mm", "12mm", "Outra"])
            if espessura == "Outra":
                espessura = st.text_input("Digite a espessura:", placeholder="Ex: 30mm")
        with col_f2:
            quantidade = st.number_input("Quantidade:", min_value=1, value=1, step=1)
            
        st.markdown("**Dimensões da Peça:**")
        col_d1, col_d2, col_d3 = st.columns([2, 2, 1.5])
        with col_d1:
            comprimento = st.number_input("Comprimento:", min_value=1, value=1500, step=50, help="Medida em milímetros")
        with col_d2:
            largura = st.number_input("Largura:", min_value=1, value=600, step=50, help="Medida em milímetros")
        with col_d3:
            unidade_aux = st.selectbox("Unidade:", ["mm", "cm"], index=0, key="unit_select")
            
        # Conversão auxiliar para o usuário se digitou em cm
        if unidade_aux == "cm":
            comprimento_mm = comprimento * 10
            largura_mm = largura * 10
            st.caption(f"Convertido: {comprimento_mm} x {largura_mm} mm")
        else:
            comprimento_mm = comprimento
            largura_mm = largura
            
        observacoes = st.text_input("Observações (Opcional):", placeholder="Ex: Fita de borda de 1 lado, lascado na ponta...")
        
        sub_btn = st.form_submit_button("Salvar no Estoque", use_container_width=True)
        if sub_btn:
            if not cor:
                st.error("Por favor, preencha a Cor/Padrão do MDF.")
            else:
                sucesso = adicionar_item(tipo, cor, espessura, comprimento_mm, largura_mm, quantidade, observacoes)
                if sucesso:
                    st.success("Item adicionado com sucesso!")
                    st.rerun()

# --- FORMULÁRIO 2: DAR BAIXA RÁPIDA (EXPANDER FÁCIL TOUCH) ---
if not df.empty:
    with st.expander("➖ Dar Baixa / Remover Item", expanded=False):
        # Cria uma lista amigável de nomes para seleção
        df_select = df.copy()
        df_select['display_name'] = df_select.apply(
            lambda r: f"{r['cor']} ({r['espessura']}) | {r['comprimento']}x{r['largura']}mm - Qtd: {r['quantidade']}", axis=1
        )
        
        selected_item_name = st.selectbox("Selecione o MDF para dar baixa:", df_select['display_name'].tolist())
        
        # Resgata os dados da peça selecionada
        selected_row = df_select[df_select['display_name'] == selected_item_name].iloc[0]
        item_id = selected_row['id']
        qtd_atual = selected_row['quantidade']
        
        col_b1, col_b2 = st.columns(2)
        with col_b1:
            qtd_baixa = st.number_input("Quantidade para dar baixa:", min_value=1, max_value=int(qtd_atual), value=1, step=1)
        with col_b2:
            # Botão de ação
            st.write("") # Spacer para alinhar botão
            st.write("")
            baixa_btn = st.button("Confirmar Baixa", use_container_width=True, type="primary")
            
        if baixa_btn:
            if dar_baixa_item(item_id, qtd_baixa, qtd_atual):
                st.rerun()

# --- CONSULTA E FILTROS DO ESTOQUE (SEÇÃO PRINCIPAL) ---
st.subheader("🔍 Consultar Estoque")

if not df.empty:
    # Controles de filtros no topo
    col_filtro1, col_filtro2 = st.columns([2, 1])
    with col_filtro1:
        busca_cor = st.text_input("Buscar por Cor/Padrão:", placeholder="Digite o nome do padrão...")
    with col_filtro2:
        filtro_tipo = st.selectbox("Filtrar Tipo:", ["Todos", "Chapa", "Sobra"])

    # Filtragem dos dados
    df_filtrado = df.copy()
    if busca_cor:
        df_filtrado = df_filtrado[df_filtrado['cor'].str.lower().str.contains(busca_cor.lower())]
    if filtro_tipo != "Todos":
        df_filtrado = df_filtrado[df_filtrado['tipo'] == filtro_tipo]

    # Exibição otimizada em lista de cards (muito melhor que tabela crua no celular)
    st.write(f"Mostrando **{len(df_filtrado)}** itens correspondentes:")
    
    for idx, row in df_filtrado.iterrows():
        # Layout do Card
        tipo_badge = "🟢 Chapa" if row['tipo'] == 'Chapa' else "🟠 Sobra"
        m2_unitario = (row['comprimento'] * row['largura']) / 1000000.0
        m2_total = m2_unitario * row['quantidade']
        
        obs_text = f"\n*Obs: {row['observacoes']}*" if row['observacoes'] else ""
        
        # Card Visual estilizado usando o container nativo do streamlit
        with st.container(border=True):
            col_c1, col_c2 = st.columns([3, 1])
            with col_c1:
                st.markdown(f"**{row['cor']}** ({row['espessura']})")
                st.markdown(f"`{row['comprimento']} x {row['largura']} mm` | `{row['comprimento']/10:.1f} x {row['largura']/10:.1f} cm`")
                st.markdown(f"{tipo_badge} | Total: **{m2_total:.3f} m²** {obs_text}")
            with col_c2:
                st.markdown("<p style='text-align: center; margin-bottom: 0px; font-size:11px; color:gray;'>Qtd</p>", unsafe_allow_html=True)
                st.markdown(f"<h3 style='text-align: center; margin-top: 0px;'>{row['quantidade']}</h3>", unsafe_allow_html=True)
                
                # Atalho de baixa rápida (-1 peça) direto no card
                if st.button("📉 -1", key=f"minus_{row['id']}", use_container_width=True):
                    if dar_baixa_item(row['id'], 1, row['quantity'] if 'quantity' in row else row['quantidade']):
                        st.rerun()

else:
    st.info("Insira itens usando o formulário para visualizar seu estoque.")
