import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  CheckCircle, Send, Wifi, Shield, Trash2, ArrowRight, Sun, Moon, 
  UserPlus, Award, ChevronDown, ChevronRight, Upload, FileSpreadsheet, Edit3
} from 'lucide-react';

const API_URL = '/api';

const ESTAGIOS_FUNIL = [
  { id: 1, nome: 'Novos Contatos', cor: 'border-blue-500' },
  { id: 2, nome: 'Primeiro Contato', cor: 'border-cyan-500' },
  { id: 3, nome: 'Segundo Contato', cor: 'border-indigo-500' },
  { id: 4, nome: 'Terceiro Contato', cor: 'border-purple-500' },
  { id: 5, nome: 'Promessa de Pagamento', cor: 'border-amber-500' },
  { id: 6, nome: 'Acordo Realizado', cor: 'border-emerald-500' },
  { id: 7, nome: 'Recusado ou Sem Contato', cor: 'border-rose-500' }
];

const FRASES_MOTIVACIONAIS = [
  "A consistência é a chave para transformar metas em resultados extraordinários!",
  "Cada cliente atendido com excelência reforça o nosso compromisso com a qualidade.",
  "Grandes conquistas são construídas através de pequenas ações diárias.",
  "Sua dedicação hoje é o sucesso da MetroNet amanhã!",
  "Foco, resiliência e empatia transformam qualquer desafio em negociação concluída."
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [subAbaAdmin, setSubAbaAdmin] = useState('usuarios');
  const [menuAdminAberto, setMenuAdminAberto] = useState(false);
  const [temaClaro, setTemaClaro] = useState(false);
  
  const [frasePopup, setFrasePopup] = useState('');
  const [exibirPopup, setExibirPopup] = useState(false);

  // Dados
  const [clientes, setClientes] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Prévia Excel
  const [previaExcel, setPreviaExcel] = useState([]);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);

  // Chat
  const [gruposChat, setGruposChat] = useState([]);
  const [chatMensagens, setChatMensagens] = useState([]);
  const [chatTipo, setChatTipo] = useState('geral');
  const [chatDestinoId, setChatDestinoId] = useState(null);
  const [novaMsgChat, setNovaMsgChat] = useState('');

  // Modais e Drag
  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  const [clienteArrastadoId, setClienteArrastadoId] = useState(null);

  // Filtros
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [buscaAgenda, setBuscaAgenda] = useState('');

  // Edição de Usuário
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  useEffect(() => {
    if (usuario) {
      carregarDados();
      const interval = setInterval(carregarChat, 5000);
      return () => clearInterval(interval);
    }
  }, [usuario, chatTipo, chatDestinoId]);

  const carregarDados = () => {
    fetch(`${API_URL}/clientes`).then(r => r.json()).then(data => setClientes(data || [])).catch(() => {});
    fetch(`${API_URL}/agenda`).then(r => r.json()).then(data => setAgenda(data || [])).catch(() => {});
    fetch(`${API_URL}/dashboard/ranking`).then(r => r.json()).then(data => setRanking(data || [])).catch(() => {});
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
      alert('Erro ao conectar.');
    }
  };

  // LÓGICA DRAG AND DROP
  const handleDragStart = (e, clienteId) => {
    setClienteArrastadoId(clienteId);
    e.dataTransfer.setData('text/plain', clienteId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, novoEstagioId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || clienteArrastadoId;
    if (id) {
      moverEstagioCliente(parseInt(id, 10), novoEstagioId);
      setClienteArrastadoId(null);
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

  const handleExcluirCliente = (clienteId) => {
    if (confirm('Tem certeza que deseja excluir este cliente do pipeline?')) {
      fetch(`${API_URL}/clientes/${clienteId}`, { method: 'DELETE' })
        .then(() => carregarDados());
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

  // ENVIAR PLANILHA COM PRÉVIA
  const handleCarregarPreviaExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCarregandoPrevia(true);
    const formData = new FormData();
    formData.append('arquivo', file);

    fetch(`${API_URL}/clientes/previa`, { method: 'POST', body: formData })
      .then(r => r.json())
      .then(data => {
        setCarregandoPrevia(false);
        if (data.sucesso) {
          setPreviaExcel(data.dados);
        } else {
          alert('Erro ao processar planilha.');
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
      alert(`${previaExcel.length} clientes salvos no Pipeline com sucesso!`);
      setPreviaExcel([]);
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

  // ESTILOS DINÂMICOS MODO CLARO / ESCURO
  const bgPrincipal = temaClaro ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100';
  const bgCard = temaClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100';
  const bgInput = temaClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white';

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center space-x-2 text-blue-500 font-black text-3xl tracking-wider">
              <Wifi className="w-8 h-8 text-blue-400" />
              <span>METRO<span className="text-white">COB</span></span>
            </div>
            <p className="text-xs text-blue-400 tracking-widest uppercase font-semibold mt-1">POWERED BY NEXUS</p>
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
            >
              Acessar Painel MetroCob
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Developer: <span className="text-blue-400 font-bold">Thiago Pauluk</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalClientes = clientes.length;
  const totalEmAberto = clientes.reduce((acc, c) => acc + (parseFloat(c.total_vencido) || 0), 0);
  const totalRecebido = clientes.filter(c => c.estagio_id === 6).reduce((acc, c) => acc + (parseFloat(c.valor_acordo) || parseFloat(c.total_vencido) || 0), 0);

  return (
    <div className={`min-h-screen ${bgPrincipal} flex font-sans transition-colors duration-200`}>
      
      {/* POPUP MOTIVACIONAL */}
      {exibirPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 p-8 rounded-2xl max-w-lg w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Bem-vindo, {usuario.nome}!</h3>
              <p className="text-slate-300 italic text-base leading-relaxed">"{frasePopup}"</p>
            </div>
            <button 
              onClick={() => setExibirPopup(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-2.5 rounded-lg transition-all"
            >
              Iniciar Trabalho
            </button>
          </div>
        </div>
      )}

      {/* MODAL DIGITAR ACORDO */}
      {modalAcordo.exibir && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Registrar Acordo Realizado</h3>
            <form onSubmit={handleConfirmarAcordo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Valor Final do Acordo (R$)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 250,00"
                  value={modalAcordo.valor}
                  onChange={e => setModalAcordo({...modalAcordo, valor: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quantidade de Parcelas</label>
                <input 
                  type="number" 
                  min="1"
                  max="12"
                  value={modalAcordo.parcelas}
                  onChange={e => setModalAcordo({...modalAcordo, parcelas: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalAcordo({ exibir: false, clienteId: null, valor: '', parcelas: '1' })}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-lg font-semibold"
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

      {/* SIDEBAR TEMA METRONET */}
      <aside className={`w-64 ${bgCard} border-r flex flex-col justify-between transition-colors`}>
        <div>
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center space-x-2 text-blue-500 font-black text-xl tracking-wider">
              <Wifi className="w-6 h-6 text-blue-400" />
              <span>METRO<span className={temaClaro ? "text-slate-900" : "text-white"}>COB</span></span>
            </div>
            <p className="text-[10px] text-blue-400 tracking-widest uppercase font-semibold mt-0.5">POWERED BY NEXUS</p>
          </div>

          <nav className="p-4 space-y-1 text-sm font-medium">
            <button 
              onClick={() => setAbaAtiva('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'dashboard' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart2 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('pipeline')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pipeline' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              <span>Pipeline (7 Estágios)</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('cadastro-cliente')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'cadastro-cliente' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <UserPlus className="w-5 h-5" />
              <span>Cadastro de Clientes</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('agenda')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'agenda' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Calendar className="w-5 h-5" />
              <span>Agenda / Retornos</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('chat')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'chat' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat & Grupos</span>
            </button>

            {/* SUBMENU ADMINISTRAÇÃO */}
            <div>
              <button 
                onClick={() => setMenuAdminAberto(!menuAdminAberto)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'admin' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center space-x-2 ${subAbaAdmin === 'excel' && abaAtiva === 'admin' ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white'}`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Subir Planilha Excel</span>
                  </button>

                  <button 
                    onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('usuarios'); }}
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center space-x-2 ${subAbaAdmin === 'usuarios' && abaAtiva === 'admin' ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Gerenciamento Usuários</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* BOTÃO MUDAR TEMA CLARO/ESCURO */}
          <button 
            onClick={() => setTemaClaro(!temaClaro)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs text-slate-200 transition-all font-semibold"
          >
            {temaClaro ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{temaClaro ? 'Modo Escuro' : 'Modo Claro'}</span>
          </button>

          <button 
            onClick={() => setUsuario(null)}
            className="w-full flex items-center justify-center space-x-2 text-rose-400 hover:bg-rose-500/10 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER COM BUSCA UNIFICADA */}
        <header className={`h-16 ${bgCard} border-b px-6 flex items-center justify-between`}>
          <div className="relative w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Buscar cliente na página inicial, CPF, ID..."
              value={buscaGlobal}
              onChange={e => setBuscaGlobal(e.target.value)}
              className={`w-full ${bgInput} rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none`}
            />
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-blue-500 uppercase">{usuario.nome} ({usuario.cargo})</span>
          </div>
        </header>

        {/* CONTEÚDO */}
        <div className="p-6">
          
          {/* DASHBOARD COM RANKING */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Dashboard Geral e Ranking de Desempenho</h1>
                <p className="text-xs text-blue-500 font-semibold tracking-wider uppercase">METRONET INTERNET DE VERDADE</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className={`${bgCard} border p-5 rounded-2xl shadow-sm`}>
                  <p className="text-xs font-medium text-slate-400">Total em Carteira</p>
                  <p className="text-2xl font-black mt-1">{totalClientes} contatos</p>
                </div>

                <div className={`${bgCard} border p-5 rounded-2xl shadow-sm`}>
                  <p className="text-xs font-medium text-slate-400">Total em Aberto</p>
                  <p className="text-2xl font-black text-rose-500 mt-1">R$ {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className={`${bgCard} border p-5 rounded-2xl shadow-sm`}>
                  <p className="text-xs font-medium text-slate-400">Total Recuperado</p>
                  <p className="text-2xl font-black text-emerald-500 mt-1">R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* SEÇÃO RANKING OPERADORES */}
              <div className={`${bgCard} border p-6 rounded-2xl space-y-4 shadow-sm`}>
                <h2 className="text-base font-bold flex items-center space-x-2 text-amber-500">
                  <Award className="w-5 h-5" />
                  <span>Ranking de Operadores — Maior Volume de Acordos</span>
                </h2>

                <div className="space-y-3">
                  {ranking.map((op, idx) => (
                    <div key={idx} className={`${bgInput} p-4 rounded-xl flex items-center justify-between border border-slate-700/50`}>
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{op.operador}</p>
                          <p className="text-xs text-slate-400">{op.total_acordos} acordos efetuados</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-500">
                        R$ {parseFloat(op.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PIPELINE COM DRAG AND DROP E BOTÃO EXCLUIR */}
          {abaAtiva === 'pipeline' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Pipeline de Cobrança (Arraste com o Rato)</h1>
                
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Filtrar cliente na pipeline..."
                    value={buscaPipeline}
                    onChange={e => setBuscaPipeline(e.target.value)}
                    className={`w-full ${bgInput} rounded-lg pl-9 pr-3 py-1.5 text-xs`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-3 overflow-x-auto pb-4">
                {ESTAGIOS_FUNIL.map(estagio => {
                  const clientesEstagio = clientes.filter(c => 
                    (c.estagio_id || 1) === estagio.id && 
                    (c.nome?.toLowerCase().includes(buscaPipeline.toLowerCase()) || c.codigo?.toLowerCase().includes(buscaPipeline.toLowerCase()))
                  );

                  return (
                    <div 
                      key={estagio.id} 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, estagio.id)}
                      className={`${bgCard} border rounded-2xl p-3 min-w-[210px] flex flex-col h-[680px] transition-colors hover:border-blue-500/30`}
                    >
                      <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                        <span className="text-xs font-bold truncate">{estagio.nome}</span>
                        <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">
                          {clientesEstagio.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {clientesEstagio.map(cli => (
                          <div 
                            key={cli.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, cli.id)}
                            className={`${bgInput} border border-slate-700/50 p-3 rounded-xl space-y-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-500 transition-all`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="truncate pr-1">
                                <p className="text-xs font-bold truncate">{cli.nome}</p>
                                <p className="text-[10px] text-slate-400">ID: {cli.codigo}</p>
                              </div>
                              <button 
                                onClick={() => handleExcluirCliente(cli.id)}
                                title="Excluir do Pipeline"
                                className="text-rose-400 hover:text-rose-600 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-rose-500">
                                R$ {parseFloat(cli.total_vencido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                              {estagio.id > 1 && (
                                <button 
                                  onClick={() => moverEstagioCliente(cli.id, estagio.id - 1)}
                                  className="text-[10px] text-slate-400 hover:text-blue-400"
                                >
                                  ← Voltar
                                </button>
                              )}
                              {estagio.id < 7 && (
                                <button 
                                  onClick={() => moverEstagioCliente(cli.id, estagio.id + 1)}
                                  className="text-[10px] text-blue-500 font-bold hover:text-blue-400 ml-auto flex items-center space-x-1"
                                >
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

          {/* AGENDA */}
          {abaAtiva === 'agenda' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                <h2 className="text-base font-bold flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
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
                    <label className="block text-slate-400 mb-1 font-semibold">Cliente *</label>
                    <input type="text" name="cliente_nome" required placeholder="Nome do cliente" className={`w-full ${bgInput} rounded-lg p-2.5`} />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Data e Hora *</label>
                    <input type="datetime-local" name="data_retorno" required className={`w-full ${bgInput} rounded-lg p-2.5`} />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Observação</label>
                    <textarea name="observacao" rows="3" className={`w-full ${bgInput} rounded-lg p-2.5`}></textarea>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2.5 rounded-lg text-white transition-all">
                    Salvar na Agenda
                  </button>
                </form>
              </div>

              <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">Compromissos Agendados</h2>
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Filtrar cliente na agenda..."
                      value={buscaAgenda}
                      onChange={e => setBuscaAgenda(e.target.value)}
                      className={`w-full ${bgInput} rounded-lg pl-9 pr-3 py-1.5 text-xs`}
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {agenda
                    .filter(a => a.cliente_nome?.toLowerCase().includes(buscaAgenda.toLowerCase()))
                    .map(item => (
                      <div key={item.id} className={`${bgInput} border border-slate-700/50 p-4 rounded-xl flex items-center justify-between text-xs`}>
                        <div>
                          <p className="font-bold">{item.cliente_nome}</p>
                          <p className="text-blue-500 font-semibold">📅 {item.data_retorno}</p>
                          <p className="text-slate-400 mt-1">{item.observacao}</p>
                        </div>
                        <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-200 text-[10px] font-bold uppercase">
                          {item.usuario_nome}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAT */}
          {abaAtiva === 'chat' && (
            <div className="grid grid-cols-4 gap-6 h-[600px]">
              <div className={`${bgCard} border p-4 rounded-2xl space-y-4 shadow-sm`}>
                <h3 className="text-sm font-bold">Canais / Conversas</h3>
                <div className="space-y-2 text-xs">
                  <button 
                    onClick={() => { setChatTipo('geral'); setChatDestinoId(null); }}
                    className={`w-full text-left p-2.5 rounded-xl font-bold ${chatTipo === 'geral' ? 'bg-blue-600 text-white' : `${bgInput}`}`}
                  >
                    # Geral (Todos)
                  </button>

                  <p className="text-[10px] font-bold uppercase text-slate-400 mt-3">Operadores</p>
                  {usuarios.filter(u => u.id !== usuario.id).map(u => (
                    <button 
                      key={u.id}
                      onClick={() => { setChatTipo('direto'); setChatDestinoId(u.id); }}
                      className={`w-full text-left p-2 rounded-lg truncate ${chatTipo === 'direto' && chatDestinoId === u.id ? 'bg-blue-600 text-white font-bold' : `${bgInput}`}`}
                    >
                      👤 {u.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`col-span-3 ${bgCard} border rounded-2xl p-5 flex flex-col shadow-sm`}>
                <div className={`flex-1 overflow-y-auto space-y-3 p-3 ${bgInput} rounded-xl mb-4 border border-slate-700/50`}>
                  {chatMensagens.map(msg => (
                    <div key={msg.id} className={`${bgCard} p-3 rounded-xl text-xs space-y-1 shadow-sm`}>
                      <div className="flex justify-between items-center font-bold text-blue-500">
                        <span>{msg.remetente_nome}</span>
                        <span className="text-[10px] text-slate-400">{new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{msg.mensagem}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleEnviarChat} className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Escreva sua mensagem..."
                    value={novaMsgChat}
                    onChange={e => setNovaMsgChat(e.target.value)}
                    className={`flex-1 ${bgInput} rounded-xl px-4 py-2.5 text-xs focus:outline-none`}
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-bold">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SUBMENU ADMINISTRAÇÃO */}
          {abaAtiva === 'admin' && (
            <div className="space-y-6">
              
              {/* SUB-ABA: IMPORTAR EXCEL COM PRÉVIA */}
              {subAbaAdmin === 'excel' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-6 shadow-sm`}>
                  <div>
                    <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-500">
                      <FileSpreadsheet className="w-6 h-6" />
                      <span>Subir Planilha de Clientes (com Prévia)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Carregue o arquivo Excel para visualizar a lista antes de salvar no pipeline.</p>
                  </div>

                  <div className="border-2 border-dashed border-blue-500/30 p-8 rounded-2xl text-center space-y-4">
                    <Upload className="w-10 h-10 text-blue-500 mx-auto animate-bounce" />
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleCarregarPreviaExcel}
                      className="hidden" 
                      id="excelInput"
                    />
                    <label 
                      htmlFor="excelInput"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer inline-block shadow-lg"
                    >
                      Selecionar Arquivo Excel / CSV
                    </label>
                  </div>

                  {/* TABELA DE PRÉVIA */}
                  {previaExcel.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-emerald-500">
                          Prévia da Planilha ({previaExcel.length} Clientes Encontrados)
                        </h3>
                        <button 
                          onClick={handleConfirmarImportacaoExcel}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
                        >
                          Confirmar e Salvar no Pipeline
                        </button>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto border border-slate-700/50 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className={`${bgInput} uppercase text-slate-400 border-b border-slate-700`}>
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">ID / Código</th>
                              <th className="p-3">Nome do Cliente</th>
                              <th className="p-3">Valor Devedor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previaExcel.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                                <td className="p-3 text-slate-400">{idx + 1}</td>
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

              {/* SUB-ABA: GERENCIAMENTO DE USUÁRIOS */}
              {subAbaAdmin === 'usuarios' && (
                <div className="grid grid-cols-3 gap-6">
                  <div className={`${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                    <h2 className="text-base font-bold flex items-center space-x-2">
                      <UserPlus className="w-5 h-5 text-blue-500" />
                      <span>{usuarioEditando ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</span>
                    </h2>

                    <form onSubmit={e => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const payload = {
                        nome: formData.get('nome'),
                        email: formData.get('email'),
                        cargo: formData.get('cargo'),
                        senha: '123456'
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
                        carregarDados();
                      });
                    }} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Nome Completo</label>
                        <input type="text" name="nome" defaultValue={usuarioEditando?.nome || ''} required className={`w-full ${bgInput} rounded-lg p-2.5`} />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">E-mail de Acesso</label>
                        <input type="email" name="email" defaultValue={usuarioEditando?.email || ''} required className={`w-full ${bgInput} rounded-lg p-2.5`} />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Cargo</label>
                        <select name="cargo" defaultValue={usuarioEditando?.cargo || 'OPERADOR'} className={`w-full ${bgInput} rounded-lg p-2.5`}>
                          <option value="OPERADOR">OPERADOR</option>
                          <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                        </select>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        {usuarioEditando && (
                          <button type="button" onClick={() => setUsuarioEditando(null)} className="w-1/2 bg-slate-700 text-white font-bold py-2 rounded-lg">
                            Cancelar
                          </button>
                        )}
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg">
                          {usuarioEditando ? 'Salvar Alterações' : 'Salvar Usuário'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm`}>
                    <h2 className="text-base font-bold">Usuários Cadastrados</h2>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {usuarios.map(u => (
                        <div key={u.id} className={`${bgInput} border border-slate-700/50 p-3 rounded-xl flex items-center justify-between text-xs`}>
                          <div>
                            <p className="font-bold">{u.nome}</p>
                            <p className="text-slate-400">{u.email}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-600/20 text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {u.cargo}
                            </span>
                            <button onClick={() => setUsuarioEditando(u)} className="p-1.5 text-blue-400 hover:bg-slate-800 rounded">
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
