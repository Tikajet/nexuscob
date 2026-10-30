import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Wifi, Shield, Trash2, ArrowRight, Sun, Moon, Filter,
  Award, ChevronDown, ChevronRight, Upload, Edit3, HeartHandshake, 
  PlusCircle, Bell, Wrench, BookOpen, CheckCircle, TrendingUp, Phone, UserPlus
} from 'lucide-react';

const API_URL = '/api';

const ESTAGIOS_COBRANCA = [
  { id: 1, nome: 'Novos Contatos', cor: 'border-blue-500' },
  { id: 2, nome: '1ª Tentativa', cor: 'border-cyan-500' },
  { id: 3, nome: '2ª Tentativa', cor: 'border-indigo-500' },
  { id: 4, nome: '3ª Tentativa', cor: 'border-purple-500' },
  { id: 5, nome: 'Em Contato', cor: 'border-amber-500' },
  { id: 6, nome: 'Acordo Realizado', cor: 'border-emerald-500' },
  { id: 7, nome: 'Acordo Pago', cor: 'border-green-600' },
  { id: 8, nome: 'Recusa Contato', cor: 'border-rose-500' }
];

const ESTAGIOS_POS_VENDA = [
  { id: 1, nome: 'Venda Instalada', cor: 'border-blue-500' },
  { id: 2, nome: 'Acompanhamento (15d)', cor: 'border-indigo-500' },
  { id: 3, nome: 'Acompanhamento (30d)', cor: 'border-amber-500' },
  { id: 4, nome: 'Satisfação (CSAT)', cor: 'border-emerald-500' }
];

const ESTAGIOS_OS = [
  { id: 1, nome: 'Em Aberto', cor: 'border-amber-500' },
  { id: 2, nome: 'Acompanhar (5d)', cor: 'border-blue-500' },
  { id: 3, nome: 'Acompanhar Qualidade', cor: 'border-purple-500' },
  { id: 4, nome: 'Resolvido', cor: 'border-emerald-500' }
];

const VERSICULOS_BIBLICOS = [
  "\"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti.\" — Números 6:24-25",
  "\"Tudo posso naquele que me fortalece.\" — Filipenses 4:13",
  "\"O Senhor é o meu pastor; nada me faltará.\" — Salmos 23:1",
  "\"Confie no Senhor de todo o seu coração e não se apoie no seu próprio entendimento.\" — Provérbios 3:5"
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [temaEscuro, setTemaEscuro] = useState(() => localStorage.getItem('nexus_theme') === 'dark');
  const [exibirPopup, setExibirPopup] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState('cobranca');
  const [menuCobranca, setMenuCobranca] = useState(true);
  const [subAbaCobranca, setSubAbaCobranca] = useState('pipeline');
  const [menuPosVenda, setMenuPosVenda] = useState(false);
  const [subAbaPosVenda, setSubAbaPosVenda] = useState('funil');
  const [menuOS, setMenuOS] = useState(false);
  const [subAbaOS, setSubAbaOS] = useState('pipeline');
  const [menuAdmin, setMenuAdmin] = useState(false);
  const [subAbaAdmin, setSubAbaAdmin] = useState('usuarios');

  const [clientes, setClientes] = useState([]);
  const [posVendas, setPosVendas] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);
  const [contatosAtivos, setContatosAtivos] = useState([]);
  const [listaUpgrade, setListaUpgrade] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [rankingCobranca, setRankingCobranca] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [tipoImportacao, setTipoImportacao] = useState('cobranca');
  const [categoriaCobranca, setCategoriaCobranca] = useState('30');
  const [previaPlanilha, setPreviaPlanilha] = useState([]);
  const [chatMensagens, setChatMensagens] = useState([]);
  const [novaMsgChat, setNovaMsgChat] = useState('');

  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [filtroAtrasoPipeline, setFiltroAtrasoPipeline] = useState('todos');

  const [novoCliente, setNovoCliente] = useState({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
  const [clienteEditando, setClienteEditando] = useState(null);
  const [novoPosVenda, setNovoPosVenda] = useState({ codigo: '', nome: '', telefone: '', plano: 'Fibra 500MB', satisfacao: '5', vendedor_id: '', observacoes: '' });
  const [novoContato, setNovoContato] = useState({ nome: '', telefone: '', origem: 'Cobranca' });
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', cargo: 'COBRADOR', senha: '' });
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [novaOS, setNovaOS] = useState({ cliente_codigo: '', cliente_nome: '', problema: '', tipo_ocorrencia: 'Suporte Técnico', tecnico_responsavel: '' });
  const [novoScript, setNovoScript] = useState({ titulo: '', tipo: 'cobranca', conteudo: '' });
  const [novoAgendamento, setNovoAgendamento] = useState({ cliente_nome: '', data_retorno: '', observacao: '', tipo: 'cobranca' });

  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });

  useEffect(() => {
    localStorage.setItem('nexus_theme', temaEscuro ? 'dark' : 'light');
  }, [temaEscuro]);

  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [usuario, abaAtiva, subAbaCobranca, subAbaPosVenda, subAbaOS, subAbaAdmin]);

  const carregarDados = () => {
    fetch(`${API_URL}/clientes`).then(r => r.json()).then(data => setClientes(data || [])).catch(() => {});
    fetch(`${API_URL}/pos-venda`).then(r => r.json()).then(data => setPosVendas(data || [])).catch(() => {});
    fetch(`${API_URL}/os`).then(r => r.json()).then(data => setOrdensServico(data || [])).catch(() => {});
    fetch(`${API_URL}/vendas/contatos-ativos`).then(r => r.json()).then(data => setContatosAtivos(data || [])).catch(() => {});
    fetch(`${API_URL}/vendas/upgrade`).then(r => r.json()).then(data => setListaUpgrade(data || [])).catch(() => {});
    fetch(`${API_URL}/usuarios`).then(r => r.json()).then(data => setUsuarios(data || [])).catch(() => {});
    fetch(`${API_URL}/dashboard/ranking-cobranca`).then(r => r.json()).then(data => setRankingCobranca(data || [])).catch(() => {});
    carregarAgenda();
    carregarScripts();
    carregarChat();
  };

  const carregarAgenda = () => {
    let tipo = abaAtiva === 'pos-venda' ? 'vendas' : 'cobranca';
    fetch(`${API_URL}/agenda?tipo=${tipo}`).then(r => r.json()).then(data => setAgenda(data || [])).catch(() => {});
  };

  const carregarScripts = () => {
    let tipo = abaAtiva === 'pos-venda' ? 'vendas' : 'cobranca';
    fetch(`${API_URL}/scripts?tipo=${tipo}`).then(r => r.json()).then(data => setScripts(data || [])).catch(() => {});
  };

  const carregarChat = () => {
    let setor = abaAtiva === 'pos-venda' ? 'vendas' : 'cobranca';
    fetch(`${API_URL}/chat/mensagens?setor=${setor}`).then(r => r.json()).then(data => setChatMensagens(data || [])).catch(() => {});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLogin, senha: senhaLogin })
      });
      const data = await res.json();
      if (data.sucesso) {
        setUsuario(data.usuario);
        setExibirPopup(true);
      }
    } catch (err) {
      alert('Erro ao realizar login.');
    }
  };

  const moverEstagioCliente = (clienteId, novoEstagioId) => {
    if (novoEstagioId === 6) {
      setModalAcordo({ exibir: true, clienteId, valor: '', parcelas: '1' });
      return;
    }
    fetch(`${API_URL}/clientes/${clienteId}/estagio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estagio_id: novoEstagioId, usuario_nome: usuario.nome, usuario_id: usuario.id })
    }).then(() => carregarDados());
  };

  const moverEstagioPosVenda = (id, novoEstagioId) => {
    fetch(`${API_URL}/pos-venda/${id}/estagio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estagio_id: novoEstagioId })
    }).then(() => carregarDados());
  };

  const moverEstagioOS = (id, novoEstagioId) => {
    fetch(`${API_URL}/os/${id}/estagio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estagio_id: novoEstagioId })
    }).then(() => carregarDados());
  };

  const handleConfirmarAcordo = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/clientes/${modalAcordo.clienteId}/estagio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estagio_id: 6,
        usuario_nome: usuario.nome,
        usuario_id: usuario.id,
        valor_acordo: modalAcordo.valor,
        parcelas_acordo: modalAcordo.parcelas
      })
    }).then(() => {
      setModalAcordo({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
      carregarDados();
    });
  };

  const handleSalvarCliente = (e) => {
    e.preventDefault();
    const url = clienteEditando ? `${API_URL}/clientes/${clienteEditando.id}` : `${API_URL}/clientes/manual`;
    const method = clienteEditando ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCliente)
    }).then(r => r.json()).then(data => {
      if (data.sucesso) {
        alert(clienteEditando ? 'Cliente atualizado!' : 'Cliente cadastrado!');
        setNovoCliente({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
        setClienteEditando(null);
        carregarDados();
      }
    });
  };

  const handleExcluirCliente = (id) => {
    if (confirm('Deseja excluir este cliente?')) {
      fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleSalvarPosVenda = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/pos-venda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoPosVenda)
    }).then(r => r.json()).then(data => {
      if (data.sucesso) {
        alert('Cliente adicionado ao Pós-Venda!');
        setNovoPosVenda({ codigo: '', nome: '', telefone: '', plano: 'Fibra 500MB', satisfacao: '5', vendedor_id: '', observacoes: '' });
        carregarDados();
      }
    });
  };

  const handleExcluirPosVenda = (id) => {
    if (confirm('Deseja excluir o registro do Pós-Venda?')) {
      fetch(`${API_URL}/pos-venda/${id}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleSalvarContato = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/vendas/contatos-ativos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoContato)
    }).then(() => {
      alert('Contato salvo!');
      setNovoContato({ nome: '', telefone: '', origem: 'Cobranca' });
      carregarDados();
    });
  };

  const handleExcluirContato = (id) => {
    if (confirm('Deseja excluir o contato?')) {
      fetch(`${API_URL}/vendas/contatos-ativos/${id}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleSalvarUsuario = (e) => {
    e.preventDefault();
    const url = usuarioEditando ? `${API_URL}/usuarios/${usuarioEditando.id}` : `${API_URL}/usuarios`;
    const method = usuarioEditando ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioEditando || novoUsuario)
    }).then(() => {
      alert('Usuário salvo!');
      setNovoUsuario({ nome: '', email: '', cargo: 'COBRADOR', senha: '' });
      setUsuarioEditando(null);
      carregarDados();
    });
  };

  const handleExcluirUsuario = (id) => {
    if (confirm('Deseja excluir este usuário?')) {
      fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleSalvarOS = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/os`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaOS)
    }).then(() => {
      alert('Ordem de Serviço registrada!');
      setNovaOS({ cliente_codigo: '', cliente_nome: '', problema: '', tipo_ocorrencia: 'Suporte Técnico', tecnico_responsavel: '' });
      carregarDados();
    });
  };

  const handleSalvarAgendamento = (e) => {
    e.preventDefault();
    let tipo = abaAtiva === 'pos-venda' ? 'vendas' : 'cobranca';
    fetch(`${API_URL}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...novoAgendamento, usuario_id: usuario.id, usuario_nome: usuario.nome, tipo })
    }).then(() => {
      alert('Agendado com sucesso!');
      setNovoAgendamento({ cliente_nome: '', data_retorno: '', observacao: '', tipo });
      carregarAgenda();
    });
  };

  const handleSalvarScript = (e) => {
    e.preventDefault();
    let tipo = abaAtiva === 'pos-venda' ? 'vendas' : 'cobranca';
    fetch(`${API_URL}/scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...novoScript, tipo })
    }).then(() => {
      alert('Script cadastrado!');
      setNovoScript({ titulo: '', tipo, conteudo: '' });
      carregarScripts();
    });
  };

  const handleCarregarPreviaPlanilha = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('arquivo', file);
    fetch(`${API_URL}/admin/previa-planilha`, { method: 'POST', body: formData })
      .then(r => r.json())
      .then(data => {
        if (data.sucesso) setPreviaPlanilha(data.dados);
        else alert('Erro ao processar a planilha.');
      });
  };

  const handleConfirmarImportacaoAdmin = () => {
    if (previaPlanilha.length === 0) return;
    fetch(`${API_URL}/admin/confirmar-importacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: tipoImportacao, categoria_cobranca: categoriaCobranca, lista: previaPlanilha })
    }).then(() => {
      alert(`${previaPlanilha.length} registros importados com sucesso!`);
      setPreviaPlanilha([]);
      carregarDados();
    });
  };

  const handleEnviarChat = (e) => {
    e.preventDefault();
    if (!novaMsgChat.trim()) return;
    let setor = abaAtiva === 'pos-venda' ? 'vendas' : 'cobranca';
    fetch(`${API_URL}/chat/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remetente_id: usuario.id,
        remetente_nome: usuario.nome,
        mensagem: novaMsgChat,
        setor
      })
    }).then(() => {
      setNovaMsgChat('');
      carregarChat();
    });
  };

  const totalEmCobranca = clientes.reduce((acc, c) => acc + parseFloat(c.total_vencido || 0), 0);
  const totalAcordos = clientes.reduce((acc, c) => acc + parseFloat(c.valor_acordo || 0), 0);

  const clientesFiltradosPipeline = clientes.filter(c => {
    const combinaBusca = c.nome?.toLowerCase().includes(buscaPipeline.toLowerCase()) || c.codigo?.toLowerCase().includes(buscaPipeline.toLowerCase());
    if (!combinaBusca) return false;
    if (filtroAtrasoPipeline === '30') return c.dias_atraso === 30;
    if (filtroAtrasoPipeline === '60') return c.dias_atraso === 60;
    if (filtroAtrasoPipeline === '90') return c.dias_atraso === 90;
    if (filtroAtrasoPipeline === 'cancelados') return c.dias_atraso >= 120 || c.status_conexao === 'Cancelado';
    return true;
  });

  if (!usuario) {
    return (
      <div className="min-h-screen bg-[#101B35] flex flex-col justify-center items-center p-4 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-[#17243A] border border-[#273750] p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-[#176BFF] text-white rounded-2xl flex items-center justify-center font-black text-2xl mb-3 shadow-lg shadow-[#176BFF]/30">
              N
            </div>
            <h1 className="text-2xl font-black tracking-wider text-white">NEXUS <span className="text-[#00C2FF]">COB</span></h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Inteligência financeira conectada a resultados.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">E-mail do Operador</label>
              <input type="email" required value={emailLogin} onChange={e => setEmailLogin(e.target.value)} placeholder="operador@nexus.com.br" className="w-full bg-[#0B1220] border border-[#273750] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#176BFF] text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Senha de Acesso</label>
              <input type="password" required value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} placeholder="••••••••" className="w-full bg-[#0B1220] border border-[#273750] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#176BFF] text-white" />
            </div>
            <button type="submit" className="w-full bg-[#176BFF] hover:bg-[#145ce0] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider">
              Acessar Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${temaEscuro ? 'dark bg-[#0B1220] text-[#F4F7FB]' : 'bg-[#F4F7FB] text-[#17233B]'} flex font-sans`}>
      {exibirPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${temaEscuro ? 'bg-[#17243A] border-[#273750]' : 'bg-white border-[#E5EAF2]'} border p-8 rounded-3xl max-w-lg w-full shadow-2xl text-center space-y-6`}>
            <div className="w-16 h-16 bg-[#176BFF]/10 text-[#176BFF] rounded-full flex items-center justify-center mx-auto border border-[#176BFF]/30">
              <BookOpen className="w-8 h-8"/>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Bem-vindo, {usuario.nome}!</h3>
              <p className="text-slate-500 dark:text-slate-400 italic text-sm leading-relaxed">
                {VERSICULOS_BIBLICOS[Math.floor(Math.random() * VERSICULOS_BIBLICOS.length)]}
              </p>
            </div>
            <button onClick={() => setExibirPopup(false)} className="bg-[#176BFF] text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-[#145ce0] transition-all">
              Iniciar Trabalho
            </button>
          </div>
        </div>
      )}

      {modalAcordo.exibir && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${temaEscuro ? 'bg-[#17243A] border-[#273750]' : 'bg-white border-[#E5EAF2]'} border p-6 rounded-3xl max-w-md w-full space-y-4`}>
            <h3 className="text-lg font-bold text-[#176BFF]">Registrar Acordo Realizado</h3>
            <form onSubmit={handleConfirmarAcordo} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Valor Final do Acordo (R$)</label>
                <input type="text" required placeholder="Ex: 250,00" value={modalAcordo.valor} onChange={e => setModalAcordo({...modalAcordo, valor: e.target.value})} className="w-full bg-slate-100 dark:bg-[#0B1220] border border-slate-300 dark:border-[#273750] p-3 rounded-xl focus:outline-none focus:border-[#176BFF]" />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Quantidade de Parcelas</label>
                <input type="number" min="1" max="12" value={modalAcordo.parcelas} onChange={e => setModalAcordo({...modalAcordo, parcelas: e.target.value})} className="w-full bg-slate-100 dark:bg-[#0B1220] border border-slate-300 dark:border-[#273750] p-3 rounded-xl focus:outline-none focus:border-[#176BFF]" />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalAcordo({ exibir: false, clienteId: null, valor: '', parcelas: '1' })} className="w-1/2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="w-1/2 bg-[#176BFF] text-white py-3 rounded-xl font-bold hover:bg-[#145ce0]">Salvar Acordo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className="w-64 bg-[#101B35] text-white flex flex-col justify-between p-4 border-r border-slate-800 space-y-6">
        <div className="space-y-6">
          <div className="px-3 py-2 flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#176BFF] text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
              N
            </div>
            <div>
              <span className="font-black text-lg tracking-wide text-white">NEXUS <span className="text-[#00C2FF]">COB</span></span>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Inteligência Financeira</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button onClick={() => setAbaAtiva('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'dashboard' ? 'bg-[#176BFF] text-white font-bold shadow-lg shadow-[#176BFF]/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <BarChart2 className="w-4 h-4"/>
              <span>Visão Geral</span>
            </button>

            <div>
              <button onClick={() => setMenuCobranca(!menuCobranca)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'cobranca' ? 'bg-slate-800 text-[#00C2FF]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <div className="flex items-center space-x-3"><Users className="w-4 h-4"/><span>Cobrança</span></div>
                {menuCobranca ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuCobranca && (
                <div className="ml-4 mt-1 space-y-1 text-[11px]">
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('pipeline'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'pipeline' && abaAtiva === 'cobranca' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Pipeline</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'cadastro' && abaAtiva === 'cobranca' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Cadastrar Cliente</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('agenda'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'agenda' && abaAtiva === 'cobranca' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Agenda</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('scripts'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'scripts' && abaAtiva === 'cobranca' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Scripts</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('contatos'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'contatos' && abaAtiva === 'cobranca' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Contatos</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('chat'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'chat' && abaAtiva === 'cobranca' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Chat Cobrança</button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setMenuPosVenda(!menuPosVenda)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pos-venda' ? 'bg-slate-800 text-[#00C2FF]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <div className="flex items-center space-x-3"><HeartHandshake className="w-4 h-4"/><span>Pós-Vendas</span></div>
                {menuPosVenda ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuPosVenda && (
                <div className="ml-4 mt-1 space-y-1 text-[11px]">
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('funil'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'funil' && abaAtiva === 'pos-venda' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Pipeline Vendas/Pós</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'cadastro' && abaAtiva === 'pos-venda' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Novo Cliente</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('contatos_ativos'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'contatos_ativos' && abaAtiva === 'pos-venda' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Contatos Ativos</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('upgrade'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'upgrade' && abaAtiva === 'pos-venda' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Lista Up-Grade</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('agenda'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'agenda' && abaAtiva === 'pos-venda' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Agenda Vendas</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('scripts'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'scripts' && abaAtiva === 'pos-venda' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Scripts Vendas</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('chat'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'chat' && abaAtiva === 'pos-venda' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Chat Vendas</button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setMenuOS(!menuOS)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'os' ? 'bg-slate-800 text-[#00C2FF]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <div className="flex items-center space-x-3"><Wrench className="w-4 h-4"/><span>Qualidade (O.S.)</span></div>
                {menuOS ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuOS && (
                <div className="ml-4 mt-1 space-y-1 text-[11px]">
                  <button onClick={() => { setAbaAtiva('os'); setSubAbaOS('pipeline'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaOS === 'pipeline' && abaAtiva === 'os' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Pipeline O.S.</button>
                  <button onClick={() => { setAbaAtiva('os'); setSubAbaOS('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaOS === 'cadastro' && abaAtiva === 'os' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Nova O.S.</button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setMenuAdmin(!menuAdmin)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'admin' ? 'bg-slate-800 text-[#00C2FF]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <div className="flex items-center space-x-3"><Settings className="w-4 h-4"/><span>Administração</span></div>
                {menuAdmin ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuAdmin && (
                <div className="ml-4 mt-1 space-y-1 text-[11px]">
                  <button onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('usuarios'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaAdmin === 'usuarios' && abaAtiva === 'admin' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Usuários</button>
                  <button onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('listas'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaAdmin === 'listas' && abaAtiva === 'admin' ? 'text-[#00C2FF] font-bold bg-[#176BFF]/10' : 'text-slate-400 hover:text-white'}`}>Importar Listas</button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <button onClick={() => setTemaEscuro(!temaEscuro)} className="w-full flex items-center justify-center space-x-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs transition-all font-semibold">
            {temaEscuro ? <Sun className="w-4 h-4 text-amber-400"/> : <Moon className="w-4 h-4 text-[#00C2FF]"/>}
            <span>{temaEscuro ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-white">{usuario.nome}</p>
              <p className="text-[10px] text-slate-400">{usuario.cargo}</p>
            </div>
            <button onClick={() => setUsuario(null)} className="text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        <header className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#273750]">
          <div>
            <h2 className="text-xl font-extrabold capitalize text-[#17233B] dark:text-[#F4F7FB]">
              {abaAtiva === 'dashboard' ? 'Visão Geral' : abaAtiva}
            </h2>
            <p className="text-xs text-[#718096] dark:text-slate-400">Acompanhamento e gestão em tempo real</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="text" placeholder="Pesquisar..." value={buscaPipeline} onChange={e => setBuscaPipeline(e.target.value)} className="w-full bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] rounded-2xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#176BFF]" />
            </div>

            <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('cadastro'); }} className="bg-[#176BFF] hover:bg-[#145ce0] text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-[#176BFF]/20 transition-all">
              <PlusCircle className="w-4 h-4"/>
              <span>Novo Cliente</span>
            </button>

            <div className="w-9 h-9 rounded-2xl bg-[#176BFF]/10 text-[#176BFF] font-black border border-[#176BFF]/30 flex items-center justify-center text-sm">
              {usuario.nome.charAt(0)}
            </div>
          </div>
        </header>

        {abaAtiva === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#718096] dark:text-slate-400">Total em Cobrança</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#176BFF] flex items-center justify-center font-bold">R$</div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-[#17233B] dark:text-white">R$ {totalEmCobranca.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{clientes.length} clientes na carteira</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#718096] dark:text-slate-400">Acordos Fechados</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#16A36A] flex items-center justify-center">
                    <CheckCircle className="w-4 h-4"/>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-[#16A36A]">R$ {totalAcordos.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Recuperados pela equipe</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#718096] dark:text-slate-400">Chamados O.S.</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Wrench className="w-4 h-4"/>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-[#17233B] dark:text-white">{ordensServico.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Atendimentos em suporte</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#718096] dark:text-slate-400">Base Ativa Pós</span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-[#00C2FF] flex items-center justify-center">
                    <Users className="w-4 h-4"/>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-[#17233B] dark:text-white">{posVendas.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Clientes acompanhados</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-[#17233B] dark:text-white">Resumo Financeiro</h3>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#718096] dark:text-slate-400">Total Carteira:</span>
                    <span className="font-bold">R$ {totalEmCobranca.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#176BFF] h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>

                  <div className="flex justify-between text-xs pt-2">
                    <span className="text-[#718096] dark:text-slate-400">Acordos Recuperados:</span>
                    <span className="font-bold text-[#16A36A]">R$ {totalAcordos.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#16A36A] h-full rounded-full" style={{ width: totalEmCobranca > 0 ? `${(totalAcordos / totalEmCobranca) * 100}%` : '0%' }}></div>
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-[#17233B] dark:text-white">Estatísticas do Funil de Cobrança</h3>
                <div className="h-40 w-full flex items-end justify-between px-2 pt-4 space-x-2">
                  {ESTAGIOS_COBRANCA.map(e => {
                    const qtd = clientes.filter(c => (c.estagio_id || 1) === e.id).length;
                    const altura = clientes.length > 0 ? (qtd / clientes.length) * 100 : 0;
                    return (
                      <div key={e.id} className="flex-1 flex flex-col items-center space-y-2 h-full justify-end">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden h-full flex items-end">
                          <div className="w-full bg-[#176BFF] rounded-xl transition-all" style={{ height: `${Math.max(altura, 5)}%` }}></div>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold truncate max-w-[50px]">{e.nome}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-[#17233B] dark:text-white">Atividades Recentes</h3>
                <div className="space-y-2">
                  {clientes.slice(0, 5).map(cli => (
                    <div key={cli.id} className="p-3 bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#17233B] dark:text-white">{cli.nome}</p>
                        <p className="text-[10px] text-slate-500">Código: {cli.codigo} • {cli.dias_atraso} dias de atraso</p>
                      </div>
                      <span className="font-black text-[#EF4444]">R$ {parseFloat(cli.total_vencido || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-[#17233B] dark:text-white">Ranking de Operadores</h3>
                <div className="space-y-3">
                  {rankingCobranca.map((op, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] rounded-2xl flex justify-between items-center text-xs">
                      <span className="font-bold text-[#17233B] dark:text-white">#{idx + 1} {op.operador}</span>
                      <span className="font-black text-[#16A36A]">R$ {parseFloat(op.valor_total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {rankingCobranca.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Sem dados de produtividade.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'cobranca' && subAbaCobranca === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-2xl bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750]">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#176BFF]" />
                <button onClick={() => setFiltroAtrasoPipeline('todos')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroAtrasoPipeline === 'todos' ? 'bg-[#176BFF] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Todos ({clientes.length})</button>
                <button onClick={() => setFiltroAtrasoPipeline('30')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroAtrasoPipeline === '30' ? 'bg-[#176BFF] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>30 Dias</button>
                <button onClick={() => setFiltroAtrasoPipeline('60')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroAtrasoPipeline === '60' ? 'bg-[#176BFF] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>60 Dias</button>
                <button onClick={() => setFiltroAtrasoPipeline('90')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroAtrasoPipeline === '90' ? 'bg-[#176BFF] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>90 Dias</button>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-3 overflow-x-auto pb-4">
              {ESTAGIOS_COBRANCA.map(estagio => {
                const lista = clientesFiltradosPipeline.filter(c => (c.estagio_id || 1) === estagio.id);
                return (
                  <div key={estagio.id} className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] rounded-3xl p-3 min-w-[210px] flex flex-col h-[650px]">
                    <div className={`border-b-2 ${estagio.cor} pb-2.5 mb-3 flex justify-between items-center px-1`}>
                      <span className="text-[11px] font-bold text-[#17233B] dark:text-white truncate">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-slate-100 dark:bg-[#0B1220] text-[#176BFF]">{lista.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {lista.map(cli => (
                        <div key={cli.id} className="bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] p-3.5 rounded-2xl space-y-2 hover:border-[#176BFF] transition-all">
                          <div>
                            <p className="text-xs font-bold text-[#17233B] dark:text-white truncate">{cli.nome}</p>
                            <p className="text-[10px] text-slate-500">Código: {cli.codigo}</p>
                          </div>
                          <p className="text-xs font-black text-[#EF4444]">R$ {parseFloat(cli.total_vencido || 0).toFixed(2)}</p>
                          {cli.valor_acordo > 0 && (
                            <p className="text-[10px] font-bold text-[#16A36A]">Acordo: R$ {parseFloat(cli.valor_acordo).toFixed(2)} ({cli.parcelas_acordo}x)</p>
                          )}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px]">
                            {estagio.id > 1 && <button onClick={() => moverEstagioCliente(cli.id, estagio.id - 1)} className="text-slate-500 hover:text-[#176BFF]">← Voltar</button>}
                            {estagio.id < 8 && <button onClick={() => moverEstagioCliente(cli.id, estagio.id + 1)} className="font-bold text-[#176BFF] ml-auto hover:underline">Avançar →</button>}
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

        {abaAtiva === 'cobranca' && subAbaCobranca === 'cadastro' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-6 rounded-3xl space-y-4 h-fit">
              <h2 className="text-base font-bold text-[#176BFF]">Cadastrar Cliente Cobrança</h2>
              <form onSubmit={handleSalvarCliente} className="space-y-3 text-xs">
                <input type="text" placeholder="Código/ID" required value={novoCliente.codigo} onChange={e => setNovoCliente({...novoCliente, codigo: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] p-3 rounded-2xl focus:outline-none focus:border-[#176BFF]" />
                <input type="text" placeholder="Nome Completo" required value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] p-3 rounded-2xl focus:outline-none focus:border-[#176BFF]" />
                <input type="text" placeholder="Telefone" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] p-3 rounded-2xl focus:outline-none focus:border-[#176BFF]" />
                <input type="text" placeholder="Valor Devedor" value={novoCliente.total_vencido} onChange={e => setNovoCliente({...novoCliente, total_vencido: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] p-3 rounded-2xl focus:outline-none focus:border-[#176BFF]" />
                <select value={novoCliente.dias_atraso} onChange={e => setNovoCliente({...novoCliente, dias_atraso: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] p-3 rounded-2xl focus:outline-none focus:border-[#176BFF]">
                  <option value="30">30 Dias</option>
                  <option value="60">60 Dias</option>
                  <option value="90">90 Dias</option>
                  <option value="120">Cancelado</option>
                </select>
                <button type="submit" className="w-full bg-[#176BFF] hover:bg-[#145ce0] text-white py-3 rounded-2xl font-bold uppercase tracking-wider">Cadastrar</button>
              </form>
            </div>

            <div className="col-span-2 bg-white dark:bg-[#17243A] border border-[#E5EAF2] dark:border-[#273750] p-6 rounded-3xl space-y-4">
              <h2 className="text-base font-bold text-[#17233B] dark:text-white">Base de Clientes ({clientes.length})</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {clientes.map(cli => (
                  <div key={cli.id} className="p-3.5 bg-slate-50 dark:bg-[#0B1220] border border-[#E5EAF2] dark:border-[#273750] rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#17233B] dark:text-white">{cli.nome}</p>
                      <p className="text-slate-500 text-[10px]">Código: {cli.codigo} • Tel: {cli.telefone} • {cli.dias_atraso} dias de atraso</p>
                    </div>
                    <button onClick={() => handleExcluirCliente(cli.id)} className="text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
