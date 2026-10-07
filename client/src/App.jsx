import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, Users, DollarSign, RefreshCw, Phone, Handshake, Calendar, 
  FileCheck, CreditCard, MessageSquare, CheckSquare, BarChart3, 
  Briefcase, Upload, Settings, ShieldCheck, Zap, Send, Plus, CheckCircle2, Clock, Trash2
} from 'lucide-react';
import Dashboard from './components/Dashboard';

const API_URL = 'https://nexuscob-api.onrender.com';

const ESTAGIOS = [
  { id: 1, nome: 'NOVOS', cor: '#64748b' },
  { id: 2, nome: 'PRIMEIRO CONTATO', cor: '#3b82f6' },
  { id: 3, nome: 'CONTATO REALIZADO', cor: '#0284c7' },
  { id: 4, nome: 'EM NEGOCIAÇÃO', cor: '#8b5cf6' },
  { id: 5, nome: 'PROMESSA DE PAGAMENTO', cor: '#f59e0b' },
  { id: 6, nome: 'AGUARDANDO PAGAMENTO', cor: '#ec4899' },
  { id: 7, nome: 'PAGAMENTO CONFIRMADO', cor: '#10b981' }
];

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [clientes, setClientes] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Estados dos Formulários
  const [novoAgendamento, setNovoAgendamento] = useState({ titulo: '', data_agendamento: '', descricao: '' });
  const [novoScript, setNovoScript] = useState({ titulo: '', categoria: 'Primeiro Contato', conteudo: '' });
  const [novoContato, setNovoContato] = useState({ canal: 'WhatsApp', resultado: 'Contato Realizado', observacao: '' });

  // Cliente Ativo selecionado no Pipeline
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // Carregar dados da API
  const carregarDados = async () => {
    try {
      const resClientes = await axios.get(`${API_URL}/api/clientes`);
      if (resClientes.data && resClientes.data.length > 0) {
        setClientes(resClientes.data);
        if (!clienteSelecionado) setClienteSelecionado(resClientes.data[0]);
      } else {
        // Dados de fallback demonstrativos se o banco estiver vazio
        const fallback = [
          { id: 1, codigo: 'CLI-1092', nome: 'Carlos Eduardo Santos', documento: '048.291.829-10', telefone: '(41) 99821-4410', plano: 'Fibra 500MB', total_vencido: 239.80, dias_atraso: 34, estagio_id: 1, status_conexao: 'Suspenso' },
          { id: 2, codigo: 'CLI-1093', nome: 'Mariana Oliveira', documento: '021.491.109-88', telefone: '(41) 98812-0099', plano: 'Fibra 300MB', total_vencido: 119.90, dias_atraso: 12, estagio_id: 2, status_conexao: 'Ativo' },
          { id: 3, codigo: 'CLI-1094', nome: 'Roberto Alves', documento: '099.112.551-30', telefone: '(41) 99100-2211', plano: 'Fibra 1 Giga', total_vencido: 350.00, dias_atraso: 45, estagio_id: 5, status_conexao: 'Bloqueio Total' }
        ];
        setClientes(fallback);
        if (!clienteSelecionado) setClienteSelecionado(fallback[0]);
      }

      const resAgenda = await axios.get(`${API_URL}/api/agenda`);
      setAgenda(resAgenda.data || []);

      const resScripts = await axios.get(`${API_URL}/api/scripts`);
      setScripts(resScripts.data || []);
    } catch (err) {
      console.log('API conectando...', err.message);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Mover cliente de coluna no Kanban
  const moverEstagio = async (clienteId, novoEstagioId) => {
    try {
      await axios.put(`${API_URL}/api/clientes/${clienteId}/estagio`, { estagio_id: novoEstagioId });
      setClientes(clientes.map(c => c.id === clienteId ? { ...c, estagio_id: novoEstagioId } : c));
    } catch (err) {
      alert('Erro ao mover estagio.');
    }
  };

  // Fazer Upload da Planilha Excel
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert('Selecione uma planilha Excel (.xlsx)!');

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    setCarregando(true);
    try {
      const res = await axios.post(`${API_URL}/api/clientes/importar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.mensagem || 'Importação realizada com sucesso!');
      carregarDados();
      setAbaAtiva('pipeline');
    } catch (err) {
      alert('Erro ao importar planilha Excel.');
    } finally {
      setCarregando(false);
    }
  };

  // Salvar Agendamento na Agenda
  const handleCriarAgendamento = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/agenda`, {
        cliente_id: clienteSelecionado?.id,
        ...novoAgendamento
      });
      alert('Agendamento salvo com sucesso!');
      setNovoAgendamento({ titulo: '', data_agendamento: '', descricao: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar agendamento.');
    }
  };

  // Salvar Script
  const handleCriarScript = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/scripts`, novoScript);
      alert('Script cadastrado!');
      setNovoScript({ titulo: '', categoria: 'Primeiro Contato', conteudo: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao cadastrar script.');
    }
  };

  // Registra Histórico de Atendimento
  const handleSalvarContato = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/contatos`, {
        cliente_id: clienteSelecionado?.id,
        ...novoContato
      });
      alert('Atendimento salvo na ficha do cliente!');
      setNovoContato({ canal: 'WhatsApp', resultado: 'Contato Realizado', observacao: '' });
    } catch (err) {
      alert('Erro ao salvar histórico de atendimento.');
    }
  };

  const renderScriptText = (template) => {
    const cli = clienteSelecionado || {};
    return template
      .replace(/{{nome_cliente}}/g, cli.nome || 'Cliente')
      .replace(/{{cobrador}}/g, 'Juliana')
      .replace(/{{empresa}}/g, 'Nexus Fiber')
      .replace(/{{valor_divida}}/g, `R$ ${Number(cli.total_vencido || 0).toFixed(2)}`)
      .replace(/{{dias_atraso}}/g, cli.dias_atraso || 0);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f1f5f9', margin: 0 }}>
      {/* SIDEBAR NAVEGAÇÃO CORPORATIVA */}
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ padding: '0 10px 15px 10px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8' }}>
            <Zap size={26} color="#38bdf8" />
            <span>NEXUS COB</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', fontWeight: '500' }}>
            Gestão Inteligente de Cobranças
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'pipeline', label: 'Pipeline / Funil', icon: RefreshCw },
            { id: 'clientes', label: 'Clientes / Ficha', icon: Users },
            { id: 'tarefas', label: 'Agenda Particular', icon: Calendar },
            { id: 'scripts', label: 'Scripts de Cobrança', icon: MessageSquare },
            { id: 'importar', label: 'Importar Excel', icon: Upload },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
            { id: 'auditoria', label: 'Auditoria & Logs', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const ativo = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAbaAtiva(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: ativo ? '#0284c7' : 'transparent',
                  color: ativo ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                  fontWeight: ativo ? 'bold' : 'normal',
                  transition: '0.2s'
                }}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, padding: '20px 25px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '14px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>NEXUS COB — Provedor de Internet</h1>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Plataforma Integrada de Recuperação de Inadimplência</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.8rem', fontWeight: 'bold' }}>
              ● API Conectada
            </span>
            <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 'bold' }}>
              Operador: <span style={{ color: '#0284c7' }}>Juliana</span>
            </div>
          </div>
        </header>

        {/* 1. DASHBOARD */}
        {abaAtiva === 'dashboard' && <Dashboard />}

        {/* 2. PIPELINE / KANBAN INTERATIVO */}
        {abaAtiva === 'pipeline' && (
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
            {ESTAGIOS.map(estagio => {
              const clientesNoEstagio = clientes.filter(c => Number(c.estagio_id) === estagio.id);
              return (
                <div key={estagio.id} style={{ minWidth: '260px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
                    <span>{estagio.nome}</span>
                    <span style={{ backgroundColor: estagio.cor, color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      {clientesNoEstagio.length}
                    </span>
                  </div>

                  {clientesNoEstagio.map(cli => (
                    <div 
                      key={cli.id} 
                      onClick={() => setClienteSelecionado(cli)}
                      style={{ 
                        backgroundColor: '#fff', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
                        borderLeft: `4px solid ${estagio.cor}`,
                        cursor: 'pointer',
                        border: clienteSelecionado?.id === cli.id ? '2px solid #0284c7' : 'none'
                      }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>{cli.nome}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Contrato: {cli.codigo || 'CLI-001'}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#dc2626', marginTop: '6px' }}>
                        R$ {Number(cli.total_vencido || 0).toFixed(2)}
                      </div>
                      
                      {/* Botões para avançar estágio */}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                        {estagio.id > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); moverEstagio(cli.id, estagio.id - 1); }}
                            style={{ padding: '3px 6px', fontSize: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                            ←
                          </button>
                        )}
                        {estagio.id < 7 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); moverEstagio(cli.id, estagio.id + 1); }}
                            style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Avançar →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* 3. AGENDA PARTICULAR E TAREFAS */}
        {abaAtiva === 'tarefas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
            {/* FORMULÁRIO DE NOVO LEMBRETE */}
            <form onSubmit={handleCriarAgendamento} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>📅 Novo Agendamento</h3>
              <input 
                type="text" 
                placeholder="Título (ex: Retorno de ligação)" 
                value={novoAgendamento.titulo} 
                onChange={e => setNovoAgendamento({ ...novoAgendamento, titulo: e.target.value })}
                required 
                style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <input 
                type="datetime-local" 
                value={novoAgendamento.data_agendamento} 
                onChange={e => setNovoAgendamento({ ...novoAgendamento, data_agendamento: e.target.value })}
                required 
                style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <textarea 
                placeholder="Observações do retorno..." 
                value={novoAgendamento.descricao} 
                onChange={e => setNovoAgendamento({ ...novoAgendamento, descricao: e.target.value })}
                rows="3" 
                style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <button type="submit" style={{ padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Salvar na Agenda
              </button>
            </form>

            {/* LISTA DE COMPROMISSOS */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#0f172a' }}>Meus Compromissos Agendados</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agenda.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nenhum compromisso pendente na agenda.</p>
                ) : (
                  agenda.map(item => (
                    <div key={item.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.titulo}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{item.descricao}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '4px', fontWeight: 'bold' }}>
                          ⏰ {new Date(item.data_agendamento).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Pendente
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. SCRIPTS DE COBRANÇA */}
        {abaAtiva === 'scripts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
            <form onSubmit={handleCriarScript} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>✍️ Cadastrar Script (Admin)</h3>
              <input 
                type="text" 
                placeholder="Título do Script" 
                value={novoScript.titulo} 
                onChange={e => setNovoScript({ ...novoScript, titulo: e.target.value })}
                required 
                style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <select 
                value={novoScript.categoria} 
                onChange={e => setNovoScript({ ...novoScript, categoria: e.target.value })}
                style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <option value="Primeiro Contato">Primeiro Contato</option>
                <option value="Promessa Vencida">Promessa Vencida</option>
                <option value="Pedido de Desconto">Pedido de Desconto</option>
                <option value="Aviso de Suspensão">Aviso de Suspensão</option>
              </select>
              <textarea 
                placeholder="Conteúdo com variáveis {{nome_cliente}}, {{valor_divida}}, {{dias_atraso}}..." 
                value={novoScript.conteudo} 
                onChange={e => setNovoScript({ ...novoScript, conteudo: e.target.value })}
                rows="5" 
                required
                style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <button type="submit" style={{ padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Salvar Script
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Scripts Cadastrados</h3>
              {scripts.length === 0 ? (
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', fontSize: '0.88rem' }}>
                  <strong>Exemplo Padrão:</strong>
                  <p style={{ margin: '5px 0 0 0', color: '#475569' }}>
                    "Olá {{nome_cliente}}, identificamos uma pendência no valor de {{valor_divida}} referente ao seu plano de internet. Podemos gerar o PIX para quitação hoje?"
                  </p>
                </div>
              ) : (
                scripts.map(s => (
                  <div key={s.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0284c7' }}>{s.titulo} ({s.categoria})</div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#334155' }}>{s.conteudo}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. IMPORTAR EXCEL */}
        {abaAtiva === 'importar' && (
          <form onSubmit={handleUploadExcel} style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <Upload size={48} color="#0284c7" />
            <h2>Nexus Cob → Importar Planilha de Devedores</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Selecione o arquivo `.xlsx` do SGP/ERP para popular o banco de dados e alimentar o Pipeline.</p>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={e => setArquivo(e.target.files[0])}
              style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
            />
            <button 
              type="submit" 
              disabled={carregando}
              style={{ padding: '12px 24px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
              {carregando ? 'Importando...' : 'Processar e Salvar no Banco'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
