import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Wifi, Shield, Trash2, ArrowRight, Sun, Moon, Star, Filter,
  UserPlus, Award, ChevronDown, ChevronRight, Upload, FileSpreadsheet, Edit3,
  ShoppingBag, HeartHandshake, PlusCircle, Bell, Key, AlertTriangle, CheckCircle
} from 'lucide-react';

const API_URL = '/api';

const ESTAGIOS_COBRANCA = [
  { id: 1, nome: 'Novos Contatos', cor: 'border-blue-500' },
  { id: 2, nome: 'Primeiro Contato', cor: 'border-cyan-500' },
  { id: 3, nome: 'Segundo Contato', cor: 'border-indigo-500' },
  { id: 4, nome: 'Terceiro Contato', cor: 'border-purple-500' },
  { id: 5, nome: 'Promessa de Pagamento', cor: 'border-amber-500' },
  { id: 6, nome: 'Acordo Realizado', cor: 'border-emerald-500' },
  { id: 7, nome: 'Recusado ou Sem Contato', cor: 'border-rose-500' }
];

const ESTAGIOS_POS_VENDA = [
  { id: 1, nome: 'Boas-Vindas (1-3 dias)', cor: 'border-blue-500' },
  { id: 2, nome: 'Acompanhamento (15 dias)', cor: 'border-indigo-500' },
  { id: 3, nome: 'Satisfação CSAT (30 dias)', cor: 'border-amber-500' },
  { id: 4, nome: 'Cliente Fidelizado', cor: 'border-emerald-500' },
  { id: 5, nome: 'Risco de Cancelamento', cor: 'border-rose-500' }
];

const FRASES_MOTIVACIONAIS = [
  "A consistência é a chave para transformar metas em resultados extraordinários!",
  "Cada cliente atendido com excelência reforça o nosso compromisso com a qualidade.",
  "Foco, empatia e agilidade transformam clientes em defensores da marca!"
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [subAbaAdmin, setSubAbaAdmin] = useState('excel');
  const [subAbaPosVenda, setSubAbaPosVenda] = useState('funil');
  const [menuAdminAberto, setMenuAdminAberto] = useState(false);
  const [menuPosVendaAberto, setMenuPosVendaAberto] = useState(false);
  const [temaClaro, setTemaClaro] = useState(false);
  
  const [frasePopup, setFrasePopup] = useState('');
  const [exibirPopup, setExibirPopup] = useState(false);
  const [exibirNotificacoes, setExibirNotificacoes] = useState(false);

  // Dados
  const [clientes, setClientes] = useState([]);
  const [posVendas, setPosVendas] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [rankingCobranca, setRankingCobranca] = useState([]);
  const [rankingVendedores, setRankingVendedores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Excel
  const [previaExcel, setPreviaExcel] = useState([]);

  // Chat
  const [gruposChat, setGruposChat] = useState([]);
  const [chatMensagens, setChatMensagens] = useState([]);
  const [chatTipo, setChatTipo] = useState('geral');
  const [chatDestinoId, setChatDestinoId] = useState(null);
  const [novaMsgChat, setNovaMsgChat] = useState('');
  const [novoGrupoNome, setNovoGrupoNome] = useState('');

  // Buscas por seção
  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [buscaCadastro, setBuscaCadastro] = useState('');
  const [buscaAgenda, setBuscaAgenda] = useState('');
  const [filtroAtrasoPipeline, setFiltroAtrasoPipeline] = useState('todos');

  // Formulários
  const [novoCliente, setNovoCliente] = useState({ codigo: '', nome: '', total_vencido: '', dias_atraso: '30' });
  const [novoPosVenda, setNovoPosVenda] = useState({ codigo: '', nome: '', telefone: '', plano: 'Fibra 500MB', satisfacao: '5', vendedor_id: '', observacoes: '' });

  // Modais
  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [senhaNovaUsuario, setSenhaNovaUsuario] = useState('');

  useEffect(() => {
    if (usuario) {
      carregarDados();
      const interval = setInterval(carregarChat, 5000);
      return () => clearInterval(interval);
    }
  }, [usuario, chatTipo, chatDestinoId]);

  const carregarDados = () => {
    fetch(`${API_URL}/clientes`).then(r => r.json()).then(data => setClientes(data || [])).catch(() => {});
    fetch(`${API_URL}/pos-venda`).then(r => r.json()).then(data => setPosVendas(data || [])).catch(() => {});
    fetch(`${API_URL}/agenda`).then(r => r.json()).then(data => setAgenda(data || [])).catch(() => {});
    fetch(`${API_URL}/dashboard/ranking-cobranca`).then(r => r.json()).then(data => setRankingCobranca(data || [])).catch(() => {});
    fetch(`${API_URL}/dashboard/ranking-vendedores`).then(r => r.json()).then(data => setRankingVendedores(data || [])).catch(() => {});
    fetch(`${API_URL}/usuarios`).then(r => r.json()).then(data => setUsuarios(data || [])).catch(() => {});
    fetch(`${API_URL}/chat/grupos`).then(r => r.json()).then(data => setGruposChat(data || [])).catch(() => {});
    carregarChat();
  };

  const carregarChat = () => {
    let url = `${API_URL}/chat/mensagens`;
    if (chatTipo === 'direto' && chatDestinoId) url += `?destinatario_id=${chatDestinoId}`;
    if (chatTipo === 'grupo' && chatDestinoId) url += `?grupo_id=${chatDestinoId}`;

    fetch(url).then(r => r.json()).then(data => setChatMensagens(data || [])).catch(() => {});
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
        setFrasePopup(FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)]);
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

  const moverEstagioPosVenda = (posVendaId, novoEstagioId) => {
    fetch(`${API_URL}/pos-venda/${posVendaId}/estagio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estagio_id: novoEstagioId })
    }).then(() => carregarDados());
  };

  const handleCadastrarClienteManual = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/clientes/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCliente)
    }).then(r => r.json()).then(data => {
      if (data.sucesso) {
        alert('Cliente cadastrado com sucesso!');
        setNovoCliente({ codigo: '', nome: '', total_vencido: '', dias_atraso: '30' });
        carregarDados();
      }
    });
  };

  const handleCadastrarPosVenda = (e) => {
    e.preventDefault();
    if (!novoPosVenda.nome.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    const payload = {
      ...novoPosVenda,
      vendedor_id: novoPosVenda.vendedor_id || usuario.id
    };

    fetch(`${API_URL}/pos-venda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        if (data.sucesso) {
          alert('Cliente salvo no Pós-Venda com sucesso!');
          setNovoPosVenda({ codigo: '', nome: '', telefone: '', plano: 'Fibra 500MB', satisfacao: '5', vendedor_id: '', observacoes: '' });
          carregarDados();
        } else {
          alert(data.error || 'Erro ao salvar cliente no Pós-Venda.');
        }
      });
  };

  const handleCarregarPreviaExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('arquivo', file);

    fetch(`${API_URL}/clientes/previa`, { method: 'POST', body: formData })
      .then(r => r.json())
      .then(data => {
        if (data.sucesso) {
          setPreviaExcel(data.dados);
        } else {
          alert('Erro ao ler a planilha Excel.');
        }
      });
  };

  const handleConfirmarImportacaoExcel = () => {
    if (previaExcel.length === 0) return;

    fetch(`${API_URL}/clientes/confirmar-importacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientes: previaExcel })
    }).then(() => {
      alert(`${previaExcel.length} clientes salvos com sucesso no Pipeline!`);
      setPreviaExcel([]);
      carregarDados();
    });
  };

  const handleLimparMassaClientes = (categoria) => {
    if (confirm(`Tem certeza que deseja excluir em massa os clientes da categoria: ${categoria.toUpperCase()}?`)) {
      fetch(`${API_URL}/clientes/limpar/massa?categoria=${categoria}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
          alert(`${data.deletados || 0} clientes foram removidos do sistema.`);
          carregarDados();
        });
    }
  };

  const handleCriarGrupoChat = (e) => {
    e.preventDefault();
    if (!novoGrupoNome.trim()) return;

    fetch(`${API_URL}/chat/grupos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoGrupoNome })
    }).then(() => {
      setNovoGrupoNome('');
      carregarDados();
    });
  };

  const handleExcluirGrupoChat = (grupoId) => {
    if (confirm('Excluir este grupo de chat?')) {
      fetch(`${API_URL}/chat/grupos/${grupoId}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleExcluirCliente = (clienteId) => {
    if (confirm('Excluir este cliente de cobrança?')) {
      fetch(`${API_URL}/clientes/${clienteId}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleExcluirPosVenda = (id) => {
    if (confirm('Excluir este registro de Pós-Venda?')) {
      fetch(`${API_URL}/pos-venda/${id}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleExcluirUsuario = (id) => {
    if (confirm('Excluir este usuário do sistema?')) {
      fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' }).then(() => {
        setUsuarioEditando(null);
        carregarDados();
      });
    }
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

  const handleEnviarChat = (e) => {
    e.preventDefault();
    if (!novaMsgChat.trim()) return;

    fetch(`${API_URL}/chat/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remetente_id: usuario.id,
        remetente_nome: usuario.nome,
        destinatario_id: chatTipo === 'direto' ? chatDestinoId : null,
        grupo_id: chatTipo === 'grupo' ? chatDestinoId : null,
        mensagem: novaMsgChat
      })
    }).then(() => {
      setNovaMsgChat('');
      carregarChat();
    });
  };

  // ESTILOS DE TEMA (MODO ESCURO: AZUL + VERDE / MODO CLARO: BRANCO + MARSALA)
  const bgPrincipal = temaClaro ? 'bg-[#f4f0f2] text-slate-900' : 'bg-slate-950 text-slate-100';
  const bgCard = temaClaro ? 'bg-white border-[#e2d5da] text-slate-800 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-100 shadow-md';
  const bgInput = temaClaro ? 'bg-[#fbf9fa] border-[#d8c5cc] text-slate-900 focus:border-[#800020]' : 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500';
  const btnDestaque = temaClaro ? 'bg-[#800020] hover:bg-[#600018] text-white font-bold transition-all' : 'bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all';

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center space-x-2 text-blue-500 font-black text-3xl tracking-wider">
              <Wifi className="w-8 h-8 text-emerald-400" />
              <span>METRO<span className="text-white">COB</span></span>
            </div>
            <p className="text-xs text-emerald-400 tracking-widest uppercase font-semibold mt-1">POWERED BY NEXUS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">E-mail do Operador</label>
              <input 
                type="email" 
                required
                value={emailLogin} 
                onChange={e => setEmailLogin(e.target.value)}
                placeholder="operador@metronet.com.br"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Senha de Acesso</label>
              <input 
                type="password" 
                required
                value={senhaLogin} 
                onChange={e => setSenhaLogin(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none text-white"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg text-sm uppercase tracking-wider"
            >
              Acessar Painel MetroCob
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Developer: <span className="text-emerald-400 font-bold">Thiago Pauluk</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalClientes = clientes.length;
  const totalEmAberto = clientes.reduce((acc, c) => acc + (parseFloat(c.total_vencido) || 0), 0);
  const totalRecebido = clientes.filter(c => c.estagio_id === 6).reduce((acc, c) => acc + (parseFloat(c.valor_acordo) || parseFloat(c.total_vencido) || 0), 0);
  const mediaCsat = posVendas.length > 0 ? (posVendas.reduce((acc, p) => acc + (p.satisfacao || 5), 0) / posVendas.length).toFixed(1) : '5.0';

  const clientesFiltradosPipeline = clientes.filter(c => {
    const combinaBusca = c.nome?.toLowerCase().includes(buscaPipeline.toLowerCase()) || c.codigo?.toLowerCase().includes(buscaPipeline.toLowerCase());
    if (!combinaBusca) return false;

    if (filtroAtrasoPipeline === '30') return c.dias_atraso === 30;
    if (filtroAtrasoPipeline === '60') return c.dias_atraso === 60;
    if (filtroAtrasoPipeline === '90') return c.dias_atraso === 90;
    if (filtroAtrasoPipeline === 'cancelados') return c.dias_atraso >= 120 || c.status_conexao === 'Cancelado';

    return true;
  });

  const clientesFiltradosCadastro = clientes.filter(c => 
    c.nome?.toLowerCase().includes(buscaCadastro.toLowerCase()) || c.codigo?.toLowerCase().includes(buscaCadastro.toLowerCase())
  );

  const agendaFiltrada = agenda.filter(a => 
    a.cliente_nome?.toLowerCase().includes(buscaAgenda.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${bgPrincipal} flex font-sans transition-colors duration-200`}>
      
      {/* POPUP MOTIVACIONAL */}
      {exibirPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-2xl max-w-lg w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Bem-vindo, {usuario.nome}!</h3>
              <p className="text-slate-300 italic text-base leading-relaxed">"{frasePopup}"</p>
            </div>
            <button 
              onClick={() => setExibirPopup(false)}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold px-8 py-2.5 rounded-lg shadow-lg"
            >
              Iniciar Trabalho
            </button>
          </div>
        </div>
      )}

      {/* MODAL ACORDO */}
      {modalAcordo.exibir && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className={`${bgCard} border border-emerald-500/50 p-6 rounded-2xl max-w-md w-full space-y-4`}>
            <h3 className="text-lg font-bold">Registrar Acordo Realizado</h3>
            <form onSubmit={handleConfirmarAcordo} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 opacity-70">Valor Final do Acordo (R$)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 250,00"
                  value={modalAcordo.valor}
                  onChange={e => setModalAcordo({...modalAcordo, valor: e.target.value})}
                  className={`w-full ${bgInput} p-2.5 rounded-lg`}
                />
              </div>

              <div>
                <label className="block mb-1 opacity-70">Quantidade de Parcelas</label>
                <input 
                  type="number" 
                  min="1"
                  max="12"
                  value={modalAcordo.parcelas}
                  onChange={e => setModalAcordo({...modalAcordo, parcelas: e.target.value})}
                  className={`w-full ${bgInput} p-2.5 rounded-lg`}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalAcordo({ exibir: false, clienteId: null, valor: '', parcelas: '1' })}
                  className="w-1/2 bg-slate-300 text-slate-800 py-2 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold"
                >
                  Salvar Acordo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR METRONET */}
      <aside className={`w-64 ${bgCard} border-r flex flex-col justify-between transition-colors`}>
        <div>
          <div className={`p-6 border-b ${temaClaro ? 'border-[#e2d5da]' : 'border-slate-800'}`}>
            <div className={`flex items-center space-x-2 font-black text-xl tracking-wider ${temaClaro ? 'text-[#800020]' : 'text-blue-500'}`}>
              <Wifi className="w-6 h-6 text-emerald-400" />
              <span>METRO<span className={temaClaro ? "text-slate-900" : "text-white"}>COB</span></span>
            </div>
            <p className={`text-[10px] tracking-widest uppercase font-semibold mt-0.5 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
              POWERED BY NEXUS
            </p>
          </div>

          <nav className="p-4 space-y-1 text-sm font-medium">
            <button 
              onClick={() => setAbaAtiva('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'dashboard' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
            >
              <BarChart2 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('pipeline')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pipeline' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
            >
              <Users className="w-5 h-5" />
              <span>Pipeline Cobrança</span>
            </button>

            {/* SUBMENU PÓS-VENDA */}
            <div>
              <button 
                onClick={() => setMenuPosVendaAberto(!menuPosVendaAberto)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pos-venda' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
              >
                <div className="flex items-center space-x-3">
                  <HeartHandshake className="w-5 h-5 text-emerald-400" />
                  <span>Pós-Venda</span>
                </div>
                {menuPosVendaAberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {menuPosVendaAberto && (
                <div className="ml-8 mt-1 space-y-1 text-xs font-semibold">
                  <button 
                    onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('funil'); }}
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center space-x-2 ${subAbaPosVenda === 'funil' && abaAtiva === 'pos-venda' ? 'text-emerald-400 bg-slate-800 font-bold' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Funil Pós-Venda</span>
                  </button>

                  <button 
                    onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('cadastro'); }}
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center space-x-2 ${subAbaPosVenda === 'cadastro' && abaAtiva === 'pos-venda' ? 'text-emerald-400 bg-slate-800 font-bold' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Pós-Venda</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setAbaAtiva('cadastro-cliente')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'cadastro-cliente' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
            >
              <UserPlus className="w-5 h-5" />
              <span>Clientes Cobrança</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('agenda')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'agenda' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
            >
              <Calendar className="w-5 h-5" />
              <span>Agenda / Retornos</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('chat')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'chat' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat & Grupos</span>
            </button>

            {/* SUBMENU ADMINISTRAÇÃO */}
            <div>
              <button 
                onClick={() => setMenuAdminAberto(!menuAdminAberto)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'admin' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5" />
                  <span>Administração</span>
                </div>
                {menuAdminAberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {menuAdminAberto && (
                <div className="ml-8 mt-1 space-y-1 text-xs font-semibold">
                  <button 
                    onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('excel'); }}
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center space-x-2 ${subAbaAdmin === 'excel' && abaAtiva === 'admin' ? 'text-emerald-400 bg-slate-800 font-bold' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Subir Planilha Excel</span>
                  </button>

                  <button 
                    onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('exclusao-massa'); }}
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center space-x-2 ${subAbaAdmin === 'exclusao-massa' && abaAtiva === 'admin' ? 'text-rose-400 bg-slate-800 font-bold' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Exclusão em Massa</span>
                  </button>

                  <button 
                    onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('usuarios'); }}
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center space-x-2 ${subAbaAdmin === 'usuarios' && abaAtiva === 'admin' ? 'text-emerald-400 bg-slate-800 font-bold' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Gerenciar Usuários</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className={`p-4 border-t ${temaClaro ? 'border-[#e2d5da]' : 'border-slate-800'} space-y-2`}>
          <button 
            onClick={() => setTemaClaro(!temaClaro)}
            className={`w-full flex items-center justify-center space-x-2 ${temaClaro ? 'bg-[#800020]/10 text-[#800020]' : 'bg-slate-800 text-slate-200'} py-2 rounded-lg text-xs transition-all font-bold`}
          >
            {temaClaro ? <Moon className="w-4 h-4 text-[#800020]" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{temaClaro ? 'Modo Escuro (Azul/Verde)' : 'Modo Claro (Marsala)'}</span>
          </button>

          <button 
            onClick={() => setUsuario(null)}
            className="w-full flex items-center justify-center space-x-2 text-rose-500 hover:bg-rose-500/10 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* CABEÇALHO COM NOTIFICAÇÃO DA AGENDA NO TOPO */}
        <header className={`h-16 ${bgCard} border-b px-6 flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Sistema MetroCob</span>
            <span className="text-xs text-emerald-500 font-black">• Online</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* BARRA DE NOTIFICAÇÃO DA AGENDA */}
            <div className="relative">
              <button 
                onClick={() => setExibirNotificacoes(!exibirNotificacoes)}
                className="relative p-2 rounded-full hover:bg-slate-800/20 text-slate-300 transition-all"
              >
                <Bell className="w-5 h-5 text-amber-400" />
                {agenda.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {agenda.length}
                  </span>
                )}
              </button>

              {exibirNotificacoes && (
                <div className={`absolute right-0 mt-2 w-80 ${bgCard} border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 space-y-3`}>
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="text-xs font-bold flex items-center space-x-1 text-amber-400">
                      <Calendar className="w-4 h-4" />
                      <span>Retornos da Agenda ({agenda.length})</span>
                    </h4>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                    {agenda.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-2">Nenhum retorno agendado.</p>
                    ) : (
                      agenda.map(item => (
                        <div key={item.id} className={`${bgInput} p-2.5 rounded-xl border space-y-1`}>
                          <p className="font-bold text-white">{item.cliente_nome}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold">📅 {item.data_retorno}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.observacao || 'Sem obs'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className={`text-xs font-bold uppercase ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
              {usuario.nome} ({usuario.cargo})
            </span>
          </div>
        </header>

        <div className="p-6">
          
          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Dashboard Geral e Ranking de Desempenho</h1>
                <p className={`text-xs font-semibold tracking-wider uppercase ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                  METRONET INTERNET DE VERDADE
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className={`${bgCard} border p-5 rounded-2xl`}>
                  <p className="text-xs font-medium opacity-60">Total Carteira Cobrança</p>
                  <p className="text-2xl font-black mt-1">{totalClientes} clientes</p>
                </div>

                <div className={`${bgCard} border p-5 rounded-2xl`}>
                  <p className="text-xs font-medium opacity-60">Total em Aberto</p>
                  <p className="text-2xl font-black text-rose-500 mt-1">R$ {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className={`${bgCard} border p-5 rounded-2xl`}>
                  <p className="text-xs font-medium opacity-60">Total Recuperado</p>
                  <p className="text-2xl font-black text-emerald-500 mt-1">R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className={`${bgCard} border p-5 rounded-2xl`}>
                  <p className="text-xs font-medium opacity-60">Índice Qualidade CSAT</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-black text-amber-500">{mediaCsat} / 5.0</p>
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-base font-bold flex items-center space-x-2 text-amber-500">
                    <Award className="w-5 h-5" />
                    <span>Ranking Cobradores (Maior Volume de Acordos)</span>
                  </h2>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {rankingCobranca.map((op, idx) => (
                      <div key={idx} className={`${bgInput} p-4 rounded-xl flex items-center justify-between border`}>
                        <div className="flex items-center space-x-3">
                          <span className={`w-7 h-7 rounded-full ${btnDestaque} flex items-center justify-center font-bold text-xs`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold">{op.operador}</p>
                            <p className="text-xs opacity-60">{op.total_acordos} acordos efetuados</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-emerald-500">
                          R$ {parseFloat(op.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className={`text-base font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                    <Award className="w-5 h-5" />
                    <span>Ranking Vendedores & Pós-Venda</span>
                  </h2>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {rankingVendedores.map((vend, idx) => (
                      <div key={idx} className={`${bgInput} p-4 rounded-xl flex items-center justify-between border`}>
                        <div className="flex items-center space-x-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold">{vend.vendedor}</p>
                            <p className="text-xs opacity-60">{vend.total_pos_vendas} clientes pós-venda</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-amber-500 flex items-center space-x-1">
                          <span>{parseFloat(vend.media_satisfacao || 5).toFixed(1)}</span>
                          <Star className="w-4 h-4 fill-amber-500" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PIPELINE DE COBRANÇA */}
          {abaAtiva === 'pipeline' && (
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-3 rounded-2xl border ${bgCard}`}>
                <div className="flex items-center space-x-2">
                  <Filter className={`w-4 h-4 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`} />
                  <span className="text-xs font-bold uppercase opacity-80">Filtrar Carteira:</span>
                  
                  <button onClick={() => setFiltroAtrasoPipeline('todos')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === 'todos' ? `${btnDestaque}` : 'opacity-60'}`}>
                    Todos ({clientes.length})
                  </button>
                  <button onClick={() => setFiltroAtrasoPipeline('30')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === '30' ? `${btnDestaque}` : 'opacity-60'}`}>
                    30 Dias ({clientes.filter(c => c.dias_atraso === 30).length})
                  </button>
                  <button onClick={() => setFiltroAtrasoPipeline('60')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === '60' ? `${btnDestaque}` : 'opacity-60'}`}>
                    60 Dias ({clientes.filter(c => c.dias_atraso === 60).length})
                  </button>
                  <button onClick={() => setFiltroAtrasoPipeline('90')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === '90' ? `${btnDestaque}` : 'opacity-60'}`}>
                    90 Dias ({clientes.filter(c => c.dias_atraso === 90).length})
                  </button>
                  <button onClick={() => setFiltroAtrasoPipeline('cancelados')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === 'cancelados' ? 'bg-rose-600 text-white' : 'opacity-60'}`}>
                    Cancelados ({clientes.filter(c => c.dias_atraso >= 120 || c.status_conexao === 'Cancelado').length})
                  </button>
                </div>

                <div className="relative w-64">
                  <Search className="w-4 h-4 opacity-40 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente no funil..."
                    value={buscaPipeline}
                    onChange={e => setBuscaPipeline(e.target.value)}
                    className={`w-full ${bgInput} rounded-lg pl-9 pr-3 py-1.5 text-xs`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-3 overflow-x-auto pb-4">
                {ESTAGIOS_COBRANCA.map(estagio => {
                  const clientesEstagio = clientesFiltradosPipeline.filter(c => (c.estagio_id || 1) === estagio.id);

                  return (
                    <div key={estagio.id} className={`${bgCard} border rounded-2xl p-3 min-w-[210px] flex flex-col h-[650px]`}>
                      <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                        <span className="text-xs font-bold truncate">{estagio.nome}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${temaClaro ? 'bg-[#800020]/10 text-[#800020]' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {clientesEstagio.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {clientesEstagio.map(cli => (
                          <div key={cli.id} className={`${bgInput} border p-3 rounded-xl space-y-2 shadow-sm`}>
                            <div className="flex justify-between items-start">
                              <div className="truncate pr-1">
                                <p className="text-xs font-bold truncate">{cli.nome}</p>
                                <p className="text-[10px] opacity-60">ID: {cli.codigo}</p>
                              </div>
                              <button onClick={() => handleExcluirCliente(cli.id)} className="text-rose-500 hover:text-rose-700 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-rose-500">
                                R$ {parseFloat(cli.total_vencido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="pt-2 border-t opacity-80 flex justify-between items-center">
                              {estagio.id > 1 && (
                                <button onClick={() => moverEstagioCliente(cli.id, estagio.id - 1)} className="text-[10px] opacity-60 hover:opacity-100">
                                  ← Voltar
                                </button>
                              )}
                              {estagio.id < 7 && (
                                <button onClick={() => moverEstagioCliente(cli.id, estagio.id + 1)} className={`text-[10px] font-bold ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'} ml-auto flex items-center space-x-1`}>
                                  <span>Avançar</span>
                                  <ArrowRight className="w-3 h-3" />
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

          {/* MÓDULO PÓS-VENDA */}
          {abaAtiva === 'pos-venda' && (
            <div className="space-y-6">
              
              {subAbaPosVenda === 'funil' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h1 className={`text-xl font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                      <HeartHandshake className="w-6 h-6" />
                      <span>Pipeline / Funil de Pós-Venda (CSAT)</span>
                    </h1>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    {ESTAGIOS_POS_VENDA.map(estagio => {
                      const listaEstagio = posVendas.filter(p => (p.estagio_id || 1) === estagio.id);

                      return (
                        <div key={estagio.id} className={`${bgCard} border rounded-2xl p-4 flex flex-col h-[650px]`}>
                          <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                            <span className="text-xs font-bold truncate">{estagio.nome}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${temaClaro ? 'bg-[#800020]/10 text-[#800020]' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {listaEstagio.length}
                            </span>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {listaEstagio.map(item => (
                              <div key={item.id} className={`${bgInput} border p-3 rounded-xl space-y-2 shadow-sm`}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-bold truncate">{item.nome}</p>
                                    <p className="text-[10px] opacity-60">Plano: {item.plano}</p>
                                  </div>
                                  <button onClick={() => handleExcluirPosVenda(item.id)} className="text-rose-500 p-1">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-1">
                                  <div className="flex items-center space-x-1 text-amber-500 font-bold">
                                    <span>{item.satisfacao}</span>
                                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                                  </div>
                                  <span className="text-[10px] opacity-60">{item.vendedor_nome || 'Vendedor N/A'}</span>
                                </div>

                                <div className="pt-2 border-t opacity-80 flex justify-between items-center text-[10px]">
                                  {estagio.id > 1 && (
                                    <button onClick={() => moverEstagioPosVenda(item.id, estagio.id - 1)} className="opacity-60">
                                      ← Voltar
                                    </button>
                                  )}
                                  {estagio.id < 5 && (
                                    <button onClick={() => moverEstagioPosVenda(item.id, estagio.id + 1)} className={`font-bold ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'} ml-auto`}>
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

              {subAbaPosVenda === 'cadastro' && (
                <div className="grid grid-cols-3 gap-6">
                  <div className={`${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm h-fit`}>
                    <h2 className={`text-base font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                      <UserPlus className="w-5 h-5" />
                      <span>Novo Cliente de Pós-Venda</span>
                    </h2>

                    <form onSubmit={handleCadastrarPosVenda} className="space-y-4 text-xs">
                      <div>
                        <label className="block mb-1 font-semibold opacity-70">Nome Completo *</label>
                        <input type="text" required placeholder="Nome do cliente" value={novoPosVenda.nome} onChange={e => setNovoPosVenda({...novoPosVenda, nome: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} />
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold opacity-70">Plano Contratado *</label>
                        <input type="text" required placeholder="Ex: Fibra 600MB" value={novoPosVenda.plano} onChange={e => setNovoPosVenda({...novoPosVenda, plano: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} />
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold opacity-70">Vendedor Responsável *</label>
                        <select value={novoPosVenda.vendedor_id} onChange={e => setNovoPosVenda({...novoPosVenda, vendedor_id: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`}>
                          <option value="">Selecione o Vendedor...</option>
                          {usuarios.map(u => (
                            <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold opacity-70">Nota CSAT Inicial (1 a 5 stars)</label>
                        <select value={novoPosVenda.satisfacao} onChange={e => setNovoPosVenda({...novoPosVenda, satisfacao: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`}>
                          <option value="5">⭐⭐⭐⭐⭐ 5 - Excelente</option>
                          <option value="4">⭐⭐⭐⭐ 4 - Bom</option>
                          <option value="3">⭐⭐⭐ 3 - Regular</option>
                          <option value="2">⭐⭐ 2 - Ruim</option>
                          <option value="1">⭐ 1 - Péssimo</option>
                        </select>
                      </div>

                      <button type="submit" className={`w-full ${btnDestaque} py-3 rounded-xl uppercase tracking-wider`}>
                        Salvar no Pós-Venda
                      </button>
                    </form>
                  </div>

                  <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                    <h2 className="text-base font-bold">Clientes em Pós-Venda ({posVendas.length})</h2>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {posVendas.map(item => (
                        <div key={item.id} className={`${bgInput} border p-3.5 rounded-xl flex items-center justify-between text-xs`}>
                          <div>
                            <p className="font-bold text-sm">{item.nome}</p>
                            <p className="opacity-60">Plano: {item.plano} • Vendedor: {item.vendedor_nome || 'N/A'}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-amber-500 font-bold flex items-center space-x-1 bg-[#800020]/10 px-2.5 py-1 rounded-lg">
                              <span>{item.satisfacao}</span>
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                            </span>
                            <button onClick={() => handleExcluirPosVenda(item.id)} className="text-rose-500 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* CADASTRO CLIENTES COBRANÇA */}
          {abaAtiva === 'cadastro-cliente' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm h-fit`}>
                <h2 className={`text-base font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                  <UserPlus className="w-5 h-5" />
                  <span>Cadastrar Cliente Cobrança</span>
                </h2>

                <form onSubmit={handleCadastrarClienteManual} className="space-y-4 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold opacity-70">ID / Código do Cliente *</label>
                    <input type="text" required placeholder="Ex: 17242" value={novoCliente.codigo} onChange={e => setNovoCliente({...novoCliente, codigo: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold opacity-70">Nome Completo *</label>
                    <input type="text" required placeholder="Nome do cliente" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold opacity-70">Valor Devedor (R$) *</label>
                    <input type="text" required placeholder="Ex: 150,00" value={novoCliente.total_vencido} onChange={e => setNovoCliente({...novoCliente, total_vencido: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold opacity-70">Tempo de Atraso / Categoria *</label>
                    <select value={novoCliente.dias_atraso} onChange={e => setNovoCliente({...novoCliente, dias_atraso: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`}>
                      <option value="30">30 Dias de Atraso</option>
                      <option value="60">60 Dias de Atraso</option>
                      <option value="90">90 Dias de Atraso</option>
                      <option value="120">CANCELADOS / Inadimplentes</option>
                    </select>
                  </div>

                  <button type="submit" className={`w-full ${btnDestaque} py-3 rounded-xl uppercase tracking-wider`}>
                    Cadastrar Cliente
                  </button>
                </form>
              </div>

              <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold">Clientes Cobrança Cadastrados ({clientesFiltradosCadastro.length})</h2>
                  <div className="relative w-64">
                    <Search className="w-4 h-4 opacity-40 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Buscar nesta lista..."
                      value={buscaCadastro}
                      onChange={e => setBuscaCadastro(e.target.value)}
                      className={`w-full ${bgInput} rounded-lg pl-9 pr-3 py-1.5 text-xs`}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {clientesFiltradosCadastro.map(cli => (
                    <div key={cli.id} className={`${bgInput} border p-3.5 rounded-xl flex items-center justify-between text-xs`}>
                      <div>
                        <p className="font-bold text-sm">{cli.nome}</p>
                        <p className="opacity-60">ID: {cli.codigo} • Atraso: {cli.dias_atraso} Dias</p>
                      </div>
                      <span className="font-black text-rose-500">
                        R$ {parseFloat(cli.total_vencido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AGENDA */}
          {abaAtiva === 'agenda' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                <h2 className={`text-base font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                  <Calendar className="w-5 h-5" />
                  <span>Agendar Retorno</span>
                </h2>

                <form onSubmit={e => {
                  e.preventDefault();
                  const dataForm = new FormData(e.target);
                  fetch(`${API_URL}/agenda`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      cliente_nome: dataForm.get('cliente_nome'),
                      data_retorno: dataForm.get('data_retorno'),
                      observacao: dataForm.get('observacao'),
                      usuario_id: usuario.id,
                      usuario_nome: usuario.nome
                    })
                  }).then(() => { e.target.reset(); carregarDados(); });
                }} className="space-y-4 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold opacity-70">Cliente *</label>
                    <input type="text" name="cliente_nome" required placeholder="Nome do cliente" className={`w-full ${bgInput} rounded-lg p-2.5`} />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold opacity-70">Data e Hora *</label>
                    <input type="datetime-local" name="data_retorno" required className={`w-full ${bgInput} rounded-lg p-2.5`} />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold opacity-70">Observação</label>
                    <textarea name="observacao" rows="3" className={`w-full ${bgInput} rounded-lg p-2.5`}></textarea>
                  </div>

                  <button type="submit" className={`w-full ${btnDestaque} py-2.5 rounded-lg uppercase tracking-wider`}>
                    Salvar na Agenda
                  </button>
                </form>
              </div>

              <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold">Compromissos Agendados ({agendaFiltrada.length})</h2>
                  <div className="relative w-64">
                    <Search className="w-4 h-4 opacity-40 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Buscar compromisso..."
                      value={buscaAgenda}
                      onChange={e => setBuscaAgenda(e.target.value)}
                      className={`w-full ${bgInput} rounded-lg pl-9 pr-3 py-1.5 text-xs`}
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {agendaFiltrada.map(item => (
                    <div key={item.id} className={`${bgInput} border p-4 rounded-xl flex items-center justify-between text-xs`}>
                      <div>
                        <p className="font-bold">{item.cliente_nome}</p>
                        <p className={`font-semibold ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>📅 {item.data_retorno}</p>
                        <p className="opacity-60 mt-1">{item.observacao}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${temaClaro ? 'bg-[#800020]/10 text-[#800020]' : 'bg-slate-800 text-slate-200'}`}>
                        {item.usuario_nome}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAT COM EXCLUIR GRUPO E OPÇÃO INDIVIDUAL */}
          {abaAtiva === 'chat' && (
            <div className="grid grid-cols-4 gap-6 h-[620px]">
              <div className={`${bgCard} border p-4 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between`}>
                <div className="space-y-3 overflow-y-auto pr-1">
                  <h3 className="text-sm font-bold">Canais & Conversas</h3>
                  
                  <button 
                    onClick={() => { setChatTipo('geral'); setChatDestinoId(null); }} 
                    className={`w-full text-left p-2.5 rounded-xl font-bold text-xs ${chatTipo === 'geral' ? `${btnDestaque}` : `${bgInput}`}`}
                  >
                    # Geral (Todos)
                  </button>

                  <p className="text-[10px] font-bold uppercase opacity-50 pt-2">Grupos Criados</p>
                  {gruposChat.map(g => (
                    <div key={g.id} className="flex items-center space-x-1">
                      <button 
                        onClick={() => { setChatTipo('grupo'); setChatDestinoId(g.id); }}
                        className={`flex-1 text-left p-2 rounded-lg text-xs truncate ${chatTipo === 'grupo' && chatDestinoId === g.id ? `${btnDestaque}` : `${bgInput}`}`}
                      >
                        📢 {g.nome}
                      </button>
                      <button onClick={() => handleExcluirGrupoChat(g.id)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <p className="text-[10px] font-bold uppercase opacity-50 pt-2">Mensagem Privada / Usuários</p>
                  {usuarios.filter(u => u.id !== usuario.id).map(u => (
                    <button 
                      key={u.id} 
                      onClick={() => { setChatTipo('direto'); setChatDestinoId(u.id); }} 
                      className={`w-full text-left p-2 rounded-lg text-xs truncate ${chatTipo === 'direto' && chatDestinoId === u.id ? `${btnDestaque}` : `${bgInput}`}`}
                    >
                      👤 {u.nome} ({u.cargo})
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCriarGrupoChat} className="pt-2 border-t space-y-2">
                  <input 
                    type="text" 
                    placeholder="Nome do Novo Grupo..."
                    value={novoGrupoNome}
                    onChange={e => setNovoGrupoNome(e.target.value)}
                    className={`w-full ${bgInput} rounded-lg p-2 text-xs focus:outline-none`}
                  />
                  <button type="submit" className={`w-full ${btnDestaque} py-2 rounded-lg text-xs flex items-center justify-center space-x-1 uppercase tracking-wider`}>
                    <PlusCircle className="w-4 h-4" />
                    <span>Criar Grupo</span>
                  </button>
                </form>
              </div>

              <div className={`col-span-3 ${bgCard} border rounded-2xl p-5 flex flex-col shadow-sm`}>
                <div className={`flex-1 overflow-y-auto space-y-3 p-3 ${bgInput} rounded-xl mb-4 border`}>
                  {chatMensagens.map(msg => (
                    <div key={msg.id} className={`${bgCard} p-3 rounded-xl text-xs space-y-1 shadow-sm`}>
                      <div className={`flex justify-between items-center font-bold ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                        <span>{msg.remetente_nome}</span>
                        <span className="text-[10px] opacity-50">{new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{msg.mensagem}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleEnviarChat} className="flex space-x-2">
                  <input type="text" placeholder="Escreva sua mensagem..." value={novaMsgChat} onChange={e => setNovaMsgChat(e.target.value)} className={`flex-1 ${bgInput} rounded-xl px-4 py-2.5 text-xs focus:outline-none`} />
                  <button type="submit" className={`${btnDestaque} px-5 rounded-xl font-bold`}>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADMINISTRAÇÃO - INCLUINDO EXCLUSÃO EM MASSA */}
          {abaAtiva === 'admin' && (
            <div className="space-y-6">
              
              {/* EXCEL */}
              {subAbaAdmin === 'excel' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-6 shadow-sm`}>
                  <div>
                    <h2 className={`text-lg font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                      <FileSpreadsheet className="w-6 h-6" />
                      <span>Subir Planilha de Clientes (com Prévia)</span>
                    </h2>
                    <p className="text-xs opacity-60 mt-1">Carregue o arquivo Excel para visualizar os dados antes de disparar para o pipeline.</p>
                  </div>

                  <div className={`border-2 border-dashed ${temaClaro ? 'border-[#800020]/30' : 'border-emerald-500/30'} p-8 rounded-2xl text-center space-y-4`}>
                    <Upload className={`w-10 h-10 mx-auto animate-bounce ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`} />
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleCarregarPreviaExcel}
                      className="hidden" 
                      id="excelInput"
                    />
                    <label 
                      htmlFor="excelInput"
                      className={`${btnDestaque} text-xs px-6 py-3 rounded-xl cursor-pointer inline-block shadow-lg uppercase tracking-wider`}
                    >
                      Selecionar Arquivo Excel / CSV
                    </label>
                  </div>

                  {previaExcel.length > 0 && (
                    <div className="space-y-4 pt-4 border-t opacity-90">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-emerald-500">
                          Prévia da Planilha ({previaExcel.length} Clientes Encontrados)
                        </h3>
                        <button 
                          onClick={handleConfirmarImportacaoExcel}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md uppercase tracking-wider"
                        >
                          Confirmar e Salvar no Pipeline
                        </button>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto border rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className={`${bgInput} uppercase opacity-70 border-b`}>
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">ID / Código</th>
                              <th className="p-3">Nome do Cliente</th>
                              <th className="p-3">Valor Devedor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previaExcel.map((item, idx) => (
                              <tr key={idx} className="border-b hover:bg-black/5">
                                <td className="p-3 opacity-60">{idx + 1}</td>
                                <td className="p-3 font-bold">{item.codigo}</td>
                                <td className="p-3">{item.nome}</td>
                                <td className="p-3 font-bold text-rose-500">
                                  R$ {parseFloat(item.total_vencido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

              {/* EXCLUSÃO EM MASSA */}
              {subAbaAdmin === 'exclusao-massa' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-6 shadow-sm`}>
                  <div>
                    <h2 className="text-lg font-bold flex items-center space-x-2 text-rose-500">
                      <AlertTriangle className="w-6 h-6" />
                      <span>Exclusão em Massa de Clientes</span>
                    </h2>
                    <p className="text-xs opacity-60 mt-1">Limpe e organize sua base de cobrança removendo lotes de clientes com base no tempo de atraso.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className={`${bgInput} border p-5 rounded-2xl space-y-3`}>
                      <h3 className="font-bold text-sm text-slate-200">Limpar Clientes de 30 Dias</h3>
                      <p className="opacity-60">Exclui permanentemente todos os registros de clientes cadastrados na faixa de 30 dias de atraso.</p>
                      <button onClick={() => handleLimparMassaClientes('30')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg">
                        Excluir Lote 30 Dias
                      </button>
                    </div>

                    <div className={`${bgInput} border p-5 rounded-2xl space-y-3`}>
                      <h3 className="font-bold text-sm text-slate-200">Limpar Clientes de 60 Dias</h3>
                      <p className="opacity-60">Exclui permanentemente todos os registros de clientes cadastrados na faixa de 60 dias de atraso.</p>
                      <button onClick={() => handleLimparMassaClientes('60')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg">
                        Excluir Lote 60 Dias
                      </button>
                    </div>

                    <div className={`${bgInput} border p-5 rounded-2xl space-y-3`}>
                      <h3 className="font-bold text-sm text-slate-200">Limpar Clientes de 90 Dias</h3>
                      <p className="opacity-60">Exclui permanentemente todos os registros de clientes cadastrados na faixa de 90 dias de atraso.</p>
                      <button onClick={() => handleLimparMassaClientes('90')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg">
                        Excluir Lote 90 Dias
                      </button>
                    </div>

                    <div className={`${bgInput} border p-5 rounded-2xl space-y-3`}>
                      <h3 className="font-bold text-sm text-slate-200">Limpar Cancelados / Inadimplentes</h3>
                      <p className="opacity-60">Exclui permanentemente todos os clientes cancelados ou acima de 120 dias de atraso.</p>
                      <button onClick={() => handleLimparMassaClientes('120')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg">
                        Excluir Lote Cancelados
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <button onClick={() => handleLimparMassaClientes('todos')} className="w-full bg-rose-700 hover:bg-rose-600 text-white font-black py-3 rounded-xl uppercase tracking-wider">
                      ⚠️ EXCLUIR TODA A BASE DE CLIENTES DE COBRANÇA
                    </button>
                  </div>
                </div>
              )}

              {/* GERENCIAMENTO DE USUÁRIOS COM ALTERAÇÃO DE SENHA E EXCLUSÃO */}
              {subAbaAdmin === 'usuarios' && (
                <div className="grid grid-cols-3 gap-6">
                  <div className={`${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                    <h2 className={`text-base font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                      <UserPlus className="w-5 h-5" />
                      <span>{usuarioEditando ? 'Editar Usuário' : 'Cadastrar Usuário'}</span>
                    </h2>

                    <form onSubmit={e => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const payload = {
                        nome: formData.get('nome'),
                        email: formData.get('email'),
                        cargo: formData.get('cargo'),
                        senha: senhaNovaUsuario || undefined
                      };

                      const url = usuarioEditando ? `${API_URL}/usuarios/${usuarioEditando.id}` : `${API_URL}/usuarios`;
                      const method = usuarioEditando ? 'PUT' : 'POST';

                      fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                      }).then(() => {
                        e.target.reset();
                        setUsuarioEditando(null);
                        setSenhaNovaUsuario('');
                        carregarDados();
                      });
                    }} className="space-y-3 text-xs">
                      <div>
                        <label className="block mb-1 opacity-70">Nome Completo</label>
                        <input type="text" name="nome" defaultValue={usuarioEditando?.nome || ''} required className={`w-full ${bgInput} rounded-lg p-2.5`} />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">E-mail de Acesso</label>
                        <input type="email" name="email" defaultValue={usuarioEditando?.email || ''} required className={`w-full ${bgInput} rounded-lg p-2.5`} />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Cargo / Função *</label>
                        <select name="cargo" defaultValue={usuarioEditando?.cargo || 'COBRADOR'} className={`w-full ${bgInput} rounded-lg p-2.5 font-bold`}>
                          <option value="COBRADOR">COBRADOR</option>
                          <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                          <option value="SUPERVISOR">SUPERVISOR</option>
                          <option value="VENDEDOR">VENDEDOR</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70 font-semibold text-emerald-400">
                          {usuarioEditando ? 'Alterar Senha (Opcional)' : 'Senha Inicial'}
                        </label>
                        <input 
                          type="password" 
                          placeholder={usuarioEditando ? 'Deixe em branco para manter a atual' : 'Ex: 123456'} 
                          value={senhaNovaUsuario}
                          onChange={e => setSenhaNovaUsuario(e.target.value)}
                          className={`w-full ${bgInput} rounded-lg p-2.5`} 
                        />
                      </div>

                      <div className="flex space-x-2 pt-2">
                        {usuarioEditando && (
                          <>
                            <button type="button" onClick={() => handleExcluirUsuario(usuarioEditando.id)} className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-2.5 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => { setUsuarioEditando(null); setSenhaNovaUsuario(''); }} className="bg-slate-700 text-white font-bold p-2.5 rounded-lg text-xs">
                              Cancelar
                            </button>
                          </>
                        )}
                        <button type="submit" className={`flex-1 ${btnDestaque} py-2.5 rounded-lg uppercase tracking-wider`}>
                          {usuarioEditando ? 'Salvar Alterações' : 'Salvar Usuário'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                    <h2 className="text-base font-bold">Usuários Cadastrados ({usuarios.length})</h2>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {usuarios.map(u => (
                        <div key={u.id} className={`${bgInput} border p-3 rounded-xl flex items-center justify-between text-xs`}>
                          <div>
                            <p className="font-bold">{u.nome}</p>
                            <p className="opacity-60">{u.email}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${temaClaro ? 'bg-[#800020]/10 text-[#800020]' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {u.cargo}
                            </span>
                            <button onClick={() => setUsuarioEditando(u)} className={`p-1.5 rounded ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
