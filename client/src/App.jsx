import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Kanban, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  BarChart3, 
  Users, 
  DollarSign, 
  Send,
  Upload
} from 'lucide-react';
import Dashboard from './components/Dashboard';

// URL da API no Render (substitui local por nuvem em produção)
const API_URL = 'https://nexuscob-api.onrender.com';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('kanban');
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [arquivo, setArquivo] = useState(null);

  const clienteAtivo = clientes[0] || {
    nome: 'Marcos Silva',
    valor_devido: 1250.00,
    dias_atraso: 14,
    data_vencimento: '22/09/2026',
    numero_contrato: 'CTR-9821',
    nome_operador: 'Juliana'
  };

  const templateScript = "Olá {NOME_CLIENTE}, tudo bem? Sou {NOME_OPERADOR} do setor de negociação. Identificamos que o contrato {NUMERO_CONTRATO} no valor de {VALOR_DEVIDO} venceu em {DATA_VENCIMENTO}. Conseguimos uma condição especial com desconto para quitação hoje via PIX. Podemos formalizar?";

  // Buscar clientes da API no Render
  const carregarClientes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/clientes`);
      if (res.data && res.data.length > 0) {
        setClientes(res.data);
      }
    } catch (err) {
      console.log('Modo demonstrativo ativo / Erro ao conectar na API:', err.message);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  // Fazer Upload da Planilha Excel (.xlsx)
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert('Selecione um arquivo Excel primeiro!');

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    setCarregando(true);
    try {
      const res = await axios.post(`${API_URL}/api/clientes/importar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.mensagem || 'Planilha importada com sucesso!');
      carregarClientes();
      setAbaAtiva('kanban');
    } catch (err) {
      alert('Erro ao importar planilha. Verifique o formato do arquivo.');
    } finally {
      setCarregando(false);
    }
  };

  const renderizarScript = (template, cliente) => {
    return template
      .replace(/{NOME_CLIENTE}/g, cliente.nome)
      .replace(/{VALOR_DEVIDO}/g, `R$ ${Number(cliente.valor_devido || 0).toFixed(2)}`)
      .replace(/{DIAS_ATRASO}/g, cliente.dias_atraso || '0')
      .replace(/{DATA_VENCIMENTO}/g, cliente.data_vencimento || '22/09/2026')
      .replace(/{NUMERO_CONTRATO}/g, cliente.numero_contrato || 'CTR-0000')
      .replace(/{NOME_OPERADOR}/g, 'Juliana');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f3f4f6', margin: 0 }}>
      {/* SIDEBAR NAVEGAÇÃO */}
      <aside style={{ width: '240px', backgroundColor: '#1e293b', color: '#fff', padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', fontWeight: 'bold', color: '#38bdf8' }}>
          <DollarSign size={28} />
          Nexus-Cob
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('kanban')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: abaAtiva === 'kanban' ? '#0284c7' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
            <Kanban size={18} /> Funil / Kanban
          </button>
          <button onClick={() => setAbaAtiva('agenda')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: abaAtiva === 'agenda' ? '#0284c7' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
            <Calendar size={18} /> Agenda Particular
          </button>
          <button onClick={() => setAbaAtiva('importar')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: abaAtiva === 'importar' ? '#0284c7' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
            <FileSpreadsheet size={18} /> Importar Excel
          </button>
          <button onClick={() => setAbaAtiva('scripts')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: abaAtiva === 'scripts' ? '#0284c7' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
            <FileText size={18} /> Scripts (Admin)
          </button>
          <button onClick={() => setAbaAtiva('metricas')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: abaAtiva === 'metricas' ? '#0284c7' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
            <BarChart3 size={18} /> Métricas & Analytics
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Gestão de Cobranças e Recuperação de Crédito</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
            <Users size={20} /> Operador: <strong>Juliana</strong>
          </div>
        </header>

        {/* CONTEÚDO DINÂMICO BASEADO NA ABA */}
        {abaAtiva === 'kanban' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              <div style={{ minWidth: '240px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#334155' }}>Vencido (1-15 dias)</h3>
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{clienteAtivo.nome}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Contrato: {clienteAtivo.numero_contrato}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#059669', marginTop: '8px' }}>R$ {Number(clienteAtivo.valor_devido || 0).toFixed(2)}</div>
                  <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    #PromessaDePagamento
                  </span>
                </div>
              </div>
              <div style={{ minWidth: '240px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#334155' }}>Contato Realizado</h3>
              </div>
              <div style={{ minWidth: '240px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#334155' }}>Acordo em Negociação</h3>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#0284c7" />
                Script de Abordagem
              </h3>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
                {renderizarScript(templateScript, clienteAtivo)}
              </div>

              <button 
                onClick={() => navigator.clipboard.writeText(renderizarScript(templateScript, clienteAtivo))} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Send size={16} /> Copiar para WhatsApp
              </button>
            </div>
          </div>
        )}

        {abaAtiva === 'metricas' && <Dashboard />}

        {abaAtiva === 'importar' && (
          <form onSubmit={handleUploadExcel} style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <FileSpreadsheet size={48} color="#0284c7" />
            <h2>Upload de Carteira de Clientes (Excel / .xlsx)</h2>
            <p style={{ color: '#64748b' }}>Selecione seu arquivo `.xlsx` com colunas (Nome, CPF, Telefone, Valor, Contrato) para importar diretamente ao banco de dados e ao Kanban.</p>
            
            <input 
              type="file" 
              accept=".xlsx, .csv" 
              onChange={(e) => setArquivo(e.target.files[0])}
              style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
            />

            <button 
              type="submit" 
              disabled={carregando}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
              <Upload size={18} /> {carregando ? 'Importando...' : 'Processar e Salvar no Kanban'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
