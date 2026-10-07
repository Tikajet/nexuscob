import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, Users, RefreshCw, Calendar, 
  MessageSquare, BarChart3, Upload, Zap, LogOut, ArrowRight, UserCheck, Shield, Plus, Copy, Send, CheckCircle
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
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);

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
          { id: 1, codigo: 'CLI-1001', nome: 'Carlos Eduardo Santos', total_vencido: 239.80, estagio_id: 1, operador_nome: 'JULIANA', atualizado_em: 'Hoje' },
          { id: 2, codigo: 'CLI-1002', nome: 'Mariana Oliveira', total_vencido: 119.90, estagio_id: 4, operador_nome: 'RODRIGO', atualizado_em: 'Ontem' },
          { id: 3, codigo: 'CLI-1003', nome: 'Roberto Alves', total_vencido: 350.00, estagio_id: 6, operador_nome: 'JULIANA', atualizado_em: 'Hoje' }
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
      alert('Agendamento salvo na sua agenda!');
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
      alert('Script padronizado salvo pelo Administrador!');
      setNovoScript({ titulo: '', categoria: '1º CONTATO', conteudo: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar script.');
    }
  };

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
      alert(res.data.mensagem || 'Lista importada!');
      carregarDados();
      setAbaAtiva('pipeline');
    } catch (err) {
      alert('Erro ao importar planilha. Certifique-se das colunas ID, Nome e Valor Devedor.');
    } finally {
      setCarregando(false);
    }
  };

  const renderScriptText = (conteudo) => {
    const cli = clienteSelecionado || {};
    return (conteudo || '')
      .replace(/{{nome_cliente}}/g, cli.nome || 'Cliente')
      .replace(/{{codigo}}/g, cli.codigo || 'CLI-001')
      .replace(/{{valor_divida}}/g, `R$ ${Number(cli.total_vencido || 0).toFixed(2)}`)
      .replace(/{{cobrador}}/g, usuarioLogado?.nome || 'Operador');
  };

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
            { id: 'importar', label: 'Importar Excel', icon: Upload },
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

        {/* 1. PIPELINE / KANBAN */}
        {abaAtiva === 'pipeline' && (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', flex: 1, paddingBottom: '8px' }}>
            {ESTAGIOS.map(estagio => {
              const clientesNoEstagio = clientes.filter(c => Number(c.estagio_id) === estagio.id);
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
                          border: clienteSelecionado?.id === cli.id ? '2px solid #0284c7' : 'none'
                        }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.85rem' }}>{cli.nome}</div>
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
        )}

        {/* 2. FICHA COMPLETA DO CLIENTE */}
        {abaAtiva === 'clientes' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📄 Ficha do ClienteSelecionado</h2>
            {clienteSelecionado ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0284c7' }}>Dados Cadastrais</h3>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>ID / Código:</strong> {clienteSelecionado.codigo}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Nome Completo:</strong> {clienteSelecionado.nome}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>CPF / CNPJ:</strong> {clienteSelecionado.documento || 'Não informado'}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Telefone / WhatsApp:</strong> {clienteSelecionado.telefone || 'Não informado'}</p>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#dc2626' }}>Situação Financeira</h3>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Valor Total Devedor:</strong> R$ {Number(clienteSelecionado.total_vencido || 0).toFixed(2)}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Estágio Atual:</strong> {ESTAGIOS.find(e => e.id === Number(clienteSelecionado.estagio_id))?.nome || '1º CONTATO'}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Responsável Atual:</strong> {clienteSelecionado.operador_nome || usuarioLogado.nome}</p>
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>Selecione um cliente no Kanban para abrir sua ficha.</p>
            )}
          </div>
        )}

        {/* 3. AGENDA PARTICULAR */}
        {abaAtiva === 'tarefas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', flex: 1 }}>
            <form onSubmit={handleCriarAgendamento} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>📅 Novo Agendamento</h3>
              <input 
                type="text" 
                placeholder="Título do compromisso" 
                value={novoAgendamento.titulo} 
                onChange={e => setNovoAgendamento({ ...novoAgendamento, titulo: e.target.value })}
                required 
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <input 
                type="datetime-local" 
                value={novoAgendamento.data_agendamento} 
                onChange={e => setNovoAgendamento({ ...novoAgendamento, data_agendamento: e.target.value })}
                required 
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <textarea 
                placeholder="Observações do retorno..." 
                value={novoAgendamento.descricao} 
                onChange={e => setNovoAgendamento({ ...novoAgendamento, descricao: e.target.value })}
                rows="4" 
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <button type="submit" style={{ padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Salvar Compromisso
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#0f172a' }}>Meus Compromissos Agendados</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agenda.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Nenhum compromisso agendado na sua agenda particular.</p>
                ) : (
                  agenda.map(item => (
                    <div key={item.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>{item.titulo}</div>
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

        {/* 4. SCRIPTS DE COBRANÇA PADRONIZADOS */}
        {abaAtiva === 'scripts' && (
          <div style={{ display: 'grid', gridTemplateColumns: usuarioLogado.cargo === 'ADMINISTRADOR' ? '360px 1fr' : '1fr', gap: '20px', flex: 1 }}>
            {usuarioLogado.cargo === 'ADMINISTRADOR' && (
              <form onSubmit={handleCriarScript} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>✍️ Criar Script Padronizado (Admin)</h3>
                <input 
                  type="text" 
                  placeholder="Título do Script" 
                  value={novoScript.titulo} 
                  onChange={e => setNovoScript({ ...novoScript, titulo: e.target.value })}
                  required 
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
                <select 
                  value={novoScript.categoria} 
                  onChange={e => setNovoScript({ ...novoScript, categoria: e.target.value })}
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                  {ESTAGIOS.map(est => <option key={est.id} value={est.nome}>{est.nome}</option>)}
                </select>
                <textarea 
                  placeholder="Conteúdo do script. Use variáveis {{nome_cliente}}, {{valor_divida}}, {{cobrador}}..." 
                  value={novoScript.conteudo} 
                  onChange={e => setNovoScript({ ...novoScript, conteudo: e.target.value })}
                  rows="6" 
                  required 
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
                <button type="submit" style={{ padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Salvar Script Padronizado
                </button>
              </form>
            )}

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#0f172a' }}>Scripts Padronizados para Operação</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scripts.length === 0 ? (
                  <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', color: '#0284c7' }}>1º CONTATO (Padrão)</div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
                      {renderScriptText("Olá {{nome_cliente}}! Sou {{cobrador}} do setor de negociação. Identificamos um débito em aberto no valor de {{valor_divida}} referente ao seu contrato {{codigo}}. Podemos gerar a chave PIX para quitação hoje?")}
                    </p>
                  </div>
                ) : (
                  scripts.map(s => (
                    <div key={s.id} style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '0.9rem' }}>{s.titulo} ({s.categoria})</div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {renderScriptText(s.conteudo)}
                      </p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(renderScriptText(s.conteudo))}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '6px 12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        <Copy size={14} /> Copiar Texto Renderizado
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. IMPORTAR EXCEL COM FORMATO PADRÃO */}
        {abaAtiva === 'importar' && (
          <form onSubmit={handleUploadExcel} style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <Upload size={48} color="#0284c7" />
            <h2>Nexus Cob → Importar Lista Padronizada de Clientes</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '500px' }}>
              Suba arquivos `.xlsx` ou `.csv`. O sistema aceita a planilha padronizada contendo as colunas: <br />
              <strong style={{ color: '#0f172a' }}>[ ID | Nome | Valor Devedor ]</strong>
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
              style={{ padding: '12px 24px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
              {carregando ? 'Importando...' : 'Carregar e Distribuir no Funil'}
            </button>
          </form>
        )}

        {/* 6. ADMINISTRAÇÃO E CADASTRO DE USUÁRIOS */}
        {abaAtiva === 'admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', flex: 1 }}>
            <form onSubmit={handleCadastrarUsuario} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>👤 Cadastrar Novo Usuário</h3>
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

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#0f172a' }}>Usuários Cadastrados no Sistema</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {usuarios.map(u => (
                  <div key={u.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{u.nome}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: u.cargo === 'ADMINISTRADOR' ? '#f3e8ff' : '#e0f2fe', color: u.cargo === 'ADMINISTRADOR' ? '#6b21a8' : '#0369a1', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {u.cargo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. RELATÓRIOS BASEADOS NOS FUNIS */}
        {abaAtiva === 'relatorios' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📊 Relatório Consolidado de Cobranças e Funis</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL DE CLIENTES EM FUNIL</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>{clientes.length}</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '4px solid #dc2626' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>VALOR TOTAL EM COBRANÇA</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
                  R$ {clientes.reduce((acc, c) => acc + Number(c.total_vencido || 0), 0).toFixed(2)}
                </div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>ACORDOS GERADOS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
                  {clientes.filter(c => Number(c.estagio_id) === 6).length}
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
