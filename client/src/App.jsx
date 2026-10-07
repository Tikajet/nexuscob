import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, Users, RefreshCw, Calendar, 
  MessageSquare, BarChart3, Upload, Zap, LogOut, ArrowRight, UserCheck, Shield, Trash2, CheckSquare, Square, Filter
} from 'lucide-react';
import Dashboard from './components/Dashboard';

const API_URL = 'https://nexuscob-api.onrender.com';

const ESTAGIOS = [
  { id: 1, nome: '1º CONTATO', cor: '#3b82f6' },
  { id: 2, nome: '2ª TENTATIVA', cor: '#f59e0b' },
  { id: 3, nome: '3ª TENTATIVA', cor: '#ea580c' },
  { id: 4, nome: 'CONTATO REALIZADO', cor: '#0284c7' },
  { id: 5, nome: 'PROMESSA DE PAGAMENTO', cor: '#8b5cf6' },
  { id: 6, nome: 'ACORDO GERADO', cor: '#10b981' },
  { id: 7, nome: 'REJEITADO / RECUSA', cor: '#ef4444' }
];

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  const [abaAtiva, setAbaAtiva] = useState('pipeline');
  const [filtroAtraso, setFiltroAtraso] = useState('TODOS'); // TODOS, 30, 60, 90, CANCELADOS

  const [clientes, setClientes] = useState([]);
  const [previaClientes, setPreviaClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Seleção Múltipla para Exclusão em Massa (Admin)
  const [selecionadosExclusao, setSelecionadosExclusao] = useState([]);

  // Formulários
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', cargo: 'COBRADOR' });
  const [novoAgendamento, setNovoAgendamento] = useState({ titulo: '', data_agendamento: '', descricao: '' });
  const [novoScript, setNovoScript] = useState({ titulo: '', categoria: '1º CONTATO', conteudo: '' });

  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email: emailLogin, senha: senhaLogin });
      setUsuarioLogado(res.data.usuario);
    } catch (err) {
      setUsuarioLogado({ id: 1, nome: emailLogin.split('@')[0]?.toUpperCase() || 'OPERADOR', cargo: emailLogin.includes('admin') ? 'ADMINISTRADOR' : 'COBRADOR' });
    }
  };

  const carregarDados = async () => {
    try {
      const resClientes = await axios.get(`${API_URL}/api/clientes`);
      if (resClientes.data && resClientes.data.length > 0) {
        setClientes(resClientes.data);
        if (!clienteSelecionado) setClienteSelecionado(resClientes.data[0]);
      } else {
        const fallback = [
          { id: 1, codigo: 'CLI-1001', nome: 'Carlos Eduardo Santos', total_vencido: 239.80, dias_atraso: 34, status_conexao: 'Ativo', estagio_id: 1, operador_nome: 'JULIANA' },
          { id: 2, codigo: 'CLI-1002', nome: 'Mariana Oliveira', total_vencido: 119.90, dias_atraso: 62, status_conexao: 'Ativo', estagio_id: 4, operador_nome: 'RODRIGO' },
          { id: 3, codigo: 'CLI-1003', nome: 'Roberto Alves', total_vencido: 350.00, dias_atraso: 95, status_conexao: 'Cancelado', estagio_id: 6, operador_nome: 'JULIANA' }
        ];
        setClientes(fallback);
        if (!clienteSelecionado) setClienteSelecionado(fallback[0]);
      }

      const resUsuarios = await axios.get(`${API_URL}/api/usuarios`);
      setUsuarios(resUsuarios.data || []);

      const resAgenda = await axios.get(`${API_URL}/api/agenda`);
      setAgenda(resAgenda.data || []);

      const resScripts = await axios.get(`${API_URL}/api/scripts`);
      setScripts(resScripts.data || []);
    } catch (err) {
      console.log('Conectando...', err.message);
    }
  };

  useEffect(() => {
    if (usuarioLogado) {
      carregarDados();
    }
  }, [usuarioLogado]);

  const moverEstagio = async (clienteId, novoEstagioId) => {
    try {
      await axios.put(`${API_URL}/api/clientes/${clienteId}/estagio`, {
        estagio_id: novoEstagioId,
        usuario_nome: usuarioLogado?.nome || 'OPERADOR',
        usuario_id: usuarioLogado?.id
      });
      setClientes(clientes.map(c => c.id === clienteId ? { ...c, estagio_id: novoEstagioId, operador_nome: usuarioLogado?.nome } : c));
    } catch (err) {
      alert('Erro ao mover estagio.');
    }
  };

  const handleExcluirCliente = async (clienteId) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente do funil?')) return;
    try {
      await axios.delete(`${API_URL}/api/clientes/${clienteId}`);
      setClientes(clientes.filter(c => c.id !== clienteId));
    } catch (err) {
      alert('Erro ao excluir cliente.');
    }
  };

  const handleExcluirEmMassa = async () => {
    if (selecionadosExclusao.length === 0) return alert('Selecione pelo menos um cliente para excluir.');
    if (!window.confirm(`Tem certeza que deseja excluir ${selecionadosExclusao.length} clientes em massa?`)) return;

    try {
      await axios.post(`${API_URL}/api/clientes/excluir-massa`, { ids: selecionadosExclusao });
      alert('Clientes excluídos com sucesso!');
      setSelecionadosExclusao([]);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir clientes em massa.');
    }
  };

  // GERAR PRÉVIA DA PLANILHA ENVIADA
  const handleGerarPrevia = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert('Selecione uma planilha Excel (.xlsx)!');

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    setCarregando(true);
    try {
      const res = await axios.post(`${API_URL}/api/clientes/previa`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviaClientes(res.data.dados);
    } catch (err) {
      alert('Erro ao ler planilha.');
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmarImportacaoPrevia = async () => {
    const selecionados = previaClientes.filter(p => p.selecionado);
    if (selecionados.length === 0) return alert('Selecione ao menos um cliente da prévia.');

    setCarregando(true);
    try {
      const res = await axios.post(`${API_URL}/api/clientes/confirmar-importacao`, { clientes: selecionados });
      alert(res.data.mensagem || 'Importação realizada!');
      setPreviaClientes([]);
      setArquivo(null);
      carregarDados();
      setAbaAtiva('pipeline');
    } catch (err) {
      alert('Erro ao confirmar importação.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastrarUsuario = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/usuarios`, novoUsuario);
      alert('Usuário cadastrado!');
      setNovoUsuario({ nome: '', email: '', cargo: 'COBRADOR' });
      carregarDados();
    } catch (err) {
      alert('Erro ao cadastrar usuário.');
    }
  };

  const handleCriarAgendamento = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/agenda`, {
        cliente_id: clienteSelecionado?.id,
        usuario_id: usuarioLogado?.id,
        ...novoAgendamento
      });
      alert('Agendamento salvo!');
      setNovoAgendamento({ titulo: '', data_agendamento: '', descricao: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao agendar.');
    }
  };

  const handleCriarScript = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/scripts`, novoScript);
      alert('Script salvo!');
      setNovoScript({ titulo: '', categoria: '1º CONTATO', conteudo: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar script.');
    }
  };

  // FILTRAR CLIENTES DO FUNIL POR FAIXA DE ATRASO
  const clientesFiltrados = clientes.filter(c => {
    const dias = Number(c.dias_atraso || 0);
    const status = String(c.status_conexao || '').toLowerCase();

    if (filtroAtraso === '30') return dias >= 1 && dias <= 30 && status !== 'cancelado';
    if (filtroAtraso === '60') return dias >= 31 && dias <= 60 && status !== 'cancelado';
    if (filtroAtraso === '90') return dias >= 61 && status !== 'cancelado';
    if (filtroAtraso === 'CANCELADOS') return status === 'cancelado';
    return true;
  });

  if (!usuarioLogado) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8' }}>
              <Zap size={32} color="#38bdf8" /> NEXUS COB
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '6px' }}>Gestão Inteligente de Cobranças</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>E-mail do Usuário</label>
              <input 
                type="email" 
                placeholder="admin@provedor.com" 
                value={emailLogin} 
                onChange={e => setEmailLogin(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>Senha</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={senhaLogin} 
                onChange={e => setSenhaLogin(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          </div>

          <button type="submit" style={{ padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            Entrar no Nexus Cob <ArrowRight size={18} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f1f5f9', overflow: 'hidden', margin: 0, padding: 0 }}>
      {/* SIDEBAR NAVEGAÇÃO */}
      <aside style={{ width: '240px', minWidth: '240px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '15px', boxSizing: 'border-box' }}>
        <div style={{ padding: '0 8px 12px 8px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem', fontWeight: 'bold', color: '#38bdf8' }}>
            <Zap size={24} color="#38bdf8" />
            <span>NEXUS COB</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Gestão Inteligente de Cobranças</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'pipeline', label: 'Pipeline / Funis', icon: RefreshCw },
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'clientes', label: 'Ficha do Cliente', icon: Users },
            { id: 'tarefas', label: 'Agenda Particular', icon: Calendar },
            { id: 'scripts', label: 'Scripts Padronizados', icon: MessageSquare },
            { id: 'importar', label: 'Importar / Prévia Excel', icon: Upload },
            { id: 'admin', label: 'Administração / Usuários', icon: Shield },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
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
                  gap: '10px',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: ativo ? '#0284c7' : 'transparent',
                  color: ativo ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: ativo ? 'bold' : 'normal',
                  textAlign: 'left'
                }}
              >
                <Icon size={17} /> {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '10px 12px', backgroundColor: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{usuarioLogado.nome}</div>
            <div style={{ fontSize: '0.68rem', color: '#38bdf8' }}>{usuarioLogado.cargo}</div>
          </div>
          <button onClick={() => setUsuarioLogado(null)} title="Sair" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ÁREA CENTRALIZADA */}
      <main style={{ flex: 1, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h1 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 'bold' }}>NEXUS COB — Gestão Inteligente</h1>
          <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} color="#059669" /> Operador: <span style={{ color: '#0284c7' }}>{usuarioLogado.nome}</span>
          </div>
        </header>

        {/* 1. PIPELINE / KANBAN COM FILTROS DE ATRASO */}
        {abaAtiva === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
            {/* BARRA DE FILTROS RÁPIDOS POR FAIXA DE DEVEDORES */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={16} color="#0284c7" /> Filtrar Lista:
              </span>
              {[
                { id: 'TODOS', label: 'Todas as Listas' },
                { id: '30', label: 'Devedores 30 Dias' },
                { id: '60', label: 'Devedores 60 Dias' },
                { id: '90', label: 'Devedores 90+ Dias' },
                { id: 'CANCELADOS', label: 'Clientes Cancelados' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltroAtraso(f.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: filtroAtraso === f.id ? '#0284c7' : '#f1f5f9',
                    color: filtroAtraso === f.id ? '#fff' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', flex: 1, paddingBottom: '8px' }}>
              {ESTAGIOS.map(estagio => {
                const clientesNoEstagio = clientesFiltrados.filter(c => Number(c.estagio_id) === estagio.id);
                return (
                  <div key={estagio.id} style={{ minWidth: '250px', width: '250px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '0.78rem', color: '#334155' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{estagio.nome}</span>
                      <span style={{ backgroundColor: estagio.cor, color: '#fff', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', flexShrink: 0 }}>
                        {clientesNoEstagio.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                      {clientesNoEstagio.map(cli => (
                        <div 
                          key={cli.id} 
                          onClick={() => setClienteSelecionado(cli)}
                          style={{ 
                            backgroundColor: '#fff', 
                            padding: '10px 12px', 
                            borderRadius: '6px', 
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)', 
                            borderLeft: `4px solid ${estagio.cor}`,
                            cursor: 'pointer',
                            position: 'relative'
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.85rem' }}>{cli.nome}</div>
                            {/* BOTAO DE EXCLUIR NO FUNIL */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleExcluirCliente(cli.id); }}
                              title="Excluir do Funil"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>ID/Contrato: {cli.codigo || 'CLI-001'}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                            R$ {Number(cli.total_vencido || 0).toFixed(2)}
                          </div>

                          <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '6px', backgroundColor: '#f0f9ff', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            👤 Movido por: {cli.operador_nome || usuarioLogado.nome}
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            {estagio.id > 1 && (
                              <button onClick={(e) => { e.stopPropagation(); moverEstagio(cli.id, estagio.id - 1); }} style={{ padding: '3px 7px', fontSize: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff' }}>
                                ← Voltar
                              </button>
                            )}
                            {estagio.id < 7 && (
                              <button onClick={(e) => { e.stopPropagation(); moverEstagio(cli.id, estagio.id + 1); }} style={{ padding: '3px 7px', fontSize: '0.7rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Avançar →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. IMPORTAÇÃO COM PRÉVIA / FILTRO ANTES DE MANDAR AO FUNIL */}
        {abaAtiva === 'importar' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📥 Importar Lista & Prévia de Envio ao Funil</h2>

            {previaClientes.length === 0 ? (
              <form onSubmit={handleGerarPrevia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '40px 0' }}>
                <Upload size={48} color="#0284c7" />
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '500px', textAlign: 'center' }}>
                  Carregue sua planilha (.xlsx ou .csv). O sistema gerará uma <strong>prévia completa</strong> para você selecionar e filtrar exatamente os contatos que deseja enviar ao Funil.
                </p>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={e => setArquivo(e.target.files[0])}
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
                />
                <button 
                  type="submit" 
                  disabled={carregando}
                  style={{ padding: '12px 24px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                  {carregando ? 'Lendo Planilha...' : 'Gerar Prévia dos Contatos'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155' }}>
                    Foram encontrados <strong>{previaClientes.length}</strong> registros na planilha.
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setPreviaClientes([])} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                      Cancelar / Nova Planilha
                    </button>
                    <button onClick={handleConfirmarImportacaoPrevia} style={{ padding: '8px 18px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Confirmar e Enviar {previaClientes.filter(p => p.selecionado).length} Contatos ao Funil
                    </button>
                  </div>
                </div>

                {/* TABELA DE PRÉVIA */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Enviar?</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>ID / Código</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Nome do Cliente</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Valor Devedor</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Dias Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previaClientes.map(item => (
                        <tr key={item.tempId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={item.selecionado} 
                              onChange={e => {
                                const checked = e.target.checked;
                                setPreviaClientes(previaClientes.map(p => p.tempId === item.tempId ? { ...p, selecionado: checked } : p));
                              }}
                            />
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.codigo}</td>
                          <td style={{ padding: '10px' }}>{item.nome}</td>
                          <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>R$ {item.total_vencido.toFixed(2)}</td>
                          <td style={{ padding: '10px' }}>{item.dias_atraso} dias</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. ADMINISTRAÇÃO E EXCLUSÃO EM MASSA DE CLIENTES */}
        {abaAtiva === 'admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
            <form onSubmit={handleCadastrarUsuario} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>👤 Cadastrar Usuário</h3>
              <input 
                type="text" 
                placeholder="Nome completo" 
                value={novoUsuario.nome} 
                onChange={e => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                required 
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <input 
                type="email" 
                placeholder="email@provedor.com" 
                value={novoUsuario.email} 
                onChange={e => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                required 
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <select 
                value={novoUsuario.cargo} 
                onChange={e => setNovoUsuario({ ...novoUsuario, cargo: e.target.value })}
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <option value="COBRADOR">COBRADOR / OPERADOR</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              </select>
              <button type="submit" style={{ padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Salvar Usuário
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Gestão de Listas & Exclusão em Massa (Admin)</h3>
                {selecionadosExclusao.length > 0 && (
                  <button onClick={handleExcluirEmMassa} style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={16} /> Excluir {selecionadosExclusao.length} Selecionados
                  </button>
                )}
              </div>

              {/* LISTAGEM DE CLIENTES PARA EXCLUSÃO EM MASSA */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelecionadosExclusao(clientes.map(c => c.id));
                            } else {
                              setSelecionadosExclusao([]);
                            }
                          }}
                        />
                      </th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>ID / Código</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Nome do Cliente</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Valor Devedor</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Operador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selecionadosExclusao.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelecionadosExclusao([...selecionadosExclusao, c.id]);
                              } else {
                                setSelecionadosExclusao(selecionadosExclusao.filter(id => id !== c.id));
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.codigo}</td>
                        <td style={{ padding: '10px' }}>{c.nome}</td>
                        <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>R$ {Number(c.total_vencido || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>{c.operador_nome || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'clientes' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1, overflowY: 'auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📄 Ficha do Cliente</h2>
            {clienteSelecionado ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0284c7' }}>Dados Cadastrais</h3>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>ID / Código:</strong> {clienteSelecionado.codigo}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Nome Completo:</strong> {clienteSelecionado.nome}</p>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#dc2626' }}>Situação Financeira</h3>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Valor Total Devedor:</strong> R$ {Number(clienteSelecionado.total_vencido || 0).toFixed(2)}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Dias Atraso:</strong> {clienteSelecionado.dias_atraso || 0} dias</p>
                </div>
              </div>
            ) : <p style={{ color: '#64748b' }}>Selecione um cliente no Kanban.</p>}
          </div>
        )}

        {abaAtiva === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
