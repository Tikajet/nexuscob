import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, Users, RefreshCw, Calendar, 
  MessageSquare, BarChart3, Upload, Zap, LogOut, ArrowRight, UserCheck, Shield, Trash2, Filter, UserPlus, Printer, Copy, Check, Clock, CalendarDays, Search, KeyRound, MessageCircle, FileSpreadsheet, Bell, History, Send
} from 'lucide-react';
import Dashboard from './components/Dashboard';

const API_URL = 'https://nexuscob-api.onrender.com';

const ESTAGIOS = [
  { id: 1, nome: '1º CONTATO', cor: '#1D3557' },
  { id: 2, nome: '2ª TENTATIVA', cor: '#457B9D' },
  { id: 3, nome: '3ª TENTATIVA', cor: '#E63946' },
  { id: 4, nome: 'CONTATO REALIZADO', cor: '#0284c7' },
  { id: 5, nome: 'PROMESSA DE PAGAMENTO', cor: '#8b5cf6' },
  { id: 6, nome: 'ACORDO GERADO', cor: '#10b981' },
  { id: 7, nome: 'REJEITADO / RECUSA', cor: '#E63946' }
];

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  const [abaAtiva, setAbaAtiva] = useState('pipeline');
  const [subAbaAdmin, setSubAbaAdmin] = useState('usuarios');
  
  const [filtroAtraso, setFiltroAtraso] = useState('TODOS');
  const [buscaClienteFicha, setBuscaClienteFicha] = useState('');

  // Filtros de Relatório
  const [filtroRelatorioMes, setFiltroRelatorioMes] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [clientes, setClientes] = useState([]);
  const [previaClientes, setPreviaClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [historicoCliente, setHistoricoCliente] = useState([]);
  const [novaObsCrm, setNovaObsCrm] = useState('');

  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [selecionadosExclusao, setSelecionadosExclusao] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', cargo: 'COBRADOR', senha: '' });
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [usuarioParaAlterarSenha, setUsuarioParaAlterarSenha] = useState(null);
  const [novaSenhaInput, setNovaSenhaInput] = useState('');

  const [filtroAgendaUsuario, setFiltroAgendaUsuario] = useState('TODOS');
  const [novoAgendamento, setNovoAgendamento] = useState({
    cliente_nome: '',
    usuario_id: '',
    data_retorno: '',
    observacao: ''
  });

  const [formManual, setFormManual] = useState({
    codigo: '',
    nome: '',
    telefone: '',
    total_vencido: '',
    opcao_atraso: '30'
  });

  const [novoScript, setNovoScript] = useState({
    titulo: '',
    categoria: '30',
    conteudo: ''
  });
  const [filtroScriptCategoria, setFiltroScriptCategoria] = useState('TODOS');
  const [copiadoId, setCopiadoId] = useState(null);

  const isEspecial = usuarioLogado?.cargo === 'ADMINISTRADOR' || usuarioLogado?.cargo === 'SUPERVISOR';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email: emailLogin, senha: senhaLogin });
      setUsuarioLogado(res.data.usuario);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro de autenticação. Verifique e-mail e senha.');
    }
  };

  const carregarDados = async () => {
    try {
      const resClientes = await axios.get(`${API_URL}/api/clientes`);
      if (resClientes.data && resClientes.data.length > 0) {
        setClientes(resClientes.data);
        if (!clienteSelecionado) {
          setClienteSelecionado(resClientes.data[0]);
          carregarHistoricoCliente(resClientes.data[0].id);
        }
      }

      const resUsuarios = await axios.get(`${API_URL}/api/usuarios`);
      setUsuarios(resUsuarios.data || []);

      const resScripts = await axios.get(`${API_URL}/api/scripts`);
      setScripts(resScripts.data || []);

      const resAgenda = await axios.get(`${API_URL}/api/agenda`);
      setAgendamentos(resAgenda.data || []);
    } catch (err) {
      console.log('Conectando...', err.message);
    }
  };

  const carregarHistoricoCliente = async (clienteId) => {
    try {
      const res = await axios.get(`${API_URL}/api/clientes/${clienteId}/historico`);
      setHistoricoCliente(res.data || []);
    } catch (err) {
      console.log('Erro ao buscar histórico.');
    }
  };

  useEffect(() => {
    if (usuarioLogado) {
      carregarDados();
    }
  }, [usuarioLogado]);

  useEffect(() => {
    if (clienteSelecionado?.id) {
      carregarHistoricoCliente(clienteSelecionado.id);
    }
  }, [clienteSelecionado]);

  const handleAdicionarObsCrm = async (e) => {
    e.preventDefault();
    if (!novaObsCrm || !clienteSelecionado) return;

    try {
      const res = await axios.post(`${API_URL}/api/clientes/${clienteSelecionado.id}/historico`, {
        usuario_nome: usuarioLogado?.nome || 'OPERADOR',
        observacao: novaObsCrm
      });
      setHistoricoCliente([res.data.historico, ...historicoCliente]);
      setNovaObsCrm('');
    } catch (err) {
      alert('Erro ao salvar histórico CRM.');
    }
  };

  const moverEstagio = async (clienteId, novoEstagioId) => {
    try {
      const res = await axios.put(`${API_URL}/api/clientes/${clienteId}/estagio`, {
        estagio_id: novoEstagioId,
        usuario_nome: usuarioLogado?.nome || 'OPERADOR',
        usuario_id: usuarioLogado?.id
      });
      
      const clienteAtualizado = res.data.cliente;

      setClientes(clientes.map(c => c.id === clienteId ? { 
        ...c, 
        estagio_id: novoEstagioId, 
        operador_nome: usuarioLogado?.nome,
        atualizado_em: clienteAtualizado?.atualizado_em || new Date().toISOString()
      } : c));
    } catch (err) {
      alert('Erro ao mover estágio.');
    }
  };

  const abrirWhatsApp = (cliente) => {
    const tel = String(cliente.telefone || '').replace(/\D/g, '');
    const num = tel.length >= 10 ? (tel.startsWith('55') ? tel : `55${tel}`) : '';
    
    const valor = Number(cliente.total_vencido || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const texto = encodeURIComponent(`Olá ${cliente.nome}, tudo bem? Sou o ${usuarioLogado?.nome} da Pinhaisnet. Identificamos uma pendência no valor de ${valor}. Como podemos ajudar para regularizar?`);
    
    if (num) {
      window.open(`https://web.whatsapp.com/send?phone=${num}&text=${texto}`, '_blank');
    } else {
      window.open(`https://web.whatsapp.com/send?text=${texto}`, '_blank');
    }
  };

  const exportarParaCSV = () => {
    const cabecalho = "Codigo,Nome,Valor Devedor,Dias Atraso,Status\n";
    const linhas = clientes.map(c => `"${c.codigo}","${c.nome}","${c.total_vencido}","${c.dias_atraso}","${c.status_conexao}"`).join("\n");
    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Pinhaisnet_NexusCob_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
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

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    if (!usuarioParaAlterarSenha || !novaSenhaInput) return alert('Digite a nova senha.');
    try {
      await axios.put(`${API_URL}/api/usuarios/${usuarioParaAlterarSenha.id}/senha`, { novaSenha: novaSenhaInput });
      alert(`Senha do usuário ${usuarioParaAlterarSenha.nome} alterada com sucesso!`);
      setUsuarioParaAlterarSenha(null);
      setNovaSenhaInput('');
      carregarDados();
    } catch (err) {
      alert('Erro ao alterar senha do usuário.');
    }
  };

  const handleCadastrarAgendamento = async (e) => {
    e.preventDefault();
    if (!novoAgendamento.cliente_nome || !novoAgendamento.data_retorno) {
      return alert('Selecione o Cliente e a Data do Retorno.');
    }

    const opEncontrado = usuarios.find(u => u.id === Number(novoAgendamento.usuario_id));
    const opNome = opEncontrado ? opEncontrado.nome : (usuarioLogado?.nome || 'A definir');

    try {
      await axios.post(`${API_URL}/api/agenda`, {
        ...novoAgendamento,
        usuario_nome: opNome
      });
      alert('Retorno agendado com sucesso!');
      setNovoAgendamento({ cliente_nome: '', usuario_id: '', data_retorno: '', observacao: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao agendar retorno.');
    }
  };

  const handleConcluirAgendamento = async (id) => {
    try {
      await axios.put(`${API_URL}/api/agenda/${id}/concluir`);
      setAgendamentos(agendamentos.map(a => a.id === id ? { ...a, concluido: true } : a));
    } catch (err) {
      alert('Erro ao concluir compromisso.');
    }
  };

  const handleExcluirAgendamento = async (id) => {
    if (!window.confirm('Deseja excluir este agendamento?')) return;
    try {
      await axios.delete(`${API_URL}/api/agenda/${id}`);
      setAgendamentos(agendamentos.filter(a => a.id !== id));
    } catch (err) {
      alert('Erro ao excluir agendamento.');
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
      setFormManual({ codigo: '', nome: '', telefone: '', total_vencido: '', opcao_atraso: '30' });
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
      setNovoUsuario({ nome: '', email: '', cargo: 'COBRADOR', senha: '' });
      carregarDados();
      setSubAbaAdmin('usuarios');
    } catch (err) {
      alert('Erro ao cadastrar usuário.');
    }
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '';
    try {
      const date = new Date(dataIso);
      if (isNaN(date.getTime())) return '';
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const hora = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} ${hora}:${min}`;
    } catch (e) {
      return '';
    }
  };

  const hojeStr = new Date().toISOString().slice(0, 10);
  const retornosHoje = agendamentos.filter(a => !a.concluido && a.data_retorno && a.data_retorno.startsWith(hojeStr));

  const clientesFiltrados = clientes.filter(c => {
    const dias = Number(c.dias_atraso || 0);
    const status = String(c.status_conexao || '').toLowerCase();

    if (filtroAtraso === '30') return dias >= 1 && dias <= 30 && status !== 'cancelado';
    if (filtroAtraso === '60') return dias >= 31 && dias <= 60 && status !== 'cancelado';
    if (filtroAtraso === '90') return dias >= 61 && status !== 'cancelado';
    if (filtroAtraso === 'CANCELADOS') return status === 'cancelado';
    return true;
  });

  const clientesBuscaFicha = clientes.filter(c => {
    if (!buscaClienteFicha) return true;
    const termo = buscaClienteFicha.toLowerCase();
    return String(c.nome || '').toLowerCase().includes(termo) || String(c.codigo || '').toLowerCase().includes(termo);
  });

  const scriptsFiltrados = scripts.filter(s => {
    if (filtroScriptCategoria === 'TODOS') return true;
    return String(s.categoria) === filtroScriptCategoria;
  });

  const agendamentosFiltrados = agendamentos.filter(a => {
    if (filtroAgendaUsuario === 'TODOS') return true;
    return String(a.usuario_id) === String(filtroAgendaUsuario);
  });

  if (!usuarioLogado) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1E36', fontFamily: 'system-ui, sans-serif' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: '#1D3557', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>
              <Zap size={32} color="#E63946" /> NEXUS COB
            </div>
            <div style={{ color: '#E63946', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px' }}>PINHAISNET</div>
            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: '6px' }}>Gestão Inteligente de Cobranças</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 'bold' }}>E-mail</label>
              <input 
                type="email" 
                placeholder="admin@pinhaisnet.com.br" 
                value={emailLogin} 
                onChange={e => setEmailLogin(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #457B9D', backgroundColor: '#0B1E36', color: '#fff', marginTop: '4px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 'bold' }}>Senha</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={senhaLogin} 
                onChange={e => setSenhaLogin(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #457B9D', backgroundColor: '#0B1E36', color: '#fff', marginTop: '4px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          </div>

          <button type="submit" style={{ padding: '14px', backgroundColor: '#E63946', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            Entrar no Nexus Cob <ArrowRight size={18} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f1f5f9', overflow: 'hidden', margin: 0, padding: 0 }}>
      {/* SIDEBAR PALETA PINHAISNET AZUL IMPERIAL (#0B1E36) E VERMELHO (#E63946) */}
      <aside style={{ width: '240px', minWidth: '240px', backgroundColor: '#0B1E36', color: '#f8fafc', padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '15px', boxSizing: 'border-box' }}>
        <div style={{ padding: '0 8px 12px 8px', borderBottom: '1px solid #1D3557' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>
            <Zap size={24} color="#E63946" />
            <span>NEXUS COB</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#E63946', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px' }}>
            PINHAISNET
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>Gestão Inteligente de Cobranças</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'pipeline', label: 'Pipeline / Funis', icon: RefreshCw, adminOnly: false },
            { id: 'agenda', label: 'Agenda / Retornos', icon: CalendarDays, adminOnly: false },
            { id: 'clientes', label: 'Ficha do Cliente (CRM)', icon: Users, adminOnly: false },
            { id: 'scripts', label: 'Scripts de Cobrança', icon: MessageSquare, adminOnly: false },
            { id: 'dashboard', label: 'Dashboard', icon: Home, adminOnly: false },
            { id: 'importar', label: 'Importar / Prévia Excel', icon: Upload, adminOnly: true },
            { id: 'admin', label: 'Administração / Usuários', icon: Shield, adminOnly: true },
            { id: 'relatorios', label: 'Relatórios / Período', icon: BarChart3, adminOnly: false },
          ].map((item) => {
            if (item.adminOnly && !isEspecial) return null;
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
                  backgroundColor: ativo ? '#E63946' : 'transparent',
                  color: ativo ? '#fff' : '#cbd5e1',
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

        <div style={{ padding: '10px 12px', backgroundColor: '#1D3557', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{usuarioLogado.nome}</div>
            <div style={{ fontSize: '0.68rem', color: '#E63946', fontWeight: 'bold' }}>{usuarioLogado.cargo}</div>
          </div>
          <button onClick={() => setUsuarioLogado(null)} title="Sair" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h1 style={{ margin: 0, fontSize: '1.15rem', color: '#0B1E36', fontWeight: 'bold' }}>NEXUS COB — PINHAISNET</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* NOTIFICAÇÃO DE RETORNOS DO DIA */}
            <div onClick={() => setAbaAtiva('agenda')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: retornosHoje.length > 0 ? '#fde8e8' : '#f1f5f9', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${retornosHoje.length > 0 ? '#E63946' : '#cbd5e1'}` }}>
              <Bell size={16} color={retornosHoje.length > 0 ? '#E63946' : '#64748b'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: retornosHoje.length > 0 ? '#E63946' : '#475569' }}>
                {retornosHoje.length > 0 ? `${retornosHoje.length} Retornos Hoje!` : 'Sem pendências hoje'}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="#059669" /> Operador: <span style={{ color: '#1D3557' }}>{usuarioLogado.nome}</span> ({usuarioLogado.cargo})
            </div>
          </div>
        </header>

        {/* FUNIL KANBAN */}
        {abaAtiva === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={16} color="#1D3557" /> Filtrar Lista:
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
                    backgroundColor: filtroAtraso === f.id ? '#1D3557' : '#f1f5f9',
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
                      {clientesNoEstagio.map(cli => {
                        const dataFormatada = formatarData(cli.atualizado_em || cli.criado_em);
                        return (
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); abrirWhatsApp(cli); }}
                                  title="Chamar no WhatsApp"
                                  style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}>
                                  <MessageCircle size={18} />
                                </button>
                                {isEspecial && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleExcluirCliente(cli.id); }}
                                    title="Excluir do Funil"
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>ID/Contrato: {cli.codigo || 'CLI-001'}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#E63946', marginTop: '4px' }}>
                              R$ {Number(cli.total_vencido || 0).toFixed(2)}
                            </div>

                            <div style={{ fontSize: '0.7rem', color: '#1D3557', marginTop: '6px', backgroundColor: '#f0f4f8', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div>👤 Movido por: {cli.operador_nome || usuarioLogado.nome}</div>
                              {dataFormatada && (
                                <div style={{ color: '#64748b', fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Clock size={11} color="#1D3557" /> {dataFormatada}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              {estagio.id > 1 && (
                                <button onClick={(e) => { e.stopPropagation(); moverEstagio(cli.id, estagio.id - 1); }} style={{ padding: '3px 7px', fontSize: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff' }}>
                                  ← Voltar
                                </button>
                              )}
                              {estagio.id < 7 && (
                                <button onClick={(e) => { e.stopPropagation(); moverEstagio(cli.id, estagio.id + 1); }} style={{ padding: '3px 7px', fontSize: '0.7rem', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                  Avançar →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FICHA DO CLIENTE + CRM ATENDIMENTO */}
        {abaAtiva === 'clientes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
            <form onSubmit={handleCadastrarClienteManual} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D3557', fontWeight: 'bold', fontSize: '1rem' }}>
                <UserPlus size={20} /> Cadastrar Cliente Manual
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>ID / Código</label>
                <input 
                  type="text" 
                  placeholder="Ex: 01 ou CLI-001" 
                  value={formManual.codigo} 
                  onChange={e => setFormManual({ ...formManual, codigo: e.target.value })}
                  style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '3px', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '3px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  placeholder="(41) 99999-9999" 
                  value={formManual.telefone} 
                  onChange={e => setFormManual({ ...formManual, telefone: e.target.value })}
                  style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '3px', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '3px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Faixa / Situação do Atraso</label>
                <select 
                  value={formManual.opcao_atraso} 
                  onChange={e => setFormManual({ ...formManual, opcao_atraso: e.target.value })}
                  style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '3px', boxSizing: 'border-box' }}>
                  <option value="30">Devedor 30 Dias</option>
                  <option value="60">Devedor 60 Dias</option>
                  <option value="90">Devedor 90+ Dias</option>
                  <option value="CANCELADOS">Cliente Cancelado</option>
                </select>
              </div>

              <button type="submit" style={{ padding: '11px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>
                Salvar e Adicionar ao Funil
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0B1E36' }}>📄 Ficha do Cliente & CRM Atendimentos</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total no Banco: <strong>{clientes.length}</strong></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1D3557', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={16} /> Pesquisar Cliente no Banco:
                </label>
                <input 
                  type="text" 
                  placeholder="Digite nome ou ID (ex: 7877 ou Paulino)..." 
                  value={buscaClienteFicha}
                  onChange={e => setBuscaClienteFicha(e.target.value)}
                  style={{ padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '2px' }}>
                  <select 
                    value={clienteSelecionado?.id || ''} 
                    onChange={(e) => setClienteSelecionado(clientes.find(c => c.id === Number(e.target.value)))}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', flex: 1 }}>
                    {clientesBuscaFicha.map(c => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.nome} (R$ {Number(c.total_vencido || 0).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {clienteSelecionado ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#1D3557' }}>Dados Cadastrais</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>ID / Código:</strong> {clienteSelecionado.codigo}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}><strong>Nome:</strong> {clienteSelecionado.nome}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}><strong>Telefone:</strong> {clienteSelecionado.telefone || 'Não informado'}</p>
                      
                      <button 
                        onClick={() => abrirWhatsApp(clienteSelecionado)} 
                        style={{ marginTop: '10px', padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageCircle size={15} /> Disparar WhatsApp Web
                      </button>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#E63946' }}>Situação Financeira</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Valor Total Devedor:</strong> <span style={{ color: '#E63946', fontWeight: 'bold' }}>R$ {Number(clienteSelecionado.total_vencido || 0).toFixed(2)}</span></p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}><strong>Atraso:</strong> {clienteSelecionado.dias_atraso || 30} dias</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}><strong>Estágio:</strong> {ESTAGIOS.find(e => e.id === Number(clienteSelecionado.estagio_id))?.nome || '1º CONTATO'}</p>
                    </div>
                  </div>

                  {/* CAIXA DE CRM HISTÓRICO DE ATENDIMENTOS */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <History size={16} color="#1D3557" /> Histórico de Atendimentos & Conversas (CRM)
                    </h3>

                    <form onSubmit={handleAdicionarObsCrm} style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Registrar nova observação (Ex: Liguei, disse que paga dia 10)..."
                        value={novaObsCrm}
                        onChange={e => setNovaObsCrm(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                      <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Send size={14} /> Registrar
                      </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {historicoCliente.length === 0 ? (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nenhuma observação registrada ainda para este cliente.</span>
                      ) : (
                        historicoCliente.map(h => (
                          <div key={h.id} style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #1D3557', fontSize: '0.82rem' }}>
                            <div style={{ fontWeight: 'bold', color: '#0B1E36', display: 'flex', justifyContent: 'space-between' }}>
                              <span>👤 {h.usuario_nome}</span>
                              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 'normal' }}>{formatarData(h.criado_em)}</span>
                            </div>
                            <div style={{ color: '#334155', marginTop: '3px' }}>{h.observacao}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : <p style={{ color: '#64748b' }}>Nenhum cliente selecionado.</p>}
            </div>
          </div>
        )}

        {/* AGENDA */}
        {abaAtiva === 'agenda' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
            <form onSubmit={handleCadastrarAgendamento} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D3557', fontWeight: 'bold', fontSize: '1rem' }}>
                <CalendarDays size={20} /> Agendar Retorno de Cobrança
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Cliente *</label>
                <select 
                  value={novoAgendamento.cliente_nome}
                  onChange={e => setNovoAgendamento({ ...novoAgendamento, cliente_nome: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                  <option value="">Selecione o Cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={`${c.codigo} - ${c.nome}`}>{c.codigo} - {c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Operador Responsável *</label>
                <select 
                  value={novoAgendamento.usuario_id}
                  onChange={e => setNovoAgendamento({ ...novoAgendamento, usuario_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                  <option value="">{usuarioLogado.nome} (Você mesmo)</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Data e Hora do Retorno *</label>
                <input 
                  type="datetime-local" 
                  value={novoAgendamento.data_retorno}
                  onChange={e => setNovoAgendamento({ ...novoAgendamento, data_retorno: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Observação / Motivo do Agendamento</label>
                <textarea 
                  rows={3}
                  placeholder="Ex: Cliente pediu para ligar após o almoço para confirmar o Pix do acordo."
                  value={novoAgendamento.observacao}
                  onChange={e => setNovoAgendamento({ ...novoAgendamento, observacao: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" style={{ padding: '12px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                Salvar Compromisso na Agenda
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0B1E36' }}>📅 Compromissos e Retornos Agendados</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Ver Agenda do Operador:</span>
                  <select 
                    value={filtroAgendaUsuario} 
                    onChange={e => setFiltroAgendaUsuario(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 'bold', color: '#1D3557' }}>
                    <option value="TODOS">Todos os Operadores</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {agendamentosFiltrados.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nenhum retorno agendado para o operador selecionado.</p>
                ) : (
                  agendamentosFiltrados.map(a => (
                    <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', backgroundColor: a.concluido ? '#f0fdf4' : '#fff', opacity: a.concluido ? 0.75 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {a.cliente_nome}
                          {a.concluido && <span style={{ backgroundColor: '#d1fae5', color: '#059669', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>Concluído</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#1D3557', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> Data do Retorno: {formatarData(a.data_retorno)} | 👤 Operador: {a.usuario_nome}
                        </div>
                        {a.observacao && (
                          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                            "{a.observacao}"
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!a.concluido && (
                          <button onClick={() => handleConcluirAgendamento(a.id)} style={{ padding: '6px 12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.78rem' }}>
                            Marcar como Feito
                          </button>
                        )}
                        <button onClick={() => handleExcluirAgendamento(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCRIPTS DE COBRANÇA */}
        {abaAtiva === 'scripts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
            <form onSubmit={handleCadastrarScript} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D3557', fontWeight: 'bold', fontSize: '1rem' }}>
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

              <button type="submit" style={{ padding: '12px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                Salvar Modelo de Mensagem
              </button>
            </form>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0B1E36' }}>📜 Biblioteca de Scripts Cadastrados</h2>
                
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
                        <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: s.categoria === 'CANCELADOS' ? '#fee2e2' : '#e0f2fe', color: s.categoria === 'CANCELADOS' ? '#E63946' : '#1D3557', fontSize: '0.72rem', fontWeight: 'bold' }}>
                          {s.categoria === 'CANCELADOS' ? 'CANCELADOS' : `${s.categoria} DIAS`}
                        </span>
                        {isEspecial && (
                          <button onClick={() => handleExcluirScript(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-line', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      {s.conteudo}
                    </div>

                    <button 
                      onClick={() => handleCopiarTexto(s.id, s.conteudo)}
                      style={{ padding: '8px 14px', backgroundColor: copiadoId === s.id ? '#059669' : '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
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

        {/* RELATÓRIOS COM EXPORTAÇÃO EXCEL E IMPRESSÃO */}
        {abaAtiva === 'relatorios' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0B1E36' }}>📈 Relatório de Cobrança por Período</h2>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportarParaCSV} style={{ padding: '8px 14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileSpreadsheet size={16} /> Exportar Planilha Excel (.CSV)
                </button>
                <button onClick={() => window.print()} style={{ padding: '8px 14px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Printer size={16} /> Imprimir Relatório PDF
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ backgroundColor: '#0B1E36', color: '#fff' }}>
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
                      <td style={{ padding: '10px', color: '#E63946', fontWeight: 'bold' }}>R$ {Number(c.total_vencido || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>{c.dias_atraso || 30} dias</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#1D3557' }}>
                        {ESTAGIOS.find(e => e.id === Number(c.estagio_id))?.nome || '1º CONTATO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IMPORTAÇÃO DE LISTAS */}
        {abaAtiva === 'importar' && isEspecial && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0B1E36' }}>📥 Importar Lista & Gerar Prévia do Funil</h2>

            {previaClientes.length === 0 ? (
              <form onSubmit={handleGerarPrevia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '40px 0' }}>
                <Upload size={48} color="#1D3557" />
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
                  style={{ padding: '12px 24px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                  {carregando ? 'Processando Planilha...' : 'Gerar Prévia dos Contatos'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f4f8', padding: '12px 16px', borderRadius: '8px', border: '1px solid #1D3557' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1D3557' }}>Definir Categoria para Toda a Lista:</label>
                    <select 
                      onChange={e => {
                        const valor = e.target.value;
                        setPreviaClientes(previaClientes.map(p => ({ ...p, opcao_atraso: valor })));
                      }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #1D3557', fontSize: '0.85rem', fontWeight: 'bold' }}>
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
                    <thead style={{ backgroundColor: '#0B1E36', color: '#fff' }}>
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
                          <td style={{ padding: '10px', color: '#E63946', fontWeight: 'bold' }}>R$ {Number(item.total_vencido || 0).toFixed(2)}</td>
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

        {/* ADMINISTRAÇÃO */}
        {abaAtiva === 'admin' && isEspecial && (
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
              <button 
                onClick={() => setSubAbaAdmin('usuarios')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: subAbaAdmin === 'usuarios' ? '#1D3557' : '#f1f5f9', color: subAbaAdmin === 'usuarios' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> Gerenciar Usuários & Senhas
              </button>

              <button 
                onClick={() => setSubAbaAdmin('cadastrar')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: subAbaAdmin === 'cadastrar' ? '#1D3557' : '#f1f5f9', color: subAbaAdmin === 'cadastrar' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserPlus size={16} /> Cadastrar Novo Usuário
              </button>

              <button 
                onClick={() => setSubAbaAdmin('exclusao')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: subAbaAdmin === 'exclusao' ? '#E63946' : '#f1f5f9', color: subAbaAdmin === 'exclusao' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} /> Exclusão de Listas em Massa
              </button>
            </div>

            {subAbaAdmin === 'usuarios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0B1E36' }}>👥 Usuários Cadastrados no Sistema</h3>

                {usuarioParaAlterarSenha && (
                  <form onSubmit={handleAlterarSenha} style={{ backgroundColor: '#f0f4f8', border: '1px solid #1D3557', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <KeyRound size={20} color="#1D3557" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1D3557' }}>Alterar senha de: {usuarioParaAlterarSenha.nome} ({usuarioParaAlterarSenha.email})</div>
                      <input 
                        type="password" 
                        placeholder="Digite a nova senha..." 
                        value={novaSenhaInput}
                        onChange={e => setNovaSenhaInput(e.target.value)}
                        required
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '250px', marginTop: '4px' }}
                      />
                    </div>
                    <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Nova Senha</button>
                    <button type="button" onClick={() => setUsuarioParaAlterarSenha(null)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                  </form>
                )}

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: '#0B1E36', color: '#fff' }}>
                      <tr>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>E-mail</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Cargo / Perfil</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.nome}</td>
                          <td style={{ padding: '10px' }}>{u.email}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: u.cargo === 'ADMINISTRADOR' ? '#dbeafe' : '#f1f5f9', color: u.cargo === 'ADMINISTRADOR' ? '#1d4ed8' : '#475569', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {u.cargo}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button 
                              onClick={() => { setUsuarioParaAlterarSenha(u); setNovaSenhaInput(''); }}
                              style={{ padding: '4px 10px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <KeyRound size={12} /> Alterar Senha
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subAbaAdmin === 'cadastrar' && (
              <form onSubmit={handleCadastrarUsuario} style={{ maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0B1E36' }}>👤 Cadastrar Novo Usuário</h3>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Nome Completo *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Vitoria Rodrigues" 
                    value={novoUsuario.nome} 
                    onChange={e => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                    required 
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>E-mail de Acesso *</label>
                  <input 
                    type="email" 
                    placeholder="vitoria@pinhaisnet.com.br" 
                    value={novoUsuario.email} 
                    onChange={e => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                    required 
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Senha Inicial *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={novoUsuario.senha} 
                    onChange={e => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                    required 
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Perfil / Cargo no Sistema</label>
                  <select 
                    value={novoUsuario.cargo} 
                    onChange={e => setNovoUsuario({ ...novoUsuario, cargo: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                    <option value="COBRADOR">COBRADOR / OPERADOR (Acesso Restrito)</option>
                    <option value="SUPERVISOR">SUPERVISOR (Acesso Total)</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR (Acesso Total)</option>
                  </select>
                </div>

                <button type="submit" style={{ padding: '12px', backgroundColor: '#1D3557', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>
                  Salvar e Criar Acesso
                </button>
              </form>
            )}

            {subAbaAdmin === 'exclusao' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#E63946' }}>🗑️ Exclusão em Massa de Clientes e Listas</h3>
                  {selecionadosExclusao.length > 0 && (
                    <button onClick={handleExcluirEmMassa} style={{ padding: '8px 14px', backgroundColor: '#E63946', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Trash2 size={16} /> Excluir {selecionadosExclusao.length} Selecionados
                    </button>
                  )}
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: '#0B1E36', color: '#fff' }}>
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
                          <td style={{ padding: '10px', color: '#E63946', fontWeight: 'bold' }}>R$ {Number(c.total_vencido || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
