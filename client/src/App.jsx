import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, FileText, Upload, Settings, 
  MessageSquare, User, Search, Bell, LogOut, CheckCircle, Clock, AlertTriangle, Send, Wifi, Shield
} from 'lucide-react';

const API_URL = '/api';

const FRASES_MOTIVACIONAIS = [
  "A consistência é a chave para transformar metas em resultados extraordinários!",
  "Cada cliente atendido com excelência reforça o nosso compromisso com a qualidade.",
  "Grandes conquistas são construídas através de pequenas ações diárias.",
  "Sua dedicação hoje é o sucesso da MetroNet amanhã!",
  "Foco, resiliência e empatia transformam qualquer desafio em negociação concluída.",
  "A atitude positiva faz toda a diferença em cada ligação.",
  "Acredite no seu potencial. Hoje é um ótimo dia para bater metas!",
  "Conectar pessoas com respeito e eficiência é a nossa missão.",
  "Seja a solução que o cliente procura com calma e determinação.",
  "Pequenos progressos diários resultam em grandes vitórias ao fim do mês.",
  "A persistência realiza o impossível!",
  "Trabalho em equipe fortalece cada operação da nossa rede.",
  "Entender o cliente é o primeiro passo para um excelente acordo.",
  "Superar obstáculos é o que nos move rumo ao topo.",
  "Sua energia e boa vontade contagiam toda a equipe!",
  "Excelência não é um ato, é um hábito diário.",
  "Hoje é mais uma oportunidade para se superar e fazer história.",
  "Mantenha a calma, a clareza e a determinação em cada atendimento.",
  "Juntos conectamos mais pessoas e alcançamos novos patamares!",
  "A confiança se constrói com transparência e bom atendimento.",
  "Desafios são convites para demonstrarmos nossa força e capacidade.",
  "Um bom negociador ouve com atenção e responde com empatia.",
  "Tenha orgulho do trabalho que você faz todos os dias!",
  "Cada meta batida é o reflexo da sua dedicação constante.",
  "Transforme objeções em oportunidades de fechamento.",
  "Sua postura profissional faz a MetroNet crescer a cada minuto.",
  "Persista com sabedoria, colha resultados com orgulho.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Com foco na solução, nenhum problema permanece sem resposta.",
  "Vamos juntos fazer deste dia um exemplo de conquista e produtividade!"
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [frasePopup, setFrasePopup] = useState('');
  const [exibirPopup, setExibirPopup] = useState(false);

  // Dados Globais
  const [clientes, setClientes] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [posVendaClientes, setPosVendaClientes] = useState([]);
  const [chatMensagens, setChatMensagens] = useState([]);
  const [novaMsgChat, setNovaMsgChat] = useState('');
  
  // Filtros de Busca
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [buscaAgenda, setBuscaAgenda] = useState('');

  // Formulário de Agenda
  const [novoAgendamento, setNovoAgendamento] = useState({
    cliente_nome: '',
    data_retorno: '',
    observacao: '',
    tipo: 'cobranca'
  });

  useEffect(() => {
    if (usuario) {
      carregarDados();
      const interval = setInterval(carregarChat, 5000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  const carregarDados = () => {
    fetch(`${API_URL}/clientes`).then(r => r.json()).then(data => setClientes(data || [])).catch(() => {});
    fetch(`${API_URL}/agenda`).then(r => r.json()).then(data => setAgenda(data || [])).catch(() => {});
    fetch(`${API_URL}/pos-venda`).then(r => r.json()).then(data => setPosVendaClientes(data || [])).catch(() => {});
    carregarChat();
  };

  const carregarChat = () => {
    fetch(`${API_URL}/chat`).then(r => r.json()).then(data => setChatMensagens(data || [])).catch(() => {});
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
        const fraseSorteada = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)];
        setFrasePopup(fraseSorteada);
        setExibirPopup(true);
      } else {
        alert(data.error || 'Falha na autenticação. Verifique e-mail e senha.');
      }
    } catch (err) {
      alert('Erro ao conectar ao servidor. Verifique a conexão com a internet ou o status da API.');
    }
  };

  const handleEnviarChat = (e) => {
    e.preventDefault();
    if (!novaMsgChat.trim()) return;

    fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        mensagem: novaMsgChat
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.sucesso) {
        setNovaMsgChat('');
        carregarChat();
      }
    });
  };

  const handleSalvarAgendamento = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...novoAgendamento,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.sucesso) {
        alert('Retorno agendado com sucesso!');
        setNovoAgendamento({ cliente_nome: '', data_retorno: '', observacao: '', tipo: 'cobranca' });
        carregarDados();
      } else {
        alert('Erro ao agendar retorno: ' + (data.detalhe || data.error));
      }
    });
  };

  // TELA DE LOGIN
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

  // CÁLCULO DE DASHBOARD
  const totalClientes = clientes.length;
  const totalEmAberto = clientes.reduce((acc, c) => acc + (parseFloat(c.total_vencido) || 0), 0);
  const totalRecebido = clientes.filter(c => c.estagio_id === 6).reduce((acc, c) => acc + (parseFloat(c.valor_acordo) || parseFloat(c.total_vencido) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
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

      {/* SIDEBAR TEMA DARK METRONET */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center space-x-2 text-blue-500 font-black text-xl tracking-wider">
              <Wifi className="w-6 h-6 text-blue-400" />
              <span>METRO<span className="text-white">COB</span></span>
            </div>
            <p className="text-[10px] text-blue-400 tracking-widest uppercase font-semibold mt-0.5">POWERED BY NEXUS</p>
          </div>

          <nav className="p-4 space-y-1 text-sm font-medium">
            <button 
              onClick={() => setAbaAtiva('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'dashboard' ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart2 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('pipeline')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pipeline' ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              <span>Pipeline / Funis</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('agenda')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'agenda' ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Calendar className="w-5 h-5" />
              <span>Agenda / Retornos</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('pos-venda')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'pos-venda' ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Shield className="w-5 h-5" />
              <span>Pós-Venda Residencial</span>
            </button>

            <button 
              onClick={() => setAbaAtiva('chat')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'chat' ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat Interno</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-950 p-3 rounded-xl mb-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              {usuario.nome.substring(0, 2)}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{usuario.nome}</p>
              <p className="text-[10px] text-slate-400 uppercase">{usuario.cargo}</p>
            </div>
          </div>

          <div className="text-center mb-3">
            <p className="text-[11px] font-bold italic text-blue-400 tracking-wide">"Juntos conectamos mais pessoas!"</p>
          </div>

          <button 
            onClick={() => setUsuario(null)}
            className="w-full flex items-center justify-center space-x-2 text-rose-400 hover:bg-rose-500/10 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
        
        {/* HEADER COM BUSCA */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Buscar cliente, CPF, código..."
              value={buscaGlobal}
              onChange={e => setBuscaGlobal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 text-white"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-slate-300 font-medium">Sem pendências críticas hoje</span>
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL DAS ABAS */}
        <div className="p-6">
          
          {/* DASHBOARD GERAL */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Geral do Pipeline de Cobrança</h1>
                <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase">METRONET INTERNET DE VERDADE</p>
              </div>

              {/* CARDS KPIS */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-2xl shadow-xl">
                  <p className="text-xs font-medium text-slate-400">Total em Carteira</p>
                  <p className="text-2xl font-black text-white mt-1">{totalClientes} contatos</p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-2">↑ +12% vs. mês anterior</p>
                </div>

                <div className="bg-slate-900 border border-rose-500/30 p-5 rounded-2xl shadow-xl">
                  <p className="text-xs font-medium text-slate-400">Total em Aberto</p>
                  <p className="text-2xl font-black text-rose-400 mt-1">R$ {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[11px] text-rose-400 font-semibold mt-2">↗ +8% vs. mês anterior</p>
                </div>

                <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-xl">
                  <p className="text-xs font-medium text-slate-400">Total Recebido (Pagos)</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-2">↑ +15% vs. mês anterior</p>
                </div>

                <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-2xl shadow-xl">
                  <p className="text-xs font-medium text-slate-400">Taxa de Eficiência</p>
                  <p className="text-2xl font-black text-purple-400 mt-1">18,5%</p>
                  <p className="text-[11px] text-purple-400 font-semibold mt-2">↑ +3,2% vs. mês anterior</p>
                </div>
              </div>

              {/* SEÇÃO INTERMEDIÁRIA DE RESUMO */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white">Distribuição por Perfil de Atraso</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 font-semibold mb-1">
                        <span>Devedores 30 Dias</span>
                        <span>{clientes.filter(c => c.dias_atraso === 30).length} clientes</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[60%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 font-semibold mb-1">
                        <span>Devedores 60 Dias</span>
                        <span>{clientes.filter(c => c.dias_atraso === 60).length} clientes</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[25%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 font-semibold mb-1">
                        <span>Devedores 90+ Dias</span>
                        <span>{clientes.filter(c => c.dias_atraso === 90).length} clientes</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-[15%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-white">Resumo de Negociações</h3>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-semibold">Acordos Pagos e Quitados com Sucesso</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-xs text-amber-300 font-semibold">Acordos Gerados Aguardando Liquidação</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span className="text-xs text-rose-300 font-semibold">Recusas e Insucessos de Negociação</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AGENDA COM BUSCA DE CLIENTES */}
          {abaAtiva === 'agenda' && (
            <div className="grid grid-cols-3 gap-6">
              
              {/* FORMULÁRIO DE NOVO AGENDAMENTO */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span>Agendar Retorno</span>
                </h2>

                <form onSubmit={handleSalvarAgendamento} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Cliente *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Nome do cliente"
                      value={novoAgendamento.cliente_nome}
                      onChange={e => setNovoAgendamento({...novoAgendamento, cliente_nome: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Data e Hora do Retorno *</label>
                    <input 
                      type="datetime-local"
                      required
                      value={novoAgendamento.data_retorno}
                      onChange={e => setNovoAgendamento({...novoAgendamento, data_retorno: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Observação / Motivo</label>
                    <textarea 
                      rows="3"
                      value={novoAgendamento.observacao}
                      onChange={e => setNovoAgendamento({...novoAgendamento, observacao: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2.5 rounded-lg text-white transition-all shadow-lg"
                  >
                    Salvar Compromisso na Agenda
                  </button>
                </form>
              </div>

              {/* LISTA DE AGENDAMENTOS COM FILTRO/BUSCA DE CLIENTE */}
              <div className="col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Compromissos Agendados</h2>
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Filtrar cliente na agenda..."
                      value={buscaAgenda}
                      onChange={e => setBuscaAgenda(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {agenda
                    .filter(a => a.cliente_nome?.toLowerCase().includes(buscaAgenda.toLowerCase()))
                    .map(item => (
                      <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{item.cliente_nome}</p>
                          <p className="text-xs text-blue-400 font-semibold mt-0.5">📅 {item.data_retorno}</p>
                          {item.observacao && <p className="text-xs text-slate-400 mt-1">{item.observacao}</p>}
                        </div>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold uppercase">
                          {item.usuario_nome}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* PÓS-VENDA RESIDENCIAL */}
          {abaAtiva === 'pos-venda' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white">Pós-Venda Residencial — Acompanhamento de Novos Clientes</h1>
                  <p className="text-xs text-slate-400">Garantia de Qualidade da Conexão e Retorno nos Períodos Críticos</p>
                </div>
              </div>

              {/* FUNIL PÓS-VENDA 15, 30, 60 DIAS */}
              <div className="grid grid-cols-3 gap-6">
                
                {/* 15 DIAS */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">15 Dias de Instalação</span>
                    <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {posVendaClientes.filter(pv => pv.estagio === '15_dias').length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {posVendaClientes.filter(pv => pv.estagio === '15_dias').map(cli => (
                      <div key={cli.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <p className="text-xs font-bold text-white">{cli.nome}</p>
                        <p className="text-[11px] text-slate-400">{cli.plano}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 30 DIAS */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">30 Dias (1ª Fatura)</span>
                    <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {posVendaClientes.filter(pv => pv.estagio === '30_dias').length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {posVendaClientes.filter(pv => pv.estagio === '30_dias').map(cli => (
                      <div key={cli.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <p className="text-xs font-bold text-white">{cli.nome}</p>
                        <p className="text-[11px] text-slate-400">{cli.plano}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 60 DIAS */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">60 Dias (Fidelização)</span>
                    <span className="bg-emerald-600/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {posVendaClientes.filter(pv => pv.estagio === '60_dias').length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {posVendaClientes.filter(pv => pv.estagio === '60_dias').map(cli => (
                      <div key={cli.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <p className="text-xs font-bold text-white">{cli.nome}</p>
                        <p className="text-[11px] text-slate-400">{cli.plano}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHAT INTERNO */}
          {abaAtiva === 'chat' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-3xl mx-auto flex flex-col h-[600px]">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span>Chat Interno da Operação MetroNet</span>
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-950 rounded-xl mb-4 border border-slate-800">
                {chatMensagens.map(msg => (
                  <div key={msg.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-blue-400">
                      <span>{msg.usuario_nome}</span>
                      <span className="text-[10px] text-slate-500">{new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200">{msg.mensagem}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleEnviarChat} className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Escreva sua mensagem para a equipe..."
                  value={novaMsgChat}
                  onChange={e => setNovaMsgChat(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl flex items-center justify-center transition-all font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
