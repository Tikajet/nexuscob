import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Wifi, Shield, Trash2, ArrowRight, Sun, Moon, Star, Filter,
  UserPlus, Award, ChevronDown, ChevronRight, Upload, FileSpreadsheet, Edit3,
  ShoppingBag, HeartHandshake, PlusCircle, Bell, AlertTriangle, Phone, FileText, CheckCircle2, Wrench
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

const FRASES_INCENTIVO = [
  "A determinação de hoje constrói o sucesso de amanhã!",
  "Foco no atendimento excelente: cada solução aproxima o cliente da Metronet!",
  "A chave para grandes conquistas é a consistência no dia a dia."
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  
  // Navegação
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [menuCobranca, setMenuCobranca] = useState(false);
  const [subAbaCobranca, setSubAbaCobranca] = useState('pipeline');
  
  const [menuPosVenda, setMenuPosVenda] = useState(false);
  const [subAbaPosVenda, setSubAbaPosVenda] = useState('funil');
  
  const [menuOS, setMenuOS] = useState(false);
  const [subAbaOS, setSubAbaOS] = useState('pipeline');

  const [menuAdmin, setMenuAdmin] = useState(false);
  const [subAbaAdmin, setSubAbaAdmin] = useState('listas');

  const [temaClaro, setTemaClaro] = useState(false);
  const [exibirPopup, setExibirPopup] = useState(false);
  const [exibirNotificacoes, setExibirNotificacoes] = useState(false);

  // Dados
  const [clientes, setClientes] = useState([]);
  const [posVendas, setPosVendas] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);
  const [contatosAtivos, setContatosAtivos] = useState([]);
  const [listaUpgrade, setListaUpgrade] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [rankingCobranca, setRankingCobranca] = useState([]);
  const [rankingVendedores, setRankingVendedores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Previa Admin
  const [tipoImportacao, setTipoImportacao] = useState('cobranca');
  const [previaPlanilha, setPreviaPlanilha] = useState([]);

  // Chat
  const [gruposChat, setGruposChat] = useState([]);
  const [chatMensagens, setChatMensagens] = useState([]);
  const [chatTipo, setChatTipo] = useState('geral');
  const [chatDestinoId, setChatDestinoId] = useState(null);
  const [novaMsgChat, setNovaMsgChat] = useState('');
  const [novoGrupoNome, setNovoGrupoNome] = useState('');

  // Buscas
  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [buscaCadastro, setBuscaCadastro] = useState('');
  const [buscaAgenda, setBuscaAgenda] = useState('');
  const [filtroAtrasoPipeline, setFiltroAtrasoPipeline] = useState('todos');

  // Formulários
  const [novoCliente, setNovoCliente] = useState({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
  const [novoPosVenda, setNovoPosVenda] = useState({ codigo: '', nome: '', telefone: '', plano: 'Fibra 500MB', satisfacao: '5', vendedor_id: '', observacoes: '' });
  const [novaOS, setNovaOS] = useState({ cliente_codigo: '', cliente_nome: '', problema: '', tipo_ocorrencia: 'Suporte Técnico' });
  const [novoScript, setNovoScript] = useState({ titulo: '', tipo: 'cobranca', conteudo: '' });

  // Modais
  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  const [modalAtalhoAgenda, setModalAtalhoAgenda] = useState({ exibir: false, clienteNome: '' });
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
    fetch(`${API_URL}/os`).then(r => r.json()).then(data => setOrdensServico(data || [])).catch(() => {});
    fetch(`${API_URL}/vendas/contatos-ativos`).then(r => r.json()).then(data => setContatosAtivos(data || [])).catch(() => {});
    fetch(`${API_URL}/vendas/upgrade`).then(r => r.json()).then(data => setListaUpgrade(data || [])).catch(() => {});
    fetch(`${API_URL}/scripts`).then(r => r.json()).then(data => setScripts(data || [])).catch(() => {});
    fetch(`${API_URL}/agenda?usuario_id=${usuario?.id}`).then(r => r.json()).then(data => setAgenda(data || [])).catch(() => {});
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

  const moverEstagioOS = (osId, novoEstagioId) => {
    fetch(`${API_URL}/os/${osId}/estagio`, {
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
        setNovoCliente({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
        carregarDados();
      }
    });
  };

  const handleCadastrarPosVenda = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/pos-venda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...novoPosVenda, vendedor_id: novoPosVenda.vendedor_id || usuario.id })
    }).then(r => r.json()).then(data => {
      if (data.sucesso) {
        alert('Cliente salvo no Pós-Venda!');
        setNovoPosVenda({ codigo: '', nome: '', telefone: '', plano: 'Fibra 500MB', satisfacao: '5', vendedor_id: '', observacoes: '' });
        carregarDados();
      }
    });
  };

  const handleCadastrarOS = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/os`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaOS)
    }).then(() => {
      alert('Ordem de Serviço Aberta!');
      setNovaOS({ cliente_codigo: '', cliente_nome: '', problema: '', tipo_ocorrencia: 'Suporte Técnico' });
      carregarDados();
    });
  };

  const handleCadastrarScript = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoScript)
    }).then(() => {
      alert('Script Salvo!');
      setNovoScript({ titulo: '', tipo: 'cobranca', conteudo: '' });
      carregarDados();
    });
  };

  const handleCarregarPreviaPlanilha = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('tipo', tipoImportacao);

    fetch(`${API_URL}/admin/previa-planilha`, { method: 'POST', body: formData })
      .then(r => r.json())
      .then(data => {
        if (data.sucesso) {
          setPreviaPlanilha(data.dados);
        } else {
          alert('Erro ao processar planilha.');
        }
      });
  };

  const handleConfirmarImportacaoAdmin = () => {
    if (previaPlanilha.length === 0) return;

    fetch(`${API_URL}/admin/confirmar-importacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: tipoImportacao, lista: previaPlanilha })
    }).then(() => {
      alert(`${previaPlanilha.length} registros salvos no setor de ${tipoImportacao.toUpperCase()}!`);
      setPreviaPlanilha([]);
      carregarDados();
    });
  };

  const handleLimparMassaClientes = (categoria) => {
    if (confirm(`Tem certeza que deseja excluir em massa os clientes da categoria: ${categoria.toUpperCase()}?`)) {
      fetch(`${API_URL}/clientes/limpar/massa?categoria=${categoria}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
          alert(`${data.deletados || 0} clientes foram removidos.`);
          carregarDados();
        });
    }
  };

  const handleAdicionarAtalhoAgenda = (e) => {
    e.preventDefault();
    const dataForm = new FormData(e.target);

    fetch(`${API_URL}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_nome: modalAtalhoAgenda.clienteNome,
        data_retorno: dataForm.get('data_retorno'),
        observacao: dataForm.get('observacao'),
        usuario_id: usuario.id,
        usuario_nome: usuario.nome
      })
    }).then(() => {
      alert('Retorno agendado na sua agenda!');
      setModalAtalhoAgenda({ exibir: false, clienteNome: '' });
      carregarDados();
    });
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
            <p className="text-xs text-emerald-400 tracking-widest uppercase font-semibold mt-1">NEXUS COB SYSTEM</p>
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
              Acessar MetroCob
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
      
      {/* POPUP DE INCENTIVO INICIAL */}
      {exibirPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-2xl max-w-lg w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Excelente Trabalho, {usuario.nome}!</h3>
              <p className="text-slate-300 italic text-base leading-relaxed">
                "{FRASES_INCENTIVO[Math.floor(Math.random() * FRASES_INCENTIVO.length)]}"
              </p>
            </div>
            <button 
              onClick={() => setExibirPopup(false)}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold px-8 py-2.5 rounded-lg shadow-lg"
            >
              Acessar Painel
            </button>
          </div>
        </div>
      )}

      {/* MODAL ATALHO AGENDA */}
      {modalAtalhoAgenda.exibir && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className={`${bgCard} border border-emerald-500/50 p-6 rounded-2xl max-w-md w-full space-y-4`}>
            <h3 className="text-base font-bold">Agendar Retorno Rápido</h3>
            <p className="text-xs opacity-70">Deseja adicionar <b>{modalAtalhoAgenda.clienteNome}</b> na sua agenda para entrar em contato?</p>
            <form onSubmit={handleAdicionarAtalhoAgenda} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 opacity-70">Data e Hora do Retorno</label>
                <input type="datetime-local" name="data_retorno" required className={`w-full ${bgInput} p-2.5 rounded-lg`} />
              </div>
              <div>
                <label className="block mb-1 opacity-70">Observação</label>
                <input type="text" name="observacao" defaultValue="Retorno agendado pelo pipeline" className={`w-full ${bgInput} p-2.5 rounded-lg`} />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalAtalhoAgenda({ exibir: false, clienteNome: '' })} className="w-1/2 bg-slate-700 text-white py-2 rounded-lg font-semibold">Cancelar</button>
                <button type="submit" className="w-1/2 bg-emerald-600 text-white py-2 rounded-lg font-bold">Agendar</button>
              </div>
            </form>
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
              <Wifi className="w-6 h-6 text-emerald-400" />
              <span>METRO<span className={temaClaro ? "text-slate-900" : "text-white"}>COB</span></span>
            </div>
            <p className={`text-[10px] tracking-widest uppercase font-semibold mt-0.5 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
              NEXUS COB SYSTEM
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

            {/* 2. COBRANÇA */}
            <div>
              <button 
                onClick={() => setMenuCobranca(!menuCobranca)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'cobranca' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5" />
                  <span>Cobrança</span>
                </div>
                {menuCobranca ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {menuCobranca && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('pipeline'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'pipeline' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    📌 Pipeline
                  </button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'cadastro' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    👤 Cadastro de Cliente
                  </button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('agenda'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'agenda' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    📅 Sua Agenda
                  </button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('scripts'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'scripts' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    📝 Script de Cobrança
                  </button>
                  <button onClick={() => { setAbaAtiva('cobranca'); setSubAbaCobranca('contatos'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaCobranca === 'contatos' && abaAtiva === 'cobranca' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    📞 Contatos (Agenda)
                  </button>
                </div>
              )}
            </div>

            {/* PÓS-VENDAS RESIDENCIAL */}
            <div>
              <button 
                onClick={() => setMenuPosVenda(!menuPosVenda)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pos-venda' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
              >
                <div className="flex items-center space-x-3">
                  <HeartHandshake className="w-5 h-5 text-emerald-400" />
                  <span>Pós-Vendas Residencial</span>
                </div>
                {menuPosVenda ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {menuPosVenda && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('funil'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'funil' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    🛍️ Pipeline Vendas/Pós
                  </button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'cadastro' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    👤 Cadastro de Cliente
                  </button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('contatos_ativos'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'contatos_ativos' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    🔥 Contatos Ativos
                  </button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('upgrade'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'upgrade' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    🚀 Lista Up-Grade
                  </button>
                  <button onClick={() => { setAbaAtiva('pos-venda'); setSubAbaPosVenda('scripts'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaPosVenda === 'scripts' && abaAtiva === 'pos-venda' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    📜 Script de Vendas
                  </button>
                </div>
              )}
            </div>

            {/* QUALIDADE DE ATENDIMENTO O.S. */}
            <div>
              <button 
                onClick={() => setMenuOS(!menuOS)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'os' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
              >
                <div className="flex items-center space-x-3">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <span>Qualidade (O.S.)</span>
                </div>
                {menuOS ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {menuOS && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('os'); setSubAbaOS('pipeline'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaOS === 'pipeline' && abaAtiva === 'os' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    ⚙️ Pipeline O.S.
                  </button>
                  <button onClick={() => { setAbaAtiva('os'); setSubAbaOS('cadastro'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaOS === 'cadastro' && abaAtiva === 'os' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    ➕ Nova O.S.
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setAbaAtiva('chat')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'chat' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat Interno</span>
            </button>

            {/* ADMINISTRAÇÃO */}
            <div>
              <button 
                onClick={() => setMenuAdmin(!menuAdmin)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva === 'admin' ? `${btnDestaque}` : 'opacity-70 hover:opacity-100 hover:bg-emerald-500/10'}`}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5" />
                  <span>Administração</span>
                </div>
                {menuAdmin ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {menuAdmin && (
                <div className="ml-6 mt-1 space-y-1 text-xs font-semibold">
                  <button onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('usuarios'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaAdmin === 'usuarios' && abaAtiva === 'admin' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    👥 Usuários & Permissões
                  </button>
                  <button onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('listas'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaAdmin === 'listas' && abaAtiva === 'admin' ? 'text-emerald-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    📊 Importação de Listas
                  </button>
                  <button onClick={() => { setAbaAtiva('admin'); setSubAbaAdmin('exclusao'); }} className={`w-full text-left py-2 px-3 rounded-lg ${subAbaAdmin === 'exclusao' && abaAtiva === 'admin' ? 'text-rose-400 font-bold bg-slate-800' : 'opacity-70'}`}>
                    ⚠️ Exclusão em Massa
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
        
        {/* CABEÇALHO COM ONLINE E NOTIFICAÇÃO DA AGENDA */}
        <header className={`h-16 ${bgCard} border-b px-6 flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Operadores Online no Sistema:</span>
            <div className="flex items-center space-x-2">
              {usuarios.map(u => (
                <span key={u.id} className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>{u.nome} ({u.cargo})</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* NOTIFICAÇÃO AGENDA */}
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
                <div className={`absolute right-0 mt-2 w-80 ${bgCard} border rounded-2xl shadow-2xl p-4 z-50 space-y-3`}>
                  <h4 className="text-xs font-bold flex items-center space-x-1 text-amber-400 border-b pb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Sua Agenda Pessoal ({agenda.length})</span>
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                    {agenda.map(item => (
                      <div key={item.id} className={`${bgInput} p-2.5 rounded-xl border`}>
                        <p className="font-bold">{item.cliente_nome}</p>
                        <p className="text-[10px] text-emerald-400 font-semibold">📅 {item.data_retorno}</p>
                        <p className="text-[10px] opacity-60">{item.observacao}</p>
                      </div>
                    ))}
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
          
          {/* 1. DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Dashboard Geral de Desempenho</h1>

              <div className="grid grid-cols-2 gap-6">
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-base font-bold text-amber-500 flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Ranking Cobradores (Volume de Acordos)</span>
                  </h2>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {rankingCobranca.map((op, idx) => (
                      <div key={idx} className={`${bgInput} p-4 rounded-xl flex items-center justify-between border`}>
                        <span className={`w-7 h-7 rounded-full ${btnDestaque} flex items-center justify-center font-bold text-xs`}>#{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold">{op.operador}</p>
                          <p className="text-xs opacity-60">{op.total_acordos} acordos efetuados</p>
                        </div>
                        <span className="text-sm font-black text-emerald-500">R$ {parseFloat(op.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className={`text-base font-bold flex items-center space-x-2 ${temaClaro ? 'text-[#800020]' : 'text-emerald-400'}`}>
                    <Award className="w-5 h-5" />
                    <span>Ranking Vendedores & Upgrades</span>
                  </h2>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {rankingVendedores.map((vend, idx) => (
                      <div key={idx} className={`${bgInput} p-4 rounded-xl flex items-center justify-between border`}>
                        <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">#{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold">{vend.vendedor}</p>
                          <p className="text-xs opacity-60">{vend.total_pos_vendas} pós-vendas ativas</p>
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

          {/* 2. COBRANÇA */}
          {abaAtiva === 'cobranca' && (
            <div>
              {subAbaCobranca === 'pipeline' && (
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
                                  <button onClick={() => setModalAtalhoAgenda({ exibir: true, clienteNome: cli.nome })} className="text-amber-400 p-1" title="Adicionar à Agenda">
                                    <Calendar className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs font-black text-rose-500">R$ {parseFloat(cli.total_vencido || 0).toFixed(2)}</p>
                                <p className="text-[10px] text-emerald-400">Tratado por: {cli.operador_nome || usuario.nome}</p>

                                <div className="pt-2 border-t flex justify-between items-center text-[10px]">
                                  {estagio.id > 1 && <button onClick={() => moverEstagioCliente(cli.id, estagio.id - 1)}>← Voltar</button>}
                                  {estagio.id < 8 && <button onClick={() => moverEstagioCliente(cli.id, estagio.id + 1)} className="font-bold text-emerald-400 ml-auto">Avançar →</button>}
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

              {subAbaCobranca === 'cadastro' && (
                <div className="grid grid-cols-3 gap-6">
                  <div className={`${bgCard} border p-5 rounded-2xl space-y-4 shadow-sm h-fit`}>
                    <h2 className="text-base font-bold">Cadastrar Cliente Cobrança</h2>
                    <form onSubmit={handleCadastrarClienteManual} className="space-y-3 text-xs">
                      <div><label className="block mb-1">ID / Código *</label><input type="text" required value={novoCliente.codigo} onChange={e => setNovoCliente({...novoCliente, codigo: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} /></div>
                      <div><label className="block mb-1">Nome Completo *</label><input type="text" required value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} /></div>
                      <div><label className="block mb-1">Telefone *</label><input type="text" required value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} /></div>
                      <div><label className="block mb-1">Valor Devedor (R$) *</label><input type="text" required value={novoCliente.total_vencido} onChange={e => setNovoCliente({...novoCliente, total_vencido: e.target.value})} className={`w-full ${bgInput} rounded-lg p-2.5`} /></div>
                      <button type="submit" className={`w-full ${btnDestaque} py-3 rounded-xl uppercase font-bold`}>Cadastrar Cliente</button>
                    </form>
                  </div>

                  <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4`}>
                    <h2 className="text-base font-bold">Clientes Cobrança ({clientes.length})</h2>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {clientes.map(cli => (
                        <div key={cli.id} className={`${bgInput} border p-3 rounded-xl flex justify-between items-center text-xs`}>
                          <div><p className="font-bold">{cli.nome}</p><p className="opacity-60">ID: {cli.codigo} • Tel: {cli.telefone}</p></div>
                          <span className="font-black text-rose-500">R$ {parseFloat(cli.total_vencido || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {subAbaCobranca === 'agenda' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-base font-bold">Sua Agenda de Retornos ({agenda.length})</h2>
                  <div className="space-y-3">
                    {agenda.map(a => (
                      <div key={a.id} className={`${bgInput} border p-4 rounded-xl text-xs space-y-1`}>
                        <p className="font-bold text-sm">{a.cliente_nome}</p>
                        <p className="text-emerald-400 font-bold">📅 Data e Hora: {a.data_retorno}</p>
                        <p className="opacity-70">{a.observacao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subAbaCobranca === 'scripts' && (
                <div className="grid grid-cols-3 gap-6">
                  <div className={`${bgCard} border p-5 rounded-2xl space-y-4 h-fit`}>
                    <h2 className="text-base font-bold">Cadastrar Script de Cobrança</h2>
                    <form onSubmit={handleCadastrarScript} className="space-y-3 text-xs">
                      <input type="text" placeholder="Título do Script" required value={novoScript.titulo} onChange={e => setNovoScript({...novoScript, titulo: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} />
                      <textarea rows="5" placeholder="Conteúdo da Mensagem..." required value={novoScript.conteudo} onChange={e => setNovoScript({...novoScript, conteudo: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`}></textarea>
                      <button type="submit" className={`w-full ${btnDestaque} py-2.5 rounded-xl font-bold`}>Salvar Script</button>
                    </form>
                  </div>

                  <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4`}>
                    <h2 className="text-base font-bold">Scripts Cadastrados</h2>
                    <div className="space-y-3">
                      {scripts.filter(s => s.tipo === 'cobranca').map(s => (
                        <div key={s.id} className={`${bgInput} border p-4 rounded-xl text-xs space-y-2`}>
                          <h3 className="font-bold text-emerald-400">{s.titulo}</h3>
                          <p className="whitespace-pre-wrap">{s.conteudo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {subAbaCobranca === 'contatos' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-base font-bold">Agenda Telefônica de Clientes Importados ({clientes.length})</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {clientes.map(c => (
                      <div key={c.id} className={`${bgInput} border p-3 rounded-xl text-xs space-y-1`}>
                        <p className="font-bold">{c.nome}</p>
                        <p className="opacity-60">ID: {c.codigo}</p>
                        <p className="text-emerald-400 font-bold">📞 Tel: {c.telefone || 'Não informado'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. PÓS-VENDAS RESIDENCIAL & VENDAS ATIVAS */}
          {abaAtiva === 'pos-venda' && (
            <div>
              {subAbaPosVenda === 'funil' && (
                <div className="grid grid-cols-4 gap-4">
                  {ESTAGIOS_POS_VENDA.map(estagio => {
                    const lista = posVendas.filter(p => (p.estagio_id || 1) === estagio.id);

                    return (
                      <div key={estagio.id} className={`${bgCard} border rounded-2xl p-4 flex flex-col h-[650px]`}>
                        <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                          <span className="text-xs font-bold">{estagio.nome}</span>
                          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-bold">{lista.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3">
                          {lista.map(item => (
                            <div key={item.id} className={`${bgInput} border p-3 rounded-xl space-y-2 shadow-sm text-xs`}>
                              <p className="font-bold">{item.nome}</p>
                              <p className="opacity-60">Plano: {item.plano}</p>
                              <div className="flex items-center space-x-1 text-amber-500 font-bold">
                                <span>CSAT: {item.satisfacao}</span>
                                <Star className="w-3.5 h-3.5 fill-amber-500" />
                              </div>
                              <p className="text-[10px] text-emerald-400">Vendedor: {item.vendedor_nome}</p>

                              <div className="pt-2 border-t flex justify-between items-center text-[10px]">
                                {estagio.id > 1 && <button onClick={() => moverEstagioPosVenda(item.id, estagio.id - 1)}>← Voltar</button>}
                                {estagio.id < 4 && <button onClick={() => moverEstagioPosVenda(item.id, estagio.id + 1)} className="font-bold text-emerald-400 ml-auto">Avançar →</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {subAbaPosVenda === 'contatos_ativos' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-base font-bold">Lista de Vendas Ativas / Não Clientes ({contatosAtivos.length})</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {contatosAtivos.map(c => (
                      <div key={c.id} className={`${bgInput} border p-4 rounded-xl text-xs space-y-1`}>
                        <p className="font-bold">{c.nome}</p>
                        <p className="text-emerald-400 font-bold">📞 Tel: {c.telefone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subAbaPosVenda === 'upgrade' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-base font-bold">Lista de Clientes para Up-Grade de Plano ({listaUpgrade.length})</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {listaUpgrade.map(u => (
                      <div key={u.id} className={`${bgInput} border p-4 rounded-xl text-xs space-y-1`}>
                        <p className="font-bold">{u.nome}</p>
                        <p className="opacity-60">ID: {u.codigo} • Plano Atual: <span className="text-amber-400 font-bold">{u.plano_atual}</span></p>
                        <p className="text-emerald-400 font-bold">📞 Tel: {u.telefone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. QUALIDADE (O.S.) */}
          {abaAtiva === 'os' && (
            <div>
              {subAbaOS === 'pipeline' && (
                <div className="grid grid-cols-5 gap-4">
                  {ESTAGIOS_OS.map(estagio => {
                    const lista = ordensServico.filter(o => (o.estagio_id || 1) === estagio.id);

                    return (
                      <div key={estagio.id} className={`${bgCard} border rounded-2xl p-4 flex flex-col h-[650px]`}>
                        <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                          <span className="text-xs font-bold truncate">{estagio.nome}</span>
                          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-bold">{lista.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3">
                          {lista.map(os => (
                            <div key={os.id} className={`${bgInput} border p-3 rounded-xl space-y-2 shadow-sm text-xs`}>
                              <p className="font-bold">{os.cliente_nome}</p>
                              <p className="text-[10px] opacity-60">Ocorrência: {os.tipo_ocorrencia}</p>
                              <p className="text-slate-300">{os.problema}</p>

                              <div className="pt-2 border-t flex justify-between items-center text-[10px]">
                                {estagio.id > 1 && <button onClick={() => moverEstagioOS(os.id, estagio.id - 1)}>← Voltar</button>}
                                {estagio.id < 5 && <button onClick={() => moverEstagioOS(os.id, estagio.id + 1)} className="font-bold text-emerald-400 ml-auto">Avançar →</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {subAbaOS === 'cadastro' && (
                <div className={`${bgCard} border p-6 rounded-2xl max-w-lg space-y-4`}>
                  <h2 className="text-base font-bold">Abertura de Ordem de Serviço (O.S.)</h2>
                  <form onSubmit={handleCadastrarOS} className="space-y-4 text-xs">
                    <div><label className="block mb-1">Nome do Cliente *</label><input type="text" required value={novaOS.cliente_nome} onChange={e => setNovaOS({...novaOS, cliente_nome: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} /></div>
                    <div><label className="block mb-1">Tipo de Ocorrência *</label><input type="text" placeholder="Ex: Lente Suja / Sinal Alto" value={novaOS.tipo_ocorrencia} onChange={e => setNovaOS({...novaOS, tipo_ocorrencia: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`} /></div>
                    <div><label className="block mb-1">Descrição do Problema *</label><textarea rows="4" required value={novaOS.problema} onChange={e => setNovaOS({...novaOS, problema: e.target.value})} className={`w-full ${bgInput} p-2.5 rounded-lg`}></textarea></div>
                    <button type="submit" className={`w-full ${btnDestaque} py-3 rounded-xl font-bold uppercase`}>Abrir Ordem de Serviço</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 5. CHAT INTERNO */}
          {abaAtiva === 'chat' && (
            <div className="grid grid-cols-4 gap-6 h-[620px]">
              <div className={`${bgCard} border p-4 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between`}>
                <div className="space-y-3 overflow-y-auto">
                  <h3 className="text-sm font-bold">Canais & Operadores</h3>
                  
                  <button onClick={() => { setChatTipo('geral'); setChatDestinoId(null); }} className={`w-full text-left p-2.5 rounded-xl font-bold text-xs ${chatTipo === 'geral' ? `${btnDestaque}` : `${bgInput}`}`}>
                    # Geral (Todos)
                  </button>

                  <p className="text-[10px] font-bold uppercase opacity-50 pt-2">Grupos</p>
                  {gruposChat.map(g => (
                    <div key={g.id} className="flex items-center space-x-1">
                      <button onClick={() => { setChatTipo('grupo'); setChatDestinoId(g.id); }} className={`flex-1 text-left p-2 rounded-lg text-xs truncate ${chatTipo === 'grupo' && chatDestinoId === g.id ? `${btnDestaque}` : `${bgInput}`}`}>📢 {g.nome}</button>
                    </div>
                  ))}

                  <p className="text-[10px] font-bold uppercase opacity-50 pt-2">Usuários Online</p>
                  {usuarios.filter(u => u.id !== usuario.id).map(u => (
                    <button key={u.id} onClick={() => { setChatTipo('direto'); setChatDestinoId(u.id); }} className={`w-full text-left p-2 rounded-lg text-xs truncate ${chatTipo === 'direto' && chatDestinoId === u.id ? `${btnDestaque}` : `${bgInput}`}`}>
                      👤 {u.nome} ({u.cargo})
                    </button>
                  ))}
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
                  <input type="text" placeholder="Escreva sua mensagem..." value={novaMsgChat} onChange={e => setNovaMsgChat(e.target.value)} className={`flex-1 ${bgInput} rounded-xl px-4 py-2.5 text-xs focus:outline-none`} />
                  <button type="submit" className={`${btnDestaque} px-5 rounded-xl font-bold`}><Send className="w-4 h-4" /></button>
                </form>
              </div>
            </div>
          )}

          {/* 6. ADMINISTRAÇÃO & LISTAS */}
          {abaAtiva === 'admin' && (
            <div className="space-y-6">
              {subAbaAdmin === 'listas' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-6`}>
                  <h2 className="text-lg font-bold">Importação e Prévia de Listas (Excel / CSV)</h2>

                  <div className="flex space-x-3 text-xs font-bold">
                    <button onClick={() => setTipoImportacao('cobranca')} className={`px-4 py-2 rounded-lg ${tipoImportacao === 'cobranca' ? `${btnDestaque}` : 'bg-slate-800'}`}>Lista Cobrança</button>
                    <button onClick={() => setTipoImportacao('vendas_ativas')} className={`px-4 py-2 rounded-lg ${tipoImportacao === 'vendas_ativas' ? `${btnDestaque}` : 'bg-slate-800'}`}>Lista Vendas Ativas</button>
                    <button onClick={() => setTipoImportacao('upgrade')} className={`px-4 py-2 rounded-lg ${tipoImportacao === 'upgrade' ? `${btnDestaque}` : 'bg-slate-800'}`}>Lista Up-Grade</button>
                  </div>

                  <div className="border-2 border-dashed border-emerald-500/30 p-8 rounded-2xl text-center space-y-4">
                    <Upload className="w-10 h-10 mx-auto text-emerald-400 animate-bounce" />
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleCarregarPreviaPlanilha} className="hidden" id="excelAdminInput" />
                    <label htmlFor="excelAdminInput" className={`${btnDestaque} text-xs px-6 py-3 rounded-xl cursor-pointer inline-block uppercase`}>
                      Carregar Arquivo para {tipoImportacao.toUpperCase()}
                    </label>
                  </div>

                  {previaPlanilha.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-emerald-400">Prévia da Planilha ({previaPlanilha.length} Registros)</h3>
                        <button onClick={handleConfirmarImportacaoAdmin} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl uppercase">
                          Confirmar e Adicionar ao Setor
                        </button>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto border rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className={`${bgInput} uppercase opacity-70 border-b`}>
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">ID / Código</th>
                              <th className="p-3">Nome</th>
                              <th className="p-3">Telefone</th>
                              <th className="p-3">Valor / Plano</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previaPlanilha.map((item, idx) => (
                              <tr key={idx} className="border-b hover:bg-black/5">
                                <td className="p-3 opacity-60">{idx + 1}</td>
                                <td className="p-3 font-bold">{item.codigo}</td>
                                <td className="p-3">{item.nome}</td>
                                <td className="p-3 text-emerald-400 font-bold">{item.telefone}</td>
                                <td className="p-3 font-bold">{item.total_vencido ? `R$ ${item.total_vencido}` : item.plano_atual}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {subAbaAdmin === 'usuarios' && (
                <div className="grid grid-cols-3 gap-6">
                  <div className={`${bgCard} border p-5 rounded-2xl space-y-4 h-fit`}>
                    <h2 className="text-base font-bold">Gestão de Usuários e Permissões</h2>
                    <form onSubmit={e => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      fetch(`${API_URL}/usuarios`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          nome: formData.get('nome'),
                          email: formData.get('email'),
                          cargo: formData.get('cargo'),
                          senha: formData.get('senha') || '123456'
                        })
                      }).then(() => { e.target.reset(); carregarDados(); });
                    }} className="space-y-3 text-xs">
                      <div><label className="block mb-1">Nome Completo</label><input type="text" name="nome" required className={`w-full ${bgInput} rounded-lg p-2.5`} /></div>
                      <div><label className="block mb-1">E-mail</label><input type="email" name="email" required className={`w-full ${bgInput} rounded-lg p-2.5`} /></div>
                      <div><label className="block mb-1">Cargo / Permissão *</label>
                        <select name="cargo" className={`w-full ${bgInput} rounded-lg p-2.5 font-bold`}>
                          <option value="COBRADOR">COBRADOR</option>
                          <option value="VENDEDOR">VENDEDOR</option>
                          <option value="SUPERVISOR">SUPERVISOR</option>
                          <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                        </select>
                      </div>
                      <div><label className="block mb-1">Senha</label><input type="password" name="senha" placeholder="••••••••" className={`w-full ${bgInput} rounded-lg p-2.5`} /></div>
                      <button type="submit" className={`w-full ${btnDestaque} py-3 rounded-xl uppercase font-bold`}>Salvar Usuário</button>
                    </form>
                  </div>

                  <div className={`col-span-2 ${bgCard} border p-5 rounded-2xl space-y-4`}>
                    <h2 className="text-base font-bold">Usuários no Sistema ({usuarios.length})</h2>
                    <div className="space-y-2">
                      {usuarios.map(u => (
                        <div key={u.id} className={`${bgInput} border p-3 rounded-xl flex justify-between items-center text-xs`}>
                          <div><p className="font-bold">{u.nome}</p><p className="opacity-60">{u.email}</p></div>
                          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">{u.cargo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {subAbaAdmin === 'exclusao' && (
                <div className={`${bgCard} border p-6 rounded-2xl space-y-4`}>
                  <h2 className="text-lg font-bold text-rose-500 flex items-center space-x-2">
                    <AlertTriangle className="w-6 h-6" />
                    <span>Exclusão em Massa de Clientes</span>
                  </h2>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <button onClick={() => handleLimparMassaClientes('30')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-4 rounded-xl">Limpar Lote 30 Dias</button>
                    <button onClick={() => handleLimparMassaClientes('60')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-4 rounded-xl">Limpar Lote 60 Dias</button>
                    <button onClick={() => handleLimparMassaClientes('90')} className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-4 rounded-xl">Limpar Lote 90 Dias</button>
                  </div>
                  <button onClick={() => handleLimparMassaClientes('todos')} className="w-full bg-rose-700 hover:bg-rose-600 text-white font-black py-4 rounded-xl uppercase">⚠️ EXCLUIR TODA A BASE DE COBRANÇA</button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
