import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Shield, Trash2, ArrowRight, Sun, Moon, Filter, GripHorizontal,
  Award, ChevronDown, ChevronRight, Upload, Edit3, HeartHandshake, 
  PlusCircle, Bell, Wrench, BookOpen, CheckCircle, TrendingUp, Phone, UserPlus, CalendarPlus, Star
} from 'lucide-react';

const API_URL = '/api';

const ESTAGIOS_COBRANCA = [
  { id: 1, nome: 'Novos Contatos', cor: 'border-zinc-500' },
  { id: 2, nome: '1ª Tentativa', cor: 'border-orange-300' },
  { id: 3, nome: '2ª Tentativa', cor: 'border-orange-400' },
  { id: 4, nome: '3ª Tentativa', cor: 'border-orange-500' },
  { id: 5, nome: 'Em Contato', cor: 'border-amber-500' },
  { id: 6, nome: 'Acordo Realizado', cor: 'border-green-500' },
  { id: 7, nome: 'Acordo Pago', cor: 'border-emerald-600' },
  { id: 8, nome: 'Recusa Contato', cor: 'border-red-500' }
];

const ESTAGIOS_POS_VENDA = [
  { id: 1, nome: 'Venda Instalada', cor: 'border-orange-500' },
  { id: 2, nome: 'Acompanhamento 15 Dias', cor: 'border-cyan-500' },
  { id: 3, nome: 'Acompanhamento 30 Dias', cor: 'border-blue-500' },
  { id: 4, nome: 'Satisfação do Cliente', cor: 'border-emerald-500' }
];

const ESTAGIOS_OS = [
  { id: 1, nome: 'Problema Resolvido?', cor: 'border-orange-500' },
  { id: 2, nome: 'Acompanhar 5 Dias', cor: 'border-cyan-500' },
  { id: 3, nome: 'Acompanhar Qualidade', cor: 'border-blue-500' },
  { id: 4, nome: 'Nota da Resolução', cor: 'border-amber-500' },
  { id: 5, nome: 'Feedback do Cliente', cor: 'border-emerald-500' }
];

export default function App() {
  // Autenticação, Tema e Layout
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [temaEscuro, setTemaEscuro] = useState(() => localStorage.getItem('nexus_theme') !== 'light');

  // Menus e Navegação
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  
  const [menuCobranca, setMenuCobranca] = useState(false);
  const [subAbaCobranca, setSubAbaCobranca] = useState('pipeline');
  
  const [menuPosVenda, setMenuPosVenda] = useState(false);
  const [subAbaPosVenda, setSubAbaPosVenda] = useState('pipeline');
  
  const [menuOS, setMenuOS] = useState(false);
  const [subAbaOS, setSubAbaOS] = useState('pipeline');
  
  const [menuAdmin, setMenuAdmin] = useState(false);
  const [subAbaAdmin, setSubAbaAdmin] = useState('usuarios');

  // Estados de Dados
  const [clientes, setClientes] = useState([]);
  const [posVendas, setPosVendas] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);
  
  const [contatosCobranca, setContatosCobranca] = useState([]);
  const [contatosAtivos, setContatosAtivos] = useState([]);
  const [listaUpgrade, setListaUpgrade] = useState([]);
  
  const [scripts, setScripts] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [chatMensagens, setChatMensagens] = useState([]);
  
  // Filtros
  const [buscaPipeline, setBuscaPipeline] = useState('');

  // Estados de Importação
  const [previaPlanilha, setPreviaPlanilha] = useState([]);
  const [tipoImportacao, setTipoImportacao] = useState('cobranca'); // cobranca, vendas_ativas, upgrade
  const [categoriaCobranca, setCategoriaCobranca] = useState('30');

  // Modais de Interação
  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  const [modalAgendaRapida, setModalAgendaRapida] = useState({ exibir: false, clienteNome: '', clienteId: null, tipo: '' });
  const [modalSatisfacao, setModalSatisfacao] = useState({ exibir: false, vendaId: null, nota: 5 });
  const [modalFeedbackOS, setModalFeedbackOS] = useState({ exibir: false, osId: null, resolvida: 'Sim', nota: 5, feedback: '' });
  
  // Entradas de Formulário
  const [novoCliente, setNovoCliente] = useState({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
  const [novoPosVenda, setNovoPosVenda] = useState({ codigo: '', nome: '', telefone: '', plano: '', vendedor: '' });
  const [novaOS, setNovaOS] = useState({ cliente_nome: '', problema: '', tipo_ocorrencia: 'Suporte Técnico' });
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', cargo: 'COBRADOR', senha: '' });
  const [novoScript, setNovoScript] = useState({ titulo: '', tipo: 'cobranca', conteudo: '' });
  const [novaMsgChat, setNovaMsgChat] = useState('');

  useEffect(() => {
    localStorage.setItem('nexus_theme', temaEscuro ? 'dark' : 'light');
    if (temaEscuro) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [temaEscuro]);

  useEffect(() => {
    if (usuario) carregarDados();
  }, [usuario, abaAtiva]);

  // Função Simulação de Carregamento (Para Interface Funcionar sem Backend Quebrar)
  const carregarDados = () => {
    fetch(`${API_URL}/clientes`).then(r => r.json()).then(data => setClientes(data || [])).catch(() => {});
    fetch(`${API_URL}/pos-venda`).then(r => r.json()).then(data => setPosVendas(data || [])).catch(() => {});
    fetch(`${API_URL}/os`).then(r => r.json()).then(data => setOrdensServico(data || [])).catch(() => {});
    fetch(`${API_URL}/usuarios`).then(r => r.json()).then(data => setUsuarios(data || [])).catch(() => {});
    fetch(`${API_URL}/agenda?usuario_id=${usuario.id}`).then(r => r.json()).then(data => setAgenda(data || [])).catch(() => {});
    fetch(`${API_URL}/chat/mensagens`).then(r => r.json()).then(data => setChatMensagens(data || [])).catch(() => {});
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
      if (data.sucesso) setUsuario(data.usuario);
      else alert('Dados incorretos, ou backend offline (usando mock).');
    } catch (err) {
      // Mock de login para o front-end funcionar sem backend
      setUsuario({ id: 1, nome: emailLogin.split('@')[0], email: emailLogin, cargo: 'ADMIN' });
    }
  };

  // ================= DRAG AND DROP =================
  const onDragStart = (e, item) => {
    e.dataTransfer.setData("itemId", item.id);
    e.dataTransfer.setData("itemType", item.tipoPipeline); // 'cobranca', 'pos-venda', 'os'
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (e, estagioId, tipoPipeline) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("itemId");
    const type = e.dataTransfer.getData("itemType");

    if (type !== tipoPipeline) return; // Nao permite misturar os cards

    if (tipoPipeline === 'cobranca') {
      if (estagioId === 6) setModalAcordo({ exibir: true, clienteId: id, valor: '', parcelas: '1' });
      else moverCardAPI(id, estagioId, 'clientes');
    } else if (tipoPipeline === 'pos-venda') {
      if (estagioId === 4) setModalSatisfacao({ exibir: true, vendaId: id, nota: 5 });
      else moverCardAPI(id, estagioId, 'pos-venda');
    } else if (tipoPipeline === 'os') {
      if (estagioId === 4 || estagioId === 5) setModalFeedbackOS({ exibir: true, osId: id, resolvida: 'Sim', nota: 5, feedback: '' });
      else moverCardAPI(id, estagioId, 'os');
    }
  };

  const moverCardAPI = (id, estagioId, endpoint) => {
    fetch(`${API_URL}/${endpoint}/${id}/estagio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estagio_id: estagioId, usuario_nome: usuario.nome })
    }).then(() => carregarDados()).catch(() => {
      // Atualização otimista caso sem API
      if(endpoint === 'clientes') setClientes(c => c.map(x => x.id == id ? {...x, estagio_id: estagioId} : x));
      if(endpoint === 'pos-venda') setPosVendas(p => p.map(x => x.id == id ? {...x, estagio_id: estagioId} : x));
      if(endpoint === 'os') setOrdensServico(o => o.map(x => x.id == id ? {...x, estagio_id: estagioId} : x));
    });
  };

  // ================= MODAIS E AÇÕES DE AVANÇO =================
  const confirmarAcordo = (e) => {
    e.preventDefault();
    // Simula chamada API
    setClientes(c => c.map(x => x.id == modalAcordo.clienteId ? {...x, estagio_id: 6, valor_acordo: modalAcordo.valor} : x));
    setModalAcordo({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  };

  const confirmarAgendaRapida = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    
    const novoAgendamento = {
      id: Date.now(),
      cliente_nome: modalAgendaRapida.clienteNome,
      data_retorno: amanha.toISOString().split('T')[0],
      observacao: 'Agendamento rápido pelo pipeline',
      tipo: modalAgendaRapida.tipo
    };

    setAgenda([...agenda, novoAgendamento]);
    setModalAgendaRapida({ exibir: false, clienteNome: '', clienteId: null, tipo: '' });
    alert('Adicionado à sua agenda para amanhã!');
  };

  // ================= ADMINISTRAÇÃO E LISTAS =================
  const handleSimularUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simula a leitura de 3 linhas de um CSV
      setPreviaPlanilha([
        { id: 101, nome: 'João Silva', telefone: '11999999999', plano: 'Fibra 300MB', total_vencido: '150.00' },
        { id: 102, nome: 'Maria Santos', telefone: '11988888888', plano: 'Fibra 500MB', total_vencido: '200.00' }
      ]);
    }
  };

  const confirmarImportacao = () => {
    if (tipoImportacao === 'cobranca') setContatosCobranca([...contatosCobranca, ...previaPlanilha]);
    if (tipoImportacao === 'vendas_ativas') setContatosAtivos([...contatosAtivos, ...previaPlanilha]);
    if (tipoImportacao === 'upgrade') setListaUpgrade([...listaUpgrade, ...previaPlanilha]);
    setPreviaPlanilha([]);
    alert('Lista importada com sucesso!');
  };

  const exclusaoEmMassa = (tipo) => {
    if(confirm(`Tem certeza que deseja limpar a lista de ${tipo}?`)) {
      if(tipo === 'cobranca') setContatosCobranca([]);
      if(tipo === 'vendas_ativas') setContatosAtivos([]);
      if(tipo === 'upgrade') setListaUpgrade([]);
    }
  };

  // ================= RENDERIZAÇÃO =================
  if (!usuario) {
    return (
      <div className={`min-h-screen ${temaEscuro ? 'bg-black' : 'bg-gray-100'} flex flex-col justify-center items-center p-4 font-sans`}>
        <div className={`w-full max-w-md ${temaEscuro ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-200'} border p-8 rounded-3xl shadow-2xl space-y-6`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl mb-3 shadow-lg shadow-orange-500/30">
              N
            </div>
            <h1 className={`text-2xl font-black tracking-wider ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>NEXUS <span className="text-orange-500">COB</span></h1>
            <p className="text-xs text-orange-500/80 mt-1 font-bold tracking-widest uppercase">Inteligência & Resultados</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider ${temaEscuro ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>E-mail de Acesso</label>
              <input type="email" required value={emailLogin} onChange={e => setEmailLogin(e.target.value)} className={`w-full ${temaEscuro ? 'bg-black border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500`} />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider ${temaEscuro ? 'text-zinc-400' : 'text-gray-500'} mb-1`}>Senha</label>
              <input type="password" required value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} className={`w-full ${temaEscuro ? 'bg-black border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500`} />
            </div>
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-3.5 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider">
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  const bgPrincipal = temaEscuro ? 'bg-black text-white' : 'bg-[#F3F4F6] text-gray-900';
  const bgCard = temaEscuro ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-200';
  const inputTheme = temaEscuro ? 'bg-black border-zinc-800 text-white focus:border-orange-500' : 'bg-gray-50 border-gray-300 text-black focus:border-orange-500';

  return (
    <div className={`min-h-screen ${bgPrincipal} flex font-sans`}>
      
      {/* ================= MODAIS ================= */}
      {modalAgendaRapida.exibir && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${bgCard} border p-6 rounded-3xl max-w-sm w-full space-y-4 text-center`}>
            <CalendarPlus className="w-12 h-12 text-orange-500 mx-auto" />
            <h3 className="text-lg font-bold">Agendar Retorno</h3>
            <p className="text-sm opacity-70">Deseja adicionar <b>{modalAgendaRapida.clienteNome}</b> na sua agenda para entrar em contato amanhã?</p>
            <div className="flex space-x-2 pt-4">
              <button onClick={() => setModalAgendaRapida({exibir: false})} className="w-1/2 bg-zinc-800 text-white py-3 rounded-xl font-bold">Cancelar</button>
              <button onClick={confirmarAgendaRapida} className="w-1/2 bg-orange-500 text-black py-3 rounded-xl font-black">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {modalAcordo.exibir && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${bgCard} border p-6 rounded-3xl max-w-md w-full space-y-4`}>
            <h3 className="text-lg font-bold text-orange-500">Registrar Acordo Realizado</h3>
            <form onSubmit={confirmarAcordo} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-70">Valor do Acordo (R$)</label>
                <input type="text" required value={modalAcordo.valor} onChange={e => setModalAcordo({...modalAcordo, valor: e.target.value})} className={`w-full ${inputTheme} border p-3 rounded-xl`} />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalAcordo({exibir:false})} className="w-1/2 bg-zinc-800 text-white py-3 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="w-1/2 bg-orange-500 text-black py-3 rounded-xl font-bold">Salvar Acordo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`w-[260px] ${temaEscuro ? 'bg-[#0a0a0a] border-zinc-900' : 'bg-white border-gray-200'} border-r flex flex-col justify-between p-4 shadow-xl z-10`}>
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-orange-500 text-black rounded-xl flex items-center justify-center font-black text-xl">N</div>
            <div>
              <span className="font-black text-lg tracking-wide">NEXUS<span className="text-orange-500">COB</span></span>
              <p className="text-[9px] text-orange-500/80 font-bold uppercase tracking-widest">Painel Operacional</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {/* Dashboard */}
            <button onClick={() => setAbaAtiva('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'dashboard' ? 'bg-orange-500 text-black font-black' : 'opacity-70 hover:opacity-100 hover:bg-zinc-800/50'}`}>
              <BarChart2 className="w-4 h-4"/> <span>DASHBOARD / RANKING</span>
            </button>

            {/* COBRANÇA */}
            <div>
              <button onClick={() => setMenuCobranca(!menuCobranca)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva.startsWith('cob_') ? 'bg-zinc-900 text-orange-500' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Users className="w-4 h-4"/><span>COBRANÇA</span></div>
                {menuCobranca ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuCobranca && (
                <div className="ml-4 mt-1 border-l border-zinc-800 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => {setAbaAtiva('cob_pipeline'); setSubAbaCobranca('pipeline')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_pipeline' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Pipeline Cobrança</button>
                  <button onClick={() => {setAbaAtiva('cob_cadastro'); setSubAbaCobranca('cadastro')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_cadastro' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Cadastro de Cliente</button>
                  <button onClick={() => {setAbaAtiva('cob_agenda'); setSubAbaCobranca('agenda')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_agenda' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Sua Agenda</button>
                  <button onClick={() => {setAbaAtiva('cob_scripts'); setSubAbaCobranca('scripts')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_scripts' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Script de Cobrança</button>
                  <button onClick={() => {setAbaAtiva('cob_contatos'); setSubAbaCobranca('contatos')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_contatos' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Contatos (Lista)</button>
                  <button onClick={() => {setAbaAtiva('cob_chat'); setSubAbaCobranca('chat')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_chat' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Chat Interno (Cob)</button>
                </div>
              )}
            </div>

            {/* PÓS VENDAS RESIDENCIAL */}
            <div>
              <button onClick={() => setMenuPosVenda(!menuPosVenda)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva.startsWith('pos_') ? 'bg-zinc-900 text-orange-500' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><HeartHandshake className="w-4 h-4"/><span>PÓS-VENDAS / VENDAS</span></div>
                {menuPosVenda ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuPosVenda && (
                <div className="ml-4 mt-1 border-l border-zinc-800 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => {setAbaAtiva('pos_pipeline'); setSubAbaPosVenda('pipeline')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_pipeline' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Pipeline Vendas/Pós</button>
                  <button onClick={() => {setAbaAtiva('pos_cadastro'); setSubAbaPosVenda('cadastro')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_cadastro' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Cadastro de Cliente</button>
                  <button onClick={() => {setAbaAtiva('pos_agenda'); setSubAbaPosVenda('agenda')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_agenda' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Sua Agenda (Vendas)</button>
                  <button onClick={() => {setAbaAtiva('pos_contatos'); setSubAbaPosVenda('contatos_ativos')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_contatos' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Contatos Ativos (Lista)</button>
                  <button onClick={() => {setAbaAtiva('pos_upgrade'); setSubAbaPosVenda('upgrade')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_upgrade' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Lista Up-Grade</button>
                  <button onClick={() => {setAbaAtiva('pos_scripts'); setSubAbaPosVenda('scripts')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_scripts' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Script de Vendas</button>
                  <button onClick={() => {setAbaAtiva('pos_chat'); setSubAbaPosVenda('chat')}} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_chat' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Chat Interno (Vendas)</button>
                </div>
              )}
            </div>

            {/* QUALIDADE / O.S */}
            <div>
              <button onClick={() => setMenuOS(!menuOS)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva.startsWith('os_') ? 'bg-zinc-900 text-orange-500' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Wrench className="w-4 h-4"/><span>QUALIDADE (O.S.)</span></div>
                {menuOS ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuOS && (
                <div className="ml-4 mt-1 border-l border-zinc-800 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('os_pipeline')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'os_pipeline' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Pipeline O.S.</button>
                  <button onClick={() => setAbaAtiva('os_cadastro')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'os_cadastro' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Cadastro O.S.</button>
                </div>
              )}
            </div>

            {/* ADMINISTRAÇÃO */}
            <div>
              <button onClick={() => setMenuAdmin(!menuAdmin)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva.startsWith('admin_') ? 'bg-zinc-900 text-orange-500' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Settings className="w-4 h-4"/><span>ADMINISTRAÇÃO</span></div>
                {menuAdmin ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuAdmin && (
                <div className="ml-4 mt-1 border-l border-zinc-800 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('admin_usuarios')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'admin_usuarios' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Usuários e Permissões</button>
                  <button onClick={() => setAbaAtiva('admin_listas')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'admin_listas' ? 'text-orange-500 bg-orange-500/10' : 'opacity-70 hover:opacity-100'}`}>Gerenciar Listas (Upload)</button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <button onClick={() => setTemaEscuro(!temaEscuro)} className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 py-2.5 rounded-xl text-xs transition-all font-semibold">
            {temaEscuro ? <Sun className="w-4 h-4 text-amber-500"/> : <Moon className="w-4 h-4 text-orange-500"/>}
            <span>{temaEscuro ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>
          
          <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold truncate max-w-[120px]">{usuario.nome}</p>
              <p className="text-[9px] text-orange-500 font-bold">{usuario.cargo}</p>
            </div>
            <button onClick={() => setUsuario(null)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </aside>

      {/* ================= ÁREA DE CONTEÚDO PRINCIPAL ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Fixo */}
        <header className={`h-16 ${bgCard} border-b flex items-center justify-between px-6 shrink-0`}>
          <h2 className="text-sm font-black uppercase tracking-wider text-orange-500">
            {abaAtiva.replace('_', ' - ')}
          </h2>
          <div className="relative w-72">
            <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-2.5" />
            <input type="text" placeholder="Buscar cliente por nome ou ID..." value={buscaPipeline} onChange={e => setBuscaPipeline(e.target.value)} className={`w-full ${inputTheme} border rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-orange-500`} />
          </div>
        </header>

        {/* Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* DASHBOARD RANKINGS */}
          {abaAtiva === 'dashboard' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${bgCard} border p-5 rounded-3xl`}>
                <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 mb-3 text-green-500">
                  <Award className="w-5 h-5" /> <h3 className="font-bold text-sm">Ranking Acordos (Cobrança)</h3>
                </div>
                {/* Mock Ranking */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between bg-zinc-900 p-2 rounded-lg"><span>1. Carlos Silva</span><span className="font-bold text-orange-500">R$ 15.200</span></div>
                  <div className="flex justify-between bg-zinc-900 p-2 rounded-lg"><span>2. Ana Paula</span><span className="font-bold text-orange-500">R$ 12.100</span></div>
                </div>
              </div>

              <div className={`${bgCard} border p-5 rounded-3xl`}>
                <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 mb-3 text-cyan-500">
                  <Award className="w-5 h-5" /> <h3 className="font-bold text-sm">Ranking Vendas (Pos-Venda)</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between bg-zinc-900 p-2 rounded-lg"><span>1. Roberto M.</span><span className="font-bold text-orange-500">45 Vendas</span></div>
                  <div className="flex justify-between bg-zinc-900 p-2 rounded-lg"><span>2. Juliana C.</span><span className="font-bold text-orange-500">38 Vendas</span></div>
                </div>
              </div>

              <div className={`${bgCard} border p-5 rounded-3xl`}>
                <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 mb-3 text-purple-500">
                  <Award className="w-5 h-5" /> <h3 className="font-bold text-sm">Ranking Upgrades</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between bg-zinc-900 p-2 rounded-lg"><span>1. Felipe T.</span><span className="font-bold text-orange-500">22 Upgrades</span></div>
                </div>
              </div>
            </div>
          )}

          {/* PIPELINE COBRANÇA (COM ARRASTAR) */}
          {abaAtiva === 'cob_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-[75vh] pb-4">
              {ESTAGIOS_COBRANCA.map(estagio => {
                const lista = clientes.filter(c => (c.estagio_id || 1) === estagio.id && (c.nome.toLowerCase().includes(buscaPipeline.toLowerCase()) || c.codigo?.includes(buscaPipeline)));
                return (
                  <div key={estagio.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, estagio.id, 'cobranca')} className={`${bgCard} border rounded-3xl p-3 min-w-[260px] flex flex-col`}>
                    <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                      <span className="text-[11px] font-bold uppercase">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-zinc-800 text-orange-500">{lista.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {lista.map(cli => (
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'cobranca'})} className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl cursor-grab hover:border-orange-500/50 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold">{cli.nome}</p>
                              <p className="text-[9px] opacity-60">ID: {cli.codigo}</p>
                            </div>
                            <button onClick={() => setModalAgendaRapida({exibir:true, clienteNome: cli.nome, clienteId: cli.id, tipo:'cobranca'})} title="Agendar para amanhã" className="text-orange-500 hover:bg-orange-500/20 p-1.5 rounded-lg"><CalendarPlus className="w-4 h-4"/></button>
                          </div>
                          <p className="text-xs font-black text-red-500 mt-2">R$ {parseFloat(cli.total_vencido||0).toFixed(2)}</p>
                          {cli.valor_acordo > 0 && <p className="text-[10px] font-bold text-green-500">Acordo: R$ {cli.valor_acordo}</p>}
                          <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between items-center text-[9px] opacity-70">
                            <span className="flex items-center space-x-1"><UserPlus className="w-3 h-3"/> <span>{cli.usuario_nome || 'Sem operador'}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* PIPELINE PÓS VENDAS */}
          {abaAtiva === 'pos_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-[75vh] pb-4">
              {ESTAGIOS_POS_VENDA.map(estagio => {
                const lista = posVendas.filter(c => (c.estagio_id || 1) === estagio.id && c.nome.toLowerCase().includes(buscaPipeline.toLowerCase()));
                return (
                  <div key={estagio.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, estagio.id, 'pos-venda')} className={`${bgCard} border rounded-3xl p-3 min-w-[260px] flex flex-col`}>
                    <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                      <span className="text-[11px] font-bold uppercase">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-zinc-800 text-orange-500">{lista.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {lista.map(cli => (
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'pos-venda'})} className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl cursor-grab hover:border-orange-500/50">
                          <p className="text-xs font-bold">{cli.nome}</p>
                          <p className="text-[10px] text-cyan-400 mt-1">Plano: {cli.plano}</p>
                          {cli.nota_satisfacao && <p className="text-[10px] text-emerald-400 font-bold flex items-center"><Star className="w-3 h-3 mr-1 fill-current"/> Nota: {cli.nota_satisfacao}</p>}
                          <div className="mt-2 pt-2 border-t border-zinc-800 text-[9px] opacity-70">
                            Vendedor: {cli.vendedor || 'Não atribuído'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* PIPELINE O.S. (QUALIDADE) */}
          {abaAtiva === 'os_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-[75vh] pb-4">
              {ESTAGIOS_OS.map(estagio => {
                const lista = ordensServico.filter(c => (c.estagio_id || 1) === estagio.id);
                return (
                  <div key={estagio.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, estagio.id, 'os')} className={`${bgCard} border rounded-3xl p-3 min-w-[260px] flex flex-col`}>
                    <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                      <span className="text-[11px] font-bold uppercase">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-zinc-800 text-orange-500">{lista.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {lista.map(cli => (
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'os'})} className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl cursor-grab hover:border-orange-500/50">
                          <p className="text-xs font-bold">{cli.cliente_nome}</p>
                          <p className="text-[10px] text-red-400 font-semibold line-clamp-2 mt-1">Problema: {cli.problema}</p>
                          <div className="mt-2 pt-2 border-t border-zinc-800 text-[9px] opacity-70">
                            Tipo: {cli.tipo_ocorrencia}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ADMINISTRAÇÃO LISTAS & USUARIOS */}
          {abaAtiva === 'admin_listas' && (
            <div className="grid grid-cols-2 gap-6">
              <div className={`${bgCard} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-orange-500 border-b border-zinc-800 pb-2">Subir Planilha (Upload)</h3>
                <select value={tipoImportacao} onChange={e=>setTipoImportacao(e.target.value)} className={`w-full ${inputTheme} border p-3 rounded-xl text-xs`}>
                  <option value="cobranca">Lista de Cobrança (30, 60, 90, Cancelados)</option>
                  <option value="vendas_ativas">Lista Vendas Ativas (Contatos)</option>
                  <option value="upgrade">Lista de Up-Grade</option>
                </select>
                {tipoImportacao === 'cobranca' && (
                  <select className={`w-full ${inputTheme} border p-3 rounded-xl text-xs`}>
                    <option>Em Massa - 30 Dias</option>
                    <option>Em Massa - 60 Dias</option>
                    <option>Em Massa - 90 Dias</option>
                    <option>Cancelados</option>
                  </select>
                )}
                <input type="file" onChange={handleSimularUpload} className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-orange-500 file:text-black file:font-bold hover:file:bg-orange-600"/>
                <button onClick={confirmarImportacao} disabled={previaPlanilha.length===0} className="w-full bg-orange-500 disabled:opacity-50 text-black py-3 rounded-xl font-black text-xs uppercase tracking-wider">Confirmar e Adicionar</button>
              </div>

              <div className={`${bgCard} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-red-500 border-b border-zinc-800 pb-2">Exclusão em Massa</h3>
                <div className="space-y-3">
                  <button onClick={() => exclusaoEmMassa('cobranca')} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 py-3 rounded-xl font-bold text-xs uppercase border border-red-500/30">🗑️ Limpar Lista de Cobrança</button>
                  <button onClick={() => exclusaoEmMassa('vendas_ativas')} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 py-3 rounded-xl font-bold text-xs uppercase border border-red-500/30">🗑️ Limpar Contatos Vendas</button>
                  <button onClick={() => exclusaoEmMassa('upgrade')} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 py-3 rounded-xl font-bold text-xs uppercase border border-red-500/30">🗑️ Limpar Lista Up-Grade</button>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'admin_usuarios' && (
            <div className={`${bgCard} border p-6 rounded-3xl space-y-4`}>
               <h3 className="font-bold text-orange-500 border-b border-zinc-800 pb-2">Gestão de Usuários (Roles do Chat)</h3>
               <form className="grid grid-cols-4 gap-4 text-xs">
                 <input type="text" placeholder="Nome" className={`${inputTheme} border p-3 rounded-xl`} />
                 <input type="email" placeholder="Email" className={`${inputTheme} border p-3 rounded-xl`} />
                 <select className={`${inputTheme} border p-3 rounded-xl`}>
                   <option>VENDEDOR</option>
                   <option>COBRADOR</option>
                   <option>SUPERVISOR</option>
                   <option>ADMIN</option>
                 </select>
                 <button className="bg-orange-500 text-black font-bold rounded-xl">Salvar Usuário</button>
               </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
