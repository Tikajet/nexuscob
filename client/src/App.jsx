import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Wifi, Shield, Trash2, ArrowRight, Sun, Moon, Star, Filter,
  UserPlus, Award, ChevronDown, ChevronRight, Upload, FileSpreadsheet, Edit3,
  ShoppingBag, HeartHandshake, PlusCircle, Bell, AlertTriangle, Phone, Wrench, BookOpen
} from 'lucide-react';

const API_URL = '/api';

const ESTAGIOS_COBRANCA = [
  { id: 1, nome: 'Novos Contatos', cor: 'border-blue-500' },
  { id: 2, nome: '1ª Tentativa Contato', cor: 'border-cyan-500' },
  { id: 3, nome: '2ª Tentativa Contato', cor: 'border-indigo-500' },
  { id: 4, nome: '3ª Tentativa Contato', cor: 'border-purple-500' },
  { id: 5, nome: 'Em Contato', cor: 'border-amber-500' },
  { id: 6, nome: 'Acordo Realizado', cor: 'border-emerald-500' },
  { id: 7, nome: 'Acordo Pago', cor: 'border-green-600' },
  { id: 8, nome: 'Recusa de Contato', cor: 'border-rose-500' }
];

const ESTAGIOS_POS_VENDA = [
  { id: 1, nome: 'Venda Instalada', cor: 'border-blue-500' },
  { id: 2, nome: 'Acompanhamento (15 dias)', cor: 'border-indigo-500' },
  { id: 3, nome: 'Acompanhamento (30 dias)', cor: 'border-amber-500' },
  { id: 4, nome: 'Satisfação do Cliente (CSAT)', cor: 'border-emerald-500' }
];

const ESTAGIOS_OS = [
  { id: 1, nome: 'Problema Resolvido?', cor: 'border-blue-500' },
  { id: 2, nome: 'Acompanhar (5 Dias)', cor: 'border-amber-500' },
  { id: 3, nome: 'Acompanhar Qualidade', cor: 'border-purple-500' },
  { id: 4, nome: 'Nota da Resolução', cor: 'border-emerald-500' },
  { id: 5, nome: 'Feedback do Cliente', cor: 'border-teal-500' }
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
  
  // Navegação
  const [abaAtiva, setAbaAtiva] = useState('cobranca');
  const [menuCobranca, setMenuCobranca] = useState(true);
  const [subAbaCobranca, setSubAbaCobranca] = useState('pipeline');
  
  const [menuPosVenda, setMenuPosVenda] = useState(false);
  const [subAbaPosVenda, setSubAbaPosVenda] = useState('funil');
  
  const [menuOS, setMenuOS] = useState(false);
  const [subAbaOS, setSubAbaOS] = useState('pipeline');

  const [menuAdmin, setMenuAdmin] = useState(false);
  const [subAbaAdmin, setSubAbaAdmin] = useState('listas');

  const [temaClaro, setTemaClaro] = useState(false);
  const [exibirPopup, setExibirPopup] = useState(false);

  // Dados
  const [clientes, setClientes] = useState([]);
  const [posVendas, setPosVendas] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);
  const [contatosAtivos, setContatosAtivos] = useState([]);
  const [listaUpgrade, setListaUpgrade] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [rankingCobranca, setRankingCobranca] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Importação
  const [tipoImportacao, setTipoImportacao] = useState('cobranca');
  const [categoriaCobranca, setCategoriaCobranca] = useState('30');
  const [previaPlanilha, setPreviaPlanilha] = useState([]);

  // Chat
  const [chatMensagens, setChatMensagens] = useState([]);
  const [novaMsgChat, setNovaMsgChat] = useState('');

  // Buscas e Filtros
  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [filtroAtrasoPipeline, setFiltroAtrasoPipeline] = useState('todos');

  // Formulários e Edições
  const [novoCliente, setNovoCliente] = useState({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
  const [clienteEditando, setClienteEditando] = useState(null);
  const [contatoEditando, setContatoEditando] = useState(null);

  // Modais
  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  const [modalAtalhoAgenda, setModalAtalhoAgenda] = useState({ exibir: false, clienteNome: '' });

  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [usuario, abaAtiva, subAbaCobranca, subAbaPosVenda]);

  const carregarDados = () => {
    fetch(`${API_URL}/clientes`).then(r => r.json()).then(data => setClientes(data || [])).catch(() => {});
    fetch(`${API_URL}/pos-venda`).then(r => r.json()).then(data => setPosVendas(data || [])).catch(() => {});
    fetch(`${API_URL}/os`).then(r => r.json()).then(data => setOrdensServico(data || [])).catch(() => {});
    fetch(`${API_URL}/vendas/contatos-ativos`).then(r => r.json()).then(data => setContatosAtivos(data || [])).catch(() => {});
    fetch(`${API_URL}/vendas/upgrade`).then(r => r.json()).then(data => setListaUpgrade(data || [])).catch(() => {});
    fetch(`${API_URL}/scripts`).then(r => r.json()).then(data => setScripts(data || [])).catch(() => {});
    fetch(`${API_URL}/agenda?usuario_id=${usuario?.id}`).then(r => r.json()).then(data => setAgenda(data || [])).catch(() => {});
    fetch(`${API_URL}/dashboard/ranking-cobranca`).then(r => r.json()).then(data => setRankingCobranca(data || [])).catch(() => {});
    fetch(`${API_URL}/usuarios`).then(r => r.json()).then(data => setUsuarios(data || [])).catch(() => {});
    carregarChat();
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
        alert(clienteEditando ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
        setNovoCliente({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
        setClienteEditando(null);
        carregarDados();
      }
    });
  };

  const handleExcluirCliente = (id) => {
    if (confirm('Excluir este cliente permanentemente?')) {
      fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' }).then(() => carregarDados());
    }
  };

  const handleSalvarContatoAtivo = (e) => {
    e.preventDefault();
    if (!contatoEditando) return;

    fetch(`${API_URL}/vendas/contatos-ativos/${contatoEditando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contatoEditando)
    }).then(() => {
      alert('Contato atualizado!');
      setContatoEditando(null);
      carregarDados();
    });
  };

  const handleExcluirContatoAtivo = (id) => {
    if (confirm('Excluir este contato da lista ativa?')) {
      fetch(`${API_URL}/vendas/contatos-ativos/${id}`, { method: 'DELETE' }).then(() => carregarDados());
    }
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
        else alert('Erro ao processar planilha.');
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

  // ESTILOS DE TEMA
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
              <Wifi className="w-8 h-8 text-emerald-400"/>
              <span>METRO<span className="text-white">COB</span></span>
            </div>
            <p className="text-xs text-emerald-400 tracking-widest uppercase font-semibold mt-1">NEXUS COB SYSTEM</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">E-mail do Operador</label>
              <input type="email" required value={emailLogin} onChange={e => setEmailLogin(e.target.value)} placeholder="operador@metronet.com.br" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Senha de Acesso</label>
              <input type="password" required value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none text-white" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg text-sm uppercase tracking-wider">Acessar MetroCob</button>
          </form>
        </div>
      </div>
    );
  }

  const clientesFiltradosPipeline = clientes.filter(c => {
    const combinaBusca = c.nome?.toLowerCase().includes(buscaPipeline.toLowerCase()) || c.codigo?.toLowerCase().includes(buscaPipeline.toLowerCase());
    if (!combinaBusca) return false;

    if (filtroAtrasoPipeline === '30') return c.dias_atraso === 30;
    if (filtroAtrasoPipeline === '60') return c.dias_atraso === 60;
    if (filtroAtrasoPipeline === '90') return c.dias_atraso === 90;
    if (filtroAtrasoPipeline === 'cancelados') return c.dias_atraso >= 120 || c.status_conexao === 'Cancelado';

    return true;
  });

  return (
    <div className={`min-h-screen ${bgPrincipal} flex font-sans transition-colors duration-200`}>
      
      {/* POPUP BÍBLICO INICIAL */}
      {exibirPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-2xl max-w-lg w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <BookOpen className="w-8 h-8"/>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Bem-vindo, {usuario.nome}!</h3>
              <p className="text-slate-300 italic text-base leading-relaxed">
                {VERSICULOS_BIBLICOS[Math.floor(Math.random() * VERSICULOS_BIBLICOS.length)]}
              </p>
            </div>
            <button onClick={() => setExibirPopup(false)} className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold px-8 py-2.5 rounded-lg shadow-lg">
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
                <input type="text" required placeholder="Ex: 250,00" value={modalAcordo.valor} onChange={e => setModalAcordo({...modalAcordo, valor: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
              </div>
              <div>
                <label className="block mb-1 opacity-70">Quantidade de Parcelas</label>
                <input type="number" min="1" max="12" value={modalAcordo.parcelas} onChange={e => setModalAcordo({...modalAcordo, parcelas: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalAcordo({ exibir: false, clienteId: null, valor: '', parcelas: '1' })} className="w-1/2 bg-slate-700 text-white py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="w-1/2 bg-emerald-600 text-white py-2 rounded-lg font-bold">Salvar Acordo</button>
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
              <Wifi className="w-6 h-6 text-emerald-400"/>
              <span>METRO<span className={temaClaro ? "text-slate-900" : "text-white"}>COB</span></span>
            </div>
            <p className={`text-[10px] tracking-widest uppercase font-semibold mt-0.5 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
              NEXUS COB SYSTEM
            </p>
          </div>

          <nav className="p-4 space-y-1 text-sm font-medium">
            <button onClick={() => setAbaAtiva('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'dashboard' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100'}`}>
              <BarChart2 className="w-5 h-5"/>
              <span>Dashboard</span>
            </button>

            {/* COBRANÇA */}
            <div>
              <button onClick={() => setMenuCobranca(!menuCobranca)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'cobranca' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Users className="w-5 h-5"/><span>Cobrança</span></div>
                {menuCobranca ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
              </button>

              {menuCobranca && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('pipeline'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'pipeline' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>📌 Pipeline</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'cadastro' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>👤 Cadastro de Cliente</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('agenda'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'agenda' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>📅 Sua Agenda</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('scripts'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'scripts' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>📝 Script de Cobrança</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('contatos'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'contatos' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>📞 Contatos (Agenda)</button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('chat'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'chat' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>💬 Chat Cobrança</button>
                </div>
              )}
            </div>

            {/* PÓS-VENDAS RESIDENCIAL */}
            <div>
              <button onClick={() => setMenuPosVenda(!menuPosVenda)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pos-venda' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><HeartHandshake className="w-5 h-5 text-emerald-400"/><span>Pós-Vendas Residencial</span></div>
                {menuPosVenda ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
              </button>

              {menuPosVenda && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('funil'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'funil' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>🛍️ Pipeline Vendas/Pós</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'cadastro' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>👤 Cadastro de Cliente</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('contatos_ativos'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'contatos_ativos' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>🔥 Contatos Ativos</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('upgrade'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'upgrade' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>🚀 Lista Up-Grade</button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('chat'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'chat' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>💬 Chat Vendas</button>
                </div>
              )}
            </div>

            {/* QUALIDADE (O.S.) */}
            <div>
              <button onClick={() => setMenuOS(!menuOS)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'os' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Wrench className="w-5 h-5 text-amber-400"/><span>Qualidade (O.S.)</span></div>
                {menuOS ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
              </button>

              {menuOS && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('os'); setSubAbaOS('pipeline'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaOS === 'pipeline' && abaAtiva === 'os' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>⚙️ Pipeline O.S.</button>
                  <button onClick={() => { setAbaAtiva('os'); setSubAbaOS('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaOS === 'cadastro' && abaAtiva === 'os' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>➕ Nova O.S.</button>
                </div>
              )}
            </div>

            {/* ADMINISTRAÇÃO */}
            <div>
              <button onClick={() => setMenuAdmin(!menuAdmin)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'admin' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Settings className="w-5 h-5"/><span>Administração</span></div>
                {menuAdmin ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
              </button>

              {menuAdmin && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('usuarios'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaAdmin === 'usuarios' && abaAtiva === 'admin' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>👥 Usuários & Permissões</button>
                  <button onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('listas'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaAdmin === 'listas' && abaAtiva === 'admin' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>📊 Importação de Listas</button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className={`p-4 border-t ${temaClaro ? 'border-[#e2d5da]' : 'border-slate-800'} space-y-2`}>
          <button onClick={() => setTemaClaro(!temaClaro)} className={`w-full flex items-center justify-center space-x-2 ${temaClaro ? 'bg-[#800020]/10 text-[#800020]' : 'bg-slate-800 text-slate-200'} py-2 rounded-lg text-xs transition-all font-bold`}>
            {temaClaro ? <Moon className="w-4 h-4 text-[#800020]"/> : <Sun className="w-4 h-4 text-amber-400"/>}
            <span>{temaClaro ? 'Modo Escuro' : 'Modo Claro'}</span>
          </button>
          <button onClick={() => setUsuario(null)} className="w-full flex items-center justify-center space-x-2 text-rose-500 hover:bg-rose-500/10 py-2 rounded-lg text-xs font-semibold transition-all">
            <LogOut className="w-4 h-4"/>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className={`h-16 ${bgCard} border-b px-6 flex items-center justify-between`}>
          <span className="text-xs font-bold uppercase opacity-60">Nexus Cob System</span>
          <span className={`text-xs font-bold uppercase ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
            {usuario.nome} ({usuario.cargo})
          </span>
        </header>

        <div className="p-6">
          
          {/* PIPELINE DE COBRANÇA */}
          {abaAtiva === 'cobranca' && subAbaCobranca === 'pipeline' && (
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-3 rounded-2xl border ${bgCard}`}>
                <div className="flex items-center space-x-2">
                  <Filter className={`w-4 h-4 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`} />
                  <button onClick={() => setFiltroAtrasoPipeline('todos')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === 'todos' ? `${btnDestaque}` : 'opacity-60'}`}>Todos ({clientes.length})</button>
                  <button onClick={() => setFiltroAtrasoPipeline('30')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === '30' ? `${btnDestaque}` : 'opacity-60'}`}>30 Dias</button>
                  <button onClick={() => setFiltroAtrasoPipeline('60')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === '60' ? `${btnDestaque}` : 'opacity-60'}`}>60 Dias</button>
                  <button onClick={() => setFiltroAtrasoPipeline('90')} className={`px-3 py-1 rounded-lg text-xs font-bold ${filtroAtrasoPipeline === '90' ? `${btnDestaque}` : 'opacity-60'}`}>90 Dias</button>
                </div>
                <div className="relative w-64">
                  <Search className="w-4 h-4 opacity-40 absolute left-3 top-2.5" />
                  <input type="text" placeholder="Buscar cliente..." value={buscaPipeline} onChange={e => setBuscaPipeline(e.target.value)} className={`w-full ${bgInput} rounded-lg pl-9 pr-3 py-1.5 text-xs`} />
                </div>
              </div>

              <div className="grid grid-cols-8 gap-3 overflow-x-auto pb-4">
                {ESTAGIOS_COBRANCA.map(estagio => {
                  const lista = clientesFiltradosPipeline.filter(c => (c.estagio_id || 1) === estagio.id);

                  return (
                    <div key={estagio.id} className={`${bgCard} border rounded-2xl p-3 min-w-[200px] flex flex-col h-[650px]`}>
                      <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                        <span className="text-[11px] font-bold truncate">{estagio.nome}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800">{lista.length}</span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {lista.map(cli => (
                          <div key={cli.id} className={`${bgInput} border p-3 rounded-xl space-y-2 shadow-sm`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold truncate">{cli.nome}</p>
                                <p className="text-[10px] opacity-60">ID: {cli.codigo}</p>
                              </div>
                            </div>
                            <p className="text-xs font-black text-rose-500">R$ {parseFloat(cli.total_vencido || 0).toFixed(2)}</p>
                            {cli.valor_acordo > 0 && (
                              <p className="text-[10px] font-bold text-emerald-400">Acordo: R$ {parseFloat(cli.valor_acordo).toFixed(2)} ({cli.parcelas_acordo}x)</p>
                            )}
                            <p className="text-[10px] text-emerald-400">Tratado por: {cli.operador_nome || usuario.nome}</p>

                            <div className="pt-2 border-t flex justify-between items-center text-[10px]">
                              {estagio.id > 1 && <button onClick={() => moverEstagioCliente(cli.id, estagio.id - 1)} className="hover:underline">← Voltar</button>}
                              {estagio.id < 8 && <button onClick={() => moverEstagioCliente(cli.id, estagio.id + 1)} className="font-bold text-emerald-400 ml-auto hover:underline">Avançar →</button>}
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

          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Dashboard Geral</h1>
              <div className="grid grid-cols-2 gap-6">
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-base font-bold text-amber-500 flex items-center space-x-2"><Award className="w-5 h-5"/><span>Ranking Cobradores</span></h2>
                  <div className="space-y-3">
                    {rankingCobranca.map((op, idx) => (
                      <div key={idx} className={`${bgInput} p-4 rounded-xl flex items-center justify-between border`}>
                        <span className="font-bold">#{idx + 1} {op.operador}</span>
                        <span className="font-black text-emerald-500">R$ {parseFloat(op.valor_total || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CADASTRO DE CLIENTES COM EDICÃO E EXCLUSÃO */}
          {abaAtiva === 'cobranca' && subAbaCobranca === 'cadastro' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${bgCard} border p-5 rounded-2xl space-y-4 h-fit`}>
                <h2 className="text-base font-bold">{clienteEditando ? 'Editar Cliente' : 'Cadastrar Cliente'}</h2>
                <form onSubmit={handleSalvarCliente} className="space-y-3 text-xs">
                  <input type="text" placeholder="Código/ID" required value={novoCliente.codigo} onChange={e => setNovoCliente({...novoCliente, codigo: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
                  <input type="text" placeholder="Nome Completo" required value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
                  <input type="text" placeholder="Telefone" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
                  <input type="text" placeholder="Valor Devedor" value={novoCliente.total_vencido} onChange={e => setNovoCliente({...novoCliente, total_vencido: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
                  <select value={novoCliente.dias_atraso} onChange={e => setNovoCliente({...novoCliente, dias_atraso: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`}>
                    <option value="30">30 Dias</option>
                    <option value="60">60 Dias</option>
                    <option value="90">90 Dias</option>
                    <option value="120">Cancelado</option>
                  </select>
                  <div className="flex space-x-2">
                    {clienteEditando && <button type="button" onClick={() => { setClienteEditando(null); setNovoCliente({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' }); }} className="bg-slate-700 text-white p-2.5 rounded-lg">Cancelar</button>}
                    <button type="submit" className={`flex-1 ${btnDestaque} py-2.5 rounded-lg font-bold uppercase`}>{clienteEditando ? 'Salvar Edição' : 'Cadastrar'}</button>
                  </div>
                </form>
              </div>

              <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4`}>
                <h2 className="text-base font-bold">Base de Clientes ({clientes.length})</h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {clientes.map(cli => (
                    <div key={cli.id} className={`${bgInput} border p-3 rounded-xl flex justify-between items-center text-xs`}>
                      <div>
                        <p className="font-bold">{cli.nome}</p>
                        <p className="opacity-60">ID: {cli.codigo} • Tel: {cli.telefone} • {cli.dias_atraso} dias</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => { setClienteEditando(cli); setNovoCliente(cli); }} className="text-emerald-400 p-1"><Edit3 className="w-4 h-4"/></button>
                        <button onClick={() => handleExcluirCliente(cli.id)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONTATOS COM EDICÃO E EXCLUSÃO */}
          {abaAtiva === 'pos-venda' && subAbaPosVenda === 'contatos_ativos' && (
            <div className="grid grid-cols-3 gap-6">
              {contatoEditando && (
                <div className={`${bgCard} border p-5 rounded-2xl space-y-4 h-fit`}>
                  <h2 className="text-base font-bold">Editar Contato Ativo</h2>
                  <form onSubmit={handleSalvarContatoAtivo} className="space-y-3 text-xs">
                    <input type="text" value={contatoEditando.nome} onChange={e => setContatoEditando({...contatoEditando, nome: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
                    <input type="text" value={contatoEditando.telefone} onChange={e => setContatoEditando({...contatoEditando, telefone: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
                    <div className="flex space-x-2">
                      <button type="button" onClick={() => setContatoEditando(null)} className="bg-slate-700 text-white p-2 rounded-lg">Cancelar</button>
                      <button type="submit" className={`flex-1 ${btnDestaque} p-2 rounded-lg font-bold`}>Salvar</button>
                    </div>
                  </form>
                </div>
              )}

              <div className={`${contatoEditando ? 'col-span-2' : 'col-span-3'} ${bgCard} border p-6 rounded-2xl space-y-4`}>
                <h2 className="text-base font-bold">Lista de Vendas Ativas / Não Clientes ({contatosAtivos.length})</h2>
                <div className="grid grid-cols-3 gap-4">
                  {contatosAtivos.map(c => (
                    <div key={c.id} className={`${bgInput} border p-4 rounded-xl text-xs space-y-2`}>
                      <p className="font-bold">{c.nome}</p>
                      <p className="text-emerald-400 font-bold">📞 Tel: {c.telefone}</p>
                      <div className="flex space-x-2 pt-1 border-t">
                        <button onClick={() => setContatoEditando(c)} className="text-emerald-400 text-[10px] flex items-center space-x-1"><Edit3 className="w-3 h-3"/><span>Editar</span></button>
                        <button onClick={() => handleExcluirContatoAtivo(c.id)} className="text-rose-500 text-[10px] flex items-center space-x-1"><Trash2 className="w-3 h-3"/><span>Excluir</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADMINISTRAÇÃO IMPORTAÇÃO DE LISTAS COM CATEGORIAS */}
          {abaAtiva === 'admin' && subAbaAdmin === 'listas' && (
            <div className={`${bgCard} border p-6 rounded-2xl space-y-6`}>
              <h2 className="text-lg font-bold">Importação e Prévia de Listas (Excel / CSV)</h2>
              <div className="flex space-x-3 text-xs font-bold">
                <button onClick={() => setTipoImportacao('cobranca')} className={`px-4 py-2 rounded-lg ${tipoImportacao === 'cobranca' ? `${btnDestaque}` : 'bg-slate-800'}`}>Lista Cobrança</button>
                <button onClick={() => setTipoImportacao('vendas_ativas')} className={`px-4 py-2 rounded-lg ${tipoImportacao === 'vendas_ativas' ? `${btnDestaque}` : 'bg-slate-800'}`}>Lista Vendas Ativas</button>
                <button onClick={() => setTipoImportacao('upgrade')} className={`px-4 py-2 rounded-lg ${tipoImportacao === 'upgrade' ? `${btnDestaque}` : 'bg-slate-800'}`}>Lista Up-Grade</button>
              </div>

              {tipoImportacao === 'cobranca' && (
                <div className="space-y-1 text-xs">
                  <label className="block font-bold text-emerald-400">Selecione a Categoria de Atraso desta Lista:</label>
                  <select value={categoriaCobranca} onChange={e => setCategoriaCobranca(e.target.value)} className={`w-64 ${bgInput} p-2 rounded-lg`}>
                    <option value="30">30 Dias de Atraso</option>
                    <option value="60">60 Dias de Atraso</option>
                    <option value="90">90 Dias de Atraso</option>
                    <option value="120">Cancelados / Inadimplentes</option>
                  </select>
                </div>
              )}

              <div className="border-2 border-dashed border-emerald-500/30 p-8 rounded-2xl text-center space-y-4">
                <Upload className="w-10 h-10 mx-auto text-emerald-400 animate-bounce"/>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleCarregarPreviaPlanilha} className="hidden" id="excelAdminInput" />
                <label htmlFor="excelAdminInput" className={`${btnDestaque} text-xs px-6 py-3 rounded-xl cursor-pointer inline-block uppercase`}>
                  Carregar Arquivo para {tipoImportacao.toUpperCase()}
                </label>
              </div>

              {previaPlanilha.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-emerald-400">Prévia ({previaPlanilha.length} Registros)</h3>
                    <button onClick={handleConfirmarImportacaoAdmin} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl uppercase">Confirmar e Salvar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHAT DENTRO DOS SUBMENUS */}
          {((abaAtiva === 'cobranca' && subAbaCobranca === 'chat') || (abaAtiva === 'pos-venda' && subAbaPosVenda === 'chat')) && (
            <div className="grid grid-cols-4 gap-6 h-[620px]">
              <div className={`${bgCard} border p-4 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between`}>
                <div className="space-y-3 overflow-y-auto">
                  <h3 className="text-sm font-bold">Chat do Setor: {abaAtiva === 'pos-venda' ? 'Vendas' : 'Cobrança'}</h3>
                </div>
              </div>

              <div className={`col-span-3 ${bgCard} border rounded-2xl p-5 flex flex-col shadow-sm`}>
                <div className={`flex-1 overflow-y-auto space-y-3 p-3 ${bgInput} rounded-xl mb-4 border`}>
                  {chatMensagens.map(msg => (
                    <div key={msg.id} className={`${bgCard} p-3 rounded-xl text-xs space-y-1 shadow-sm`}>
                      <div className="flex justify-between items-center font-bold text-emerald-400">
                        <span>{msg.remetente_nome}</span>
                        <span className="text-[10px] opacity-50">{new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{msg.mensagem}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleEnviarChat} className="flex space-x-2">
                  <input type="text" placeholder="Escreva sua mensagem no setor..." value={novaMsgChat} onChange={e => setNovaMsgChat(e.target.value)} className={`flex-1 ${bgInput} rounded-xl px-4 py-2.5 text-xs focus:outline-none`} />
                  <button type="submit" className={`${btnDestaque} px-5 rounded-xl font-bold`}><Send className="w-4 h-4"/></button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
