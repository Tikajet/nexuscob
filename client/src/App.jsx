import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, Users, RefreshCw, Calendar, 
  MessageSquare, BarChart3, Upload, Zap, LogOut, ArrowRight, UserCheck, Shield, Trash2, Filter, UserPlus, Printer, Copy, Check
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
  const [filtroAtraso, setFiltroAtraso] = useState('TODOS');

  // Filtros de Relatório
  const [filtroRelatorioMes, setFiltroRelatorioMes] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [clientes, setClientes] = useState([]);
  const [previaClientes, setPreviaClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [selecionadosExclusao, setSelecionadosExclusao] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', cargo: 'COBRADOR' });
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [formManual, setFormManual] = useState({
    codigo: '',
    nome: '',
    total_vencido: '',
    opcao_atraso: '30'
  });

  // Estado para cadastro de Scripts
  const [novoScript, setNovoScript] = useState({
    titulo: '',
    categoria: '30', // 30, 60, 90, CANCELADOS
    conteudo: ''
  });
  const [filtroScriptCategoria, setFiltroScriptCategoria] = useState('TODOS');
  const [copiadoId, setCopiadoId] = useState(null);

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
      }

      const resUsuarios = await axios.get(`${API_URL}/api/usuarios`);
      setUsuarios(resUsuarios.data || []);

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
      alert('Erro ao mover estágio.');
    }
  };

  const handleExcluirCliente = async (clienteId) => {
    if (!window.confirm('Deseja excluir este cliente do funil?')) return;
    try {
      await axios.delete(`${API_URL}/api/clientes/${clienteId}`);
      setClientes(clientes.filter(c => c.id !== clienteId));
      if (clienteSelecionado?.id === clienteId) setClienteSelecionado(null);
      alert('Cliente removido com sucesso!');
    } catch (err) {
      alert('Erro ao excluir cliente.');
    }
  };

  const handleExcluirEmMassa = async () => {
    if (selecionadosExclusao.length === 0) return alert('Selecione pelo menos um cliente.');
    if (!window.confirm(`Deseja excluir ${selecionadosExclusao.length} clientes selecionados?`)) return;

    try {
      await axios.post(`${API_URL}/api/clientes/excluir-massa`, { ids: selecionadosExclusao });
      alert('Clientes excluídos com sucesso!');
      setSelecionadosExclusao([]);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir em massa.');
    }
  };

  const handleCadastrarScript = async (e) => {
    e.preventDefault();
    if (!novoScript.titulo || !novoScript.conteudo) {
      return alert('Preencha o título e o conteúdo da mensagem.');
    }

    try {
      await axios.post(`${API_URL}/api/scripts`, novoScript);
      alert('Script de cobrança cadastrado com sucesso!');
      setNovoScript({ titulo: '', categoria: '30', conteudo: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao cadastrar script.');
    }
  };

  const handleExcluirScript = async (id) => {
    if (!window.confirm('Deseja excluir este script?')) return;
    try {
      await axios.delete(`${API_URL}/api/scripts/${id}`);
      setScripts(scripts.filter(s => s.id !== id));
      alert('Script excluído com sucesso!');
    } catch (err) {
      alert('Erro ao excluir script.');
    }
  };

  const handleCopiarTexto = (id, texto) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleCadastrarClienteManual = async (e) => {
    e.preventDefault();
    if (!formManual.nome || !formManual.total_vencido) {
      return alert('Preencha o Nome e o Valor Devedor.');
    }

    try {
      const res = await axios.post(`${API_URL}/api/clientes/manual`, formManual);
      alert(res.data.mensagem || 'Cliente cadastrado com sucesso!');
      setFormManual({ codigo: '', nome: '', total_vencido: '', opcao_atraso: '30' });
      carregarDados();
    } catch (err) {
      const msg = err.response?.data?.detalhe || err.response?.data?.error || err.message;
      alert(`Erro ao cadastrar cliente manualmente: ${msg}`);
    }
  };

  const handleGerarPrevia = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert('Selecione um arquivo Excel (.xlsx)!');

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    setCarregando(true);
    try {
      const res = await axios.post(`${API_URL}/api/clientes/previa`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.dados) {
        setPreviaClientes(res.data.dados);
      }
    } catch (err) {
      alert('Erro ao ler a planilha Excel.');
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmarImportacaoPrevia = async () => {
    const selecionados = previaClientes.filter(p => p.selecionado);
    if (selecionados.length === 0) return alert('Selecione ao menos um cliente.');

    setCarregando(true);
    try {
      const res = await axios.post(`${API_URL}/api/clientes/confirmar-importacao`, { clientes: selecionados });
      alert(res.data.mensagem || 'Importação realizada com sucesso!');
      setPreviaClientes([]);
      setArquivo(null);
      carregarDados();
      setAbaAtiva('pipeline');
    } catch (err) {
      const msg = err.response?.data?.detalhe || err.response?.data?.error || err.message;
      alert(`Erro ao salvar no banco: ${msg}`);
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastrarUsuario = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/usuarios`, novoUsuario);
      alert('Usuário cadastrado com sucesso!');
      setNovoUsuario({ nome: '', email: '', cargo: 'COBRADOR' });
      carregarDados();
    } catch (err) {
      alert('Erro ao cadastrar usuário.');
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const dias = Number(c.dias_atraso || 0);
    const status = String(c.status_conexao || '').toLowerCase();

    if (filtroAtraso === '30') return dias >= 1 && dias <= 30 && status !== 'cancelado';
    if (filtroAtraso === '60') return dias >= 31 && dias <= 60 && status !== 'cancelado';
    if (filtroAtraso === '90') return dias >= 61 && status !== 'cancelado';
    if (filtroAtraso === 'CANCELADOS') return status === 'cancelado';
    return true;
  });

  const scriptsFiltrados = scripts.filter(s => {
    if (filtroScriptCategoria === 'TODOS') return true;
    return String(s.categoria) === filtroScriptCategoria;
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
              <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>E-mail</label>
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
            { id: 'clientes', label: 'Ficha do Cliente', icon: Users },
            { id: 'scripts', label: 'Scripts de Cobrança', icon: MessageSquare },
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'importar', label: 'Importar / Prévia Excel', icon: Upload },
            { id: 'admin', label: 'Administração / Usuários', icon: Shield },
            { id: 'relatorios', label: 'Relatórios / Período', icon: BarChart3 },
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

      <main style={{ flex: 1, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h1 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 'bold' }}>NEXUS COB — Gestão Inteligente</h1>
          <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} color="#059669" /> Operador: <span style={{ color: '#0284c7' }}>{usuarioLogado.nome}</span>
          </div>
        </header>

        {/* FUNIL KANBAN */}
        {abaAtiva === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
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
                          onClick={() => { setClienteSelecionado(cli); setAbaAtiva('clientes'); }}
                          style={{ 
                            backgroundColor: '#fff', 
                            padding: '10px 12px', 
                            borderRadius: '6px', 
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)', 
                            borderLeft: `4px solid ${estagio.cor}`,
                            cursor: 'pointer'
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.85rem' }}>{cli.nome}</div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleExcluirCliente(cli.id); }}
                              title="Excluir do Funil"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={16} />
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

        {/* SCRIPTS DE COBRANÇA */}
        {abaAtiva === 'scripts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
            <form onSubmit={handleCadastrarScript} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 'bold', fontSize: '1rem' }}>
                <MessageSquare size={20} /> Cadastrar Script de Cobrança
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Título do Script *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Lembrete de Vencimento 30 Dias" 
                  value={novoScript.titulo} 
                  onChange={e => setNovoScript({ ...novoScript, titulo: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Tipo de Devedor / Categoria</label>
                <select 
                  value={novoScript.categoria} 
                  onChange={e => setNovoScript({ ...novoScript, categoria: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                  <option value="30">Devedores 30 Dias</option>
                  <option value="60">Devedores 60 Dias</option>
                  <option value="90">Devedores 90+ Dias</option>
                  <option value="CANCELADOS">Clientes Cancelados</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Mensagem / Texto para Envio *</label>
                <textarea 
                  rows={6}
                  placeholder="Olá {NOME}, identificamos uma pendência no valor de {VALOR}. Podemos enviar a segunda via da fatura?" 
                  value={novoScript.conteudo} 
                  onChange={e => setNovoScript({ ...novoScript, conteudo: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" style={{ padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                Salvar Modelo de Mensagem
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>📜 Biblioteca de Scripts Cadastrados</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Filtrar Categoria:</span>
                  <select 
                    value={filtroScriptCategoria} 
                    onChange={e => setFiltroScriptCategoria(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}>
                    <option value="TODOS">Todas as Categorias</option>
                    <option value="30">30 Dias</option>
                    <option value="60">60 Dias</option>
                    <option value="90">90+ Dias</option>
                    <option value="CANCELADOS">Cancelados</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scriptsFiltrados.map(s => (
                  <div key={s.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>{s.titulo}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: s.categoria === 'CANCELADOS' ? '#fee2e2' : '#e0f2fe', color: s.categoria === 'CANCELADOS' ? '#dc2626' : '#0369a1', fontSize: '0.72rem', fontWeight: 'bold' }}>
                          {s.categoria === 'CANCELADOS' ? 'CANCELADOS' : `${s.categoria} DIAS`}
                        </span>
                        <button onClick={() => handleExcluirScript(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-line', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      {s.conteudo}
                    </div>

                    <button 
                      onClick={() => handleCopiarTexto(s.id, s.conteudo)}
                      style={{ padding: '8px 14px', backgroundColor: copiadoId === s.id ? '#059669' : '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
                      {copiadoId === s.id ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar Texto</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD INTEGRADO */}
        {abaAtiva === 'dashboard' && <Dashboard clientes={clientes} />}

        {/* RELATÓRIOS */}
        {abaAtiva === 'relatorios' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📈 Relatório de Cobrança por Período</h2>
              <button onClick={() => window.print()} style={{ padding: '8px 14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Imprimir Relatório
              </button>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', display: 'block' }}>Filtrar por Mês:</label>
                <select 
                  value={filtroRelatorioMes} 
                  onChange={e => setFiltroRelatorioMes(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                  <option value="TODOS">Todos os Meses</option>
                  <option value="10">Outubro / 2026</option>
                  <option value="9">Setembro / 2026</option>
                  <option value="8">Agosto / 2026</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', display: 'block' }}>Data Início:</label>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={e => setDataInicio(e.target.value)} 
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', display: 'block' }}>Data Fim:</label>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={e => setDataFim(e.target.value)} 
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>

              {(dataInicio || dataFim || filtroRelatorioMes !== 'TODOS') && (
                <button 
                  onClick={() => { setDataInicio(''); setDataFim(''); setFiltroRelatorioMes('TODOS'); }}
                  style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', alignSelf: 'flex-end' }}>
                  Limpar Filtros
                </button>
              )}
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left' }}>ID / Código</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nome do Cliente</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Valor Devedor</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Dias Atraso</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Estágio Atual</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.codigo}</td>
                      <td style={{ padding: '10px' }}>{c.nome}</td>
                      <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>R$ {Number(c.total_vencido || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>{c.dias_atraso || 30} dias</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#0284c7' }}>
                        {ESTAGIOS.find(e => e.id === Number(c.estagio_id))?.nome || '1º CONTATO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IMPORTAÇÃO & PRÉVIA */}
        {abaAtiva === 'importar' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📥 Importar Lista & Gerar Prévia do Funil</h2>

            {previaClientes.length === 0 ? (
              <form onSubmit={handleGerarPrevia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '40px 0' }}>
                <Upload size={48} color="#0284c7" />
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '500px', textAlign: 'center' }}>
                  Selecione sua planilha Excel (.xlsx ou .csv). O sistema gerará uma <strong>prévia completa</strong> para você categorizar antes de enviar para o Funil.
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
                  {carregando ? 'Processando Planilha...' : 'Gerar Prévia dos Contatos'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0369a1' }}>Definir Categoria para Toda a Lista:</label>
                    <select 
                      onChange={e => {
                        const valor = e.target.value;
                        setPreviaClientes(previaClientes.map(p => ({ ...p, opcao_atraso: valor })));
                      }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #0284c7', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <option value="30">Devedores 30 Dias</option>
                      <option value="60">Devedores 60 Dias</option>
                      <option value="90">Devedores 90+ Dias</option>
                      <option value="CANCELADOS">Clientes Cancelados</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setPreviaClientes([])} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#fff' }}>
                      Cancelar
                    </button>
                    <button onClick={handleConfirmarImportacaoPrevia} style={{ padding: '8px 18px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Confirmar e Enviar {previaClientes.filter(p => p.selecionado).length} Contatos ao Funil
                    </button>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Enviar?</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>ID / Código</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Nome do Cliente</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Valor Devedor</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Faixa / Categoria do Cliente</th>
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
                          <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>R$ {Number(item.total_vencido || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px' }}>
                            <select 
                              value={item.opcao_atraso || '30'}
                              onChange={e => {
                                const val = e.target.value;
                                setPreviaClientes(previaClientes.map(p => p.tempId === item.tempId ? { ...p, opcao_atraso: val } : p));
                              }}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                              <option value="30">30 Dias</option>
                              <option value="60">60 Dias</option>
                              <option value="90">90+ Dias</option>
                              <option value="CANCELADOS">Cancelados</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FICHA DO CLIENTE */}
        {abaAtiva === 'clientes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
            <form onSubmit={handleCadastrarClienteManual} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 'bold', fontSize: '1rem' }}>
                <UserPlus size={20} /> Cadastrar Cliente Manual
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>ID / Código</label>
                <input 
                  type="text" 
                  placeholder="Ex: 01 ou CLI-001" 
                  value={formManual.codigo} 
                  onChange={e => setFormManual({ ...formManual, codigo: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Nome do Cliente *</label>
                <input 
                  type="text" 
                  placeholder="Nome completo" 
                  value={formManual.nome} 
                  onChange={e => setFormManual({ ...formManual, nome: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Valor Devedor (R$) *</label>
                <input 
                  type="text" 
                  placeholder="Ex: 1872,00" 
                  value={formManual.total_vencido} 
                  onChange={e => setFormManual({ ...formManual, total_vencido: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Faixa / Situação do Atraso</label>
                <select 
                  value={formManual.opcao_atraso} 
                  onChange={e => setFormManual({ ...formManual, opcao_atraso: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                  <option value="30">Devedor 30 Dias</option>
                  <option value="60">Devedor 60 Dias</option>
                  <option value="90">Devedor 90+ Dias</option>
                  <option value="CANCELADOS">Cliente Cancelado</option>
                </select>
              </div>

              <button type="submit" style={{ padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                Salvar e Adicionar ao Funil
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>📄 Análise do Cliente Cadastrado</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total: <strong>{clientes.length}</strong></span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Selecionar Cliente:</label>
                <select 
                  value={clienteSelecionado?.id || ''} 
                  onChange={(e) => setClienteSelecionado(clientes.find(c => c.id === Number(e.target.value)))}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', flex: 1 }}>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nome} (R$ {Number(c.total_vencido || 0).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {clienteSelecionado ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0284c7' }}>Dados Cadastrais</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>ID / Código:</strong> {clienteSelecionado.codigo}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Nome do Cliente:</strong> {clienteSelecionado.nome}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Status Conexão:</strong> {clienteSelecionado.status_conexao || 'Ativo'}</p>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#dc2626' }}>Situação Financeira</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Valor Total Devedor:</strong> <span style={{ color: '#dc2626', fontWeight: 'bold' }}>R$ {Number(clienteSelecionado.total_vencido || 0).toFixed(2)}</span></p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Dias em Atraso:</strong> {clienteSelecionado.dias_atraso || 30} dias</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Estágio Atual no Funil:</strong> {ESTAGIOS.find(e => e.id === Number(clienteSelecionado.estagio_id))?.nome || '1º CONTATO'}</p>
                  </div>
                </div>
              ) : <p style={{ color: '#64748b' }}>Nenhum cliente cadastrado ainda.</p>}
            </div>
          </div>
        )}

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
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Exclusão em Massa de Listas (Admin)</h3>
                {selecionadosExclusao.length > 0 && (
                  <button onClick={handleExcluirEmMassa} style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={16} /> Excluir {selecionadosExclusao.length} Selecionados
                  </button>
                )}
              </div>

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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
