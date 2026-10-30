import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Trash2, Sun, Moon, Filter, Award, ChevronDown, ChevronRight, Upload, 
  HeartHandshake, PlusCircle, Wrench, BookOpen, CheckCircle, CalendarPlus, Star, UserPlus, Edit3, Phone
} from 'lucide-react';

const API_URL = '/api';

const ESTAGIOS_COBRANCA = [
  { id: 1, nome: 'Novos Contatos', cor: 'border-zinc-500' },
  { id: 2, nome: '1ª Tentativa', cor: 'border-blue-400' },
  { id: 3, nome: '2ª Tentativa', cor: 'border-blue-500' },
  { id: 4, nome: '3ª Tentativa', cor: 'border-purple-500' },
  { id: 5, nome: 'Em Contato', cor: 'border-amber-500' },
  { id: 6, nome: 'Acordo Realizado', cor: 'border-green-500' },
  { id: 7, nome: 'Acordo Pago', cor: 'border-emerald-600' },
  { id: 8, nome: 'Recusa Contato', cor: 'border-red-500' }
];

const ESTAGIOS_POS_VENDA = [
  { id: 1, nome: 'Venda Instalada', cor: 'border-blue-500' },
  { id: 2, nome: 'Acompanhamento 15 Dias', cor: 'border-cyan-500' },
  { id: 3, nome: 'Acompanhamento 30 Dias', cor: 'border-purple-500' },
  { id: 4, nome: 'Satisfação do Cliente', cor: 'border-emerald-500' }
];

const formatarTelefone = (tel) => {
  if (!tel) return 'Não informado';
  const limpo = String(tel).replace(/\D/g, '');
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  } else if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return tel;
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [temaEscuro, setTemaEscuro] = useState(() => localStorage.getItem('nexus_theme') !== 'light');

  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [menuCobranca, setMenuCobranca] = useState(false);
  const [menuPosVenda, setMenuPosVenda] = useState(false);
  const [menuAdmin, setMenuAdmin] = useState(false);

  // Estados Globais de Dados
  const [clientes, setClientes] = useState([]); // Pipeline de Cobrança
  const [posVendas, setPosVendas] = useState([]); // Pipeline de Vendas
  const [contatosAtivos, setContatosAtivos] = useState([]); // Lista Vendas Ativas
  const [listaUpgrade, setListaUpgrade] = useState([]); // Lista Up-Grade
  const [agenda, setAgenda] = useState([]); // Agenda individual do operador
  const [scripts, setScripts] = useState([
    { titulo: 'Abordagem Inicial - 30 Dias', conteudo: 'Olá [Nome], identificamos um título em aberto vencido há 30 dias no valor de R$ [Valor]. Podemos negociar hoje?' },
    { titulo: 'Oferta de Up-Grade Fibra', conteudo: 'Olá [Nome], temos uma condição especial para dobrar a velocidade da sua internet atual mantendo um valor excelente!' }
  ]);
  const [usuarios, setUsuarios] = useState([
    { id: 1, nome: 'Administrador', email: 'admin@nexus.com.br', cargo: 'ADMIN' },
    { id: 2, nome: 'Carlos Cobrador', email: 'carlos@nexus.com.br', cargo: 'COBRADOR' },
    { id: 3, nome: 'Ana Vendedora', email: 'ana@nexus.com.br', cargo: 'VENDEDOR' }
  ]);
  const [chatMensagens, setChatMensagens] = useState([
    { usuario: 'Administrador', texto: 'Bem-vindos ao Nexus Cob! Foco nos resultados da equipe hoje.' }
  ]);

  // Estados de Formulários e Importações
  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [tipoImportacao, setTipoImportacao] = useState('cobranca');
  const [categoriaCobranca, setCategoriaCobranca] = useState('30 Dias');
  const [previaPlanilha, setPreviaPlanilha] = useState([]);
  
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', cargo: 'COBRADOR', senha: '123456' });
  const [novoClienteCob, setNovoClienteCob] = useState({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30 Dias' });
  const [novoPosVenda, setNovoPosVenda] = useState({ codigo: '', nome: '', telefone: '', plano: 'Fibra 300MB' });
  const [novoScript, setNovoScript] = useState({ titulo: '', conteudo: '' });
  const [novaMensagem, setNovaMensagem] = useState('');

  // Modais
  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  const [modalAgendaRapida, setModalAgendaRapida] = useState({ exibir: false, clienteNome: '', clienteId: '', tipo: '' });

  useEffect(() => {
    localStorage.setItem('nexus_theme', temaEscuro ? 'dark' : 'light');
    if (temaEscuro) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [temaEscuro]);

  const handleLogin = (e) => {
    e.preventDefault();
    const achado = usuarios.find(u => u.email.toLowerCase() === emailLogin.toLowerCase());
    if (achado) {
      setUsuario(achado);
    } else {
      setUsuario({ id: Date.now(), nome: emailLogin.split('@')[0], email: emailLogin, cargo: 'ADMIN' });
    }
  };

  // --- DRAG AND DROP ---
  const onDragStart = (e, item) => {
    e.dataTransfer.setData("itemId", item.id);
    e.dataTransfer.setData("itemType", item.tipoPipeline);
  };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e, estagioId, tipoPipeline) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("itemId");
    const type = e.dataTransfer.getData("itemType");
    if (type !== tipoPipeline) return;

    if (tipoPipeline === 'cobranca') {
      if (estagioId === 6) {
        setModalAcordo({ exibir: true, clienteId: id, valor: '', parcelas: '1' });
      } else {
        setClientes(c => c.map(x => x.id == id ? {...x, estagio_id: estagioId, operador_atual: usuario.nome} : x));
      }
    } else if (tipoPipeline === 'pos-venda') {
      setPosVendas(p => p.map(x => x.id == id ? {...x, estagio_id: estagioId, operador_atual: usuario.nome} : x));
    }
  };

  const confirmarAcordo = (e) => {
    e.preventDefault();
    setClientes(c => c.map(x => x.id == modalAcordo.clienteId ? {...x, estagio_id: 6, valor_acordo: modalAcordo.valor, operador_atual: usuario.nome} : x));
    setModalAcordo({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  };

  const confirmarAgendaRapida = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    setAgenda([...agenda, { id: Date.now(), cliente_nome: modalAgendaRapida.clienteNome, data_retorno: amanha.toLocaleDateString(), tipo: modalAgendaRapida.tipo }]);
    setModalAgendaRapida({ exibir: false, clienteNome: '', clienteId: '', tipo: '' });
    alert('Adicionado à sua agenda para amanhã!');
  };

  const excluirAgendamento = (id) => {
    if (confirm('Deseja excluir este agendamento?')) {
      setAgenda(agenda.filter(a => a.id !== id));
    }
  };

  const excluirClientePipeline = (id, tipo) => {
    if (confirm('Deseja remover este cliente do pipeline?')) {
      if (tipo === 'cobranca') {
        setClientes(clientes.filter(c => c.id !== id));
      } else {
        setPosVendas(posVendas.filter(c => c.id !== id));
      }
    }
  };

  // --- CADASTROS MANUAIS ---
  const salvarClienteCob = (e) => {
    e.preventDefault();
    const novo = {
      id: Date.now(),
      codigo: novoClienteCob.codigo || 'CLI-' + Math.floor(Math.random() * 1000),
      nome: novoClienteCob.nome,
      telefone: novoClienteCob.telefone,
      total_vencido: novoClienteCob.total_vencido || '100.00',
      dias_atraso: novoClienteCob.dias_atraso,
      estagio_id: 1,
      operador_atual: usuario.nome
    };
    setClientes([novo, ...clientes]);
    alert('Cliente cadastrado com sucesso no Pipeline de Cobrança!');
    setNovoClienteCob({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30 Dias' });
    setAbaAtiva('cob_pipeline');
  };

  const salvarClientePos = (e) => {
    e.preventDefault();
    const novo = {
      id: Date.now(),
      codigo: novoPosVenda.codigo || 'VEND-' + Math.floor(Math.random() * 1000),
      nome: novoPosVenda.nome,
      telefone: novoPosVenda.telefone,
      plano: novoPosVenda.plano,
      estagio_id: 1,
      vendedor: usuario.nome,
      operador_atual: usuario.nome
    };
    setPosVendas([novo, ...posVendas]);
    alert('Cliente cadastrado com sucesso no Pós-Vendas!');
    setNovoPosVenda({ codigo: '', nome: '', telefone: '', plano: 'Fibra 300MB' });
    setAbaAtiva('pos_pipeline');
  };

  // --- IMPORTAÇÃO DE LISTAS CORRIGIDA (ID, NOME, DEVEDOR) ---
  const handleSimularUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isCob = tipoImportacao === 'cobranca';
      const isUp = tipoImportacao === 'upgrade';
      setPreviaPlanilha([
        { 
          id: Date.now() + 1, 
          codigo: 'CLI-501', 
          nome: 'Carlos Eduardo (Devedor)', 
          telefone: '11999998888', 
          total_vencido: isCob ? '350.00' : undefined,
          dias_atraso: isCob ? categoriaCobranca : undefined,
          plano: isUp ? 'Fibra 500MB' : 'Fibra 300MB',
          estagio_id: 1,
          operador_atual: 'Sistema'
        },
        { 
          id: Date.now() + 2, 
          codigo: 'CLI-502', 
          nome: 'Mariana Costa (Devedora)', 
          telefone: '11977776666', 
          total_vencido: isCob ? '520.00' : undefined,
          dias_atraso: isCob ? categoriaCobranca : undefined,
          plano: isUp ? 'Fibra 1GB' : 'Fibra 500MB',
          estagio_id: 1,
          operador_atual: 'Sistema'
        }
      ]);
    }
  };

  const confirmarImportacao = () => {
    if (tipoImportacao === 'cobranca') {
      setClientes([...clientes, ...previaPlanilha]);
      alert(`${previaPlanilha.length} registros adicionados ao Pipeline de Cobrança (${categoriaCobranca})!`);
      setAbaAtiva('cob_pipeline');
    } else if (tipoImportacao === 'vendas_ativas') {
      setContatosAtivos([...contatosAtivos, ...previaPlanilha]);
      alert(`${previaPlanilha.length} registros adicionados aos Contatos Ativos!`);
      setAbaAtiva('pos_contatos');
    } else if (tipoImportacao === 'upgrade') {
      setListaUpgrade([...listaUpgrade, ...previaPlanilha]);
      alert(`${previaPlanilha.length} registros adicionados à Lista de Up-Grade!`);
      setAbaAtiva('pos_upgrade');
    }
    setPreviaPlanilha([]);
  };

  const InputStyle = temaEscuro ? 'bg-black border-zinc-800 text-white focus:border-[#f97316]' : 'bg-[#F5F7FA] border-[#E2E8F0] text-black focus:border-[#8B1E3F]';
  const CardStyle = temaEscuro ? 'bg-[#121212] border-zinc-800' : 'bg-white border-[#E2E8F0] shadow-sm';

  if (!usuario) {
    return (
      <div className={`min-h-screen ${temaEscuro ? 'bg-black' : 'bg-[#F5F7FA]'} flex flex-col justify-center items-center p-4 font-sans`}>
        <div className={`w-full max-w-md ${CardStyle} border p-8 rounded-3xl space-y-6 shadow-2xl`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-tema-primario rounded-2xl flex items-center justify-center font-black text-2xl mb-3 shadow-lg">N</div>
            <h1 className="text-2xl font-black tracking-wider">NEXUS <span className="text-tema-primario">COB</span></h1>
            <p className="text-xs opacity-70 mt-1 uppercase tracking-widest font-bold">Inteligência & Resultados</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-xs font-bold uppercase mb-1 opacity-70">E-mail</label><input type="email" required value={emailLogin} onChange={e => setEmailLogin(e.target.value)} className={`w-full ${InputStyle} border rounded-xl px-4 py-3`} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1 opacity-70">Senha</label><input type="password" required value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} className={`w-full ${InputStyle} border rounded-xl px-4 py-3`} /></div>
            <button type="submit" className="w-full bg-tema-primario hover-bg-tema-primario font-black py-3.5 rounded-xl uppercase tracking-wider">Acessar Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans ${temaEscuro ? 'bg-black text-white' : 'bg-[#F5F7FA] text-[#2C3E50]'}`}>
      
      {/* MODAL AGENDA RÁPIDA */}
      {modalAgendaRapida.exibir && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className={`${CardStyle} border p-6 rounded-3xl max-w-sm w-full text-center space-y-4`}>
            <CalendarPlus className="w-12 h-12 text-tema-primario mx-auto" />
            <h3 className="text-lg font-bold">Agendar Retorno</h3>
            <p className="text-sm opacity-70">Adicionar <b>{modalAgendaRapida.clienteNome}</b> para retorno amanhã?</p>
            <div className="flex space-x-2 pt-4">
              <button onClick={() => setModalAgendaRapida({exibir:false})} className="w-1/2 bg-zinc-500/20 py-3 rounded-xl font-bold">Cancelar</button>
              <button onClick={confirmarAgendaRapida} className="w-1/2 bg-tema-primario py-3 rounded-xl font-black">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACORDO */}
      {modalAcordo.exibir && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className={`${CardStyle} border p-6 rounded-3xl max-w-md w-full space-y-4`}>
            <h3 className="text-lg font-bold text-tema-primario">Registrar Acordo Realizado</h3>
            <form onSubmit={confirmarAcordo} className="space-y-4 text-xs">
              <div><label className="block mb-1 font-semibold opacity-70">Valor Final do Acordo (R$)</label><input type="text" required value={modalAcordo.valor} onChange={e => setModalAcordo({...modalAcordo, valor: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalAcordo({exibir:false})} className="w-1/2 bg-zinc-500/20 py-3 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="w-1/2 bg-tema-primario py-3 rounded-xl font-bold">Salvar Acordo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-[260px] ${temaEscuro ? 'bg-[#0a0a0a] border-zinc-900' : 'bg-white border-[#E2E8F0]'} border-r flex flex-col justify-between p-4 shadow-xl z-10 shrink-0`}>
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-tema-primario rounded-xl flex items-center justify-center font-black text-xl">N</div>
            <div>
              <span className="font-black text-lg">NEXUS<span className="text-tema-primario">COB</span></span>
              <p className="text-[9px] text-tema-primario font-bold uppercase">Painel Operacional</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <button onClick={() => setAbaAtiva('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${abaAtiva === 'dashboard' ? 'bg-tema-primario' : 'opacity-70 hover:opacity-100'}`}>
              <BarChart2 className="w-4 h-4"/> <span>Dashboard / Ranking</span>
            </button>

            {/* Menu Cobrança */}
            <div>
              <button onClick={() => setMenuCobranca(!menuCobranca)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${abaAtiva.startsWith('cob_') ? 'text-tema-primario' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Users className="w-4 h-4"/><span>COBRANÇA</span></div>
                {menuCobranca ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuCobranca && (
                <div className="ml-4 mt-1 border-l border-zinc-500/30 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('cob_pipeline')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_pipeline' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Pipeline Cobrança</button>
                  <button onClick={() => setAbaAtiva('cob_cadastro')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_cadastro' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Cadastro de Cliente</button>
                  <button onClick={() => setAbaAtiva('cob_agenda')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_agenda' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Sua Agenda</button>
                  <button onClick={() => setAbaAtiva('cob_scripts')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_scripts' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Script de Cobrança</button>
                  <button onClick={() => setAbaAtiva('cob_contatos')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_contatos' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Contatos (Lista Telefônica)</button>
                  <button onClick={() => setAbaAtiva('cob_chat')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_chat' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Chat Interno (Cob)</button>
                </div>
              )}
            </div>

            {/* Menu Vendas / Pós-Vendas */}
            <div>
              <button onClick={() => setMenuPosVenda(!menuPosVenda)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${abaAtiva.startsWith('pos_') ? 'text-tema-primario' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><HeartHandshake className="w-4 h-4"/><span>PÓS-VENDAS</span></div>
                {menuPosVenda ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuPosVenda && (
                <div className="ml-4 mt-1 border-l border-zinc-500/30 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('pos_pipeline')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_pipeline' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Pipeline Vendas</button>
                  <button onClick={() => setAbaAtiva('pos_cadastro')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_cadastro' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Cadastro de Cliente</button>
                  <button onClick={() => setAbaAtiva('pos_agenda')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_agenda' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Agenda (Vendas)</button>
                  <button onClick={() => setAbaAtiva('pos_contatos')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_contatos' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Contatos Ativos (Lista)</button>
                  <button onClick={() => setAbaAtiva('pos_upgrade')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_upgrade' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Lista Up-Grade</button>
                  <button onClick={() => setAbaAtiva('pos_scripts')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_scripts' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Script de Vendas</button>
                  <button onClick={() => setAbaAtiva('pos_chat')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_chat' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Chat Interno (Vendas)</button>
                </div>
              )}
            </div>

            {/* Menu Admin */}
            <div>
              <button onClick={() => setMenuAdmin(!menuAdmin)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${abaAtiva.startsWith('admin_') ? 'text-tema-primario' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Settings className="w-4 h-4"/><span>ADMINISTRAÇÃO</span></div>
                {menuAdmin ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuAdmin && (
                <div className="ml-4 mt-1 border-l border-zinc-500/30 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('admin_usuarios')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'admin_usuarios' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Usuários e Permissões</button>
                  <button onClick={() => setAbaAtiva('admin_listas')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'admin_listas' ? 'text-tema-primario bg-tema-primario/10' : 'opacity-70 hover:opacity-100'}`}>Importar Listas</button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-500/30 space-y-3">
          <button onClick={() => setTemaEscuro(!temaEscuro)} className="w-full flex items-center justify-center space-x-2 bg-zinc-500/10 hover:bg-zinc-500/20 py-2.5 rounded-xl text-xs font-semibold">
            {temaEscuro ? <Sun className="w-4 h-4 text-amber-500"/> : <Moon className="w-4 h-4 text-tema-primario"/>}
            <span>{temaEscuro ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>
          
          <div className="bg-zinc-500/10 p-3 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="font-bold truncate max-w-[120px]">{usuario.nome}</p>
              <p className="text-[9px] text-tema-primario font-bold">{usuario.cargo}</p>
            </div>
            <button onClick={() => setUsuario(null)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`h-16 ${CardStyle} border-b flex items-center justify-between px-6 shrink-0`}>
          <h2 className="text-sm font-black uppercase tracking-wider text-tema-primario">{abaAtiva.replace('_', ' - ')}</h2>
          <div className="relative w-72">
            <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-2.5" />
            <input type="text" placeholder="Buscar..." value={buscaPipeline} onChange={e => setBuscaPipeline(e.target.value)} className={`w-full ${InputStyle} border rounded-full pl-10 pr-4 py-2 text-xs`} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${CardStyle} border p-5 rounded-3xl`}><h3 className="font-bold border-b border-zinc-500/30 pb-3 mb-3">Total Carteira (Cobrança)</h3><p className="text-3xl font-black text-tema-primario">{clientes.length} Clientes</p></div>
              <div className={`${CardStyle} border p-5 rounded-3xl`}><h3 className="font-bold border-b border-zinc-500/30 pb-3 mb-3">Vendas Ativas (Pos)</h3><p className="text-3xl font-black text-cyan-500">{contatosAtivos.length} Registros</p></div>
              <div className={`${CardStyle} border p-5 rounded-3xl`}><h3 className="font-bold border-b border-zinc-500/30 pb-3 mb-3">Listas de Up-Grade</h3><p className="text-3xl font-black text-purple-500">{listaUpgrade.length} Prontos</p></div>
            </div>
          )}

          {/* PIPELINE DE COBRANÇA */}
          {abaAtiva === 'cob_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-[75vh] pb-4">
              {ESTAGIOS_COBRANCA.map(estagio => {
                const lista = clientes.filter(c => (c.estagio_id || 1) === estagio.id && c.nome.toLowerCase().includes(buscaPipeline.toLowerCase()));
                return (
                  <div key={estagio.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, estagio.id, 'cobranca')} className={`${CardStyle} border rounded-3xl p-3 min-w-[260px] flex flex-col`}>
                    <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                      <span className="text-[11px] font-bold uppercase">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-zinc-500/20 text-tema-primario">{lista.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {lista.map(cli => (
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'cobranca'})} className="bg-zinc-500/10 border border-zinc-500/20 p-3 rounded-2xl cursor-grab hover:border-tema-primario relative group">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold">{cli.nome}</p>
                              <p className="text-[9px] opacity-60">ID: {cli.codigo} • Tel: {formatarTelefone(cli.telefone)}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button onClick={() => setModalAgendaRapida({exibir:true, clienteNome: cli.nome, clienteId: cli.id, tipo:'cobranca'})} className="text-tema-primario hover:bg-zinc-500/20 p-1.5 rounded-lg" title="Agendar retorno"><CalendarPlus className="w-4 h-4"/></button>
                              <button onClick={() => excluirClientePipeline(cli.id, 'cobranca')} className="text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg" title="Excluir cliente"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                          {cli.dias_atraso && <p className="text-[9px] text-orange-500 font-bold mt-1">Atraso: {cli.dias_atraso}</p>}
                          <p className="text-xs font-black text-red-500 mt-2">R$ {parseFloat(cli.total_vencido||0).toFixed(2)}</p>
                          {cli.valor_acordo > 0 && <p className="text-[10px] font-bold text-green-500">Acordo: R$ {cli.valor_acordo}</p>}
                          <div className="mt-2 pt-2 border-t border-zinc-500/30 flex justify-between items-center text-[9px] opacity-70">
                            <span className="flex items-center space-x-1"><UserPlus className="w-3 h-3"/> <span>Movido por: {cli.operador_atual || 'N/A'}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* CADASTRO DE CLIENTE (COBRANÇA) */}
          {abaAtiva === 'cob_cadastro' && (
            <div className={`${CardStyle} border p-6 rounded-3xl max-w-lg space-y-4`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Cadastro de Cliente (Cobrança)</h3>
              <form onSubmit={salvarClienteCob} className="space-y-3 text-xs">
                <div><label className="block mb-1 font-semibold opacity-70">ID / Código do Cliente</label><input type="text" placeholder="Ex: CLI-100" value={novoClienteCob.codigo} onChange={e=>setNovoClienteCob({...novoClienteCob, codigo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                <div><label className="block mb-1 font-semibold opacity-70">Nome do Cliente</label><input type="text" required placeholder="Nome Completo" value={novoClienteCob.nome} onChange={e=>setNovoClienteCob({...novoClienteCob, nome: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                <div><label className="block mb-1 font-semibold opacity-70">Telefone</label><input type="text" required placeholder="(11) 99999-9999" value={novoClienteCob.telefone} onChange={e=>setNovoClienteCob({...novoClienteCob, telefone: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                <div><label className="block mb-1 font-semibold opacity-70">Valor Devedor (R$)</label><input type="text" required placeholder="150.00" value={novoClienteCob.total_vencido} onChange={e=>setNovoClienteCob({...novoClienteCob, total_vencido: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                <div>
                  <label className="block mb-1 font-semibold opacity-70">Categoria de Atraso</label>
                  <select value={novoClienteCob.dias_atraso} onChange={e=>setNovoClienteCob({...novoClienteCob, dias_atraso: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`}>
                    <option value="30 Dias">30 Dias</option>
                    <option value="60 Dias">60 Dias</option>
                    <option value="90 Dias">90 Dias</option>
                    <option value="Cancelados">Cancelados</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-tema-primario py-3 rounded-xl font-bold uppercase">Cadastrar e Enviar ao Pipeline</button>
              </form>
            </div>
          )}

          {/* SUA AGENDA (COM OPÇÃO DE EXCLUIR) */}
          {(abaAtiva === 'cob_agenda' || abaAtiva === 'pos_agenda') && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Sua Agenda de Retornos</h3>
              <div className="space-y-2">
                {agenda.map(a => (
                  <div key={a.id} className="p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{a.cliente_nome}</p>
                      <p className="opacity-70 text-[10px]">Tipo: {a.tipo} • Retornar em: <span className="text-tema-primario font-bold">{a.data_retorno}</span></p>
                    </div>
                    <button onClick={() => excluirAgendamento(a.id)} className="text-red-500 hover:bg-red-500/15 p-2 rounded-lg" title="Excluir agendamento"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
                {agenda.length === 0 && <p className="text-xs opacity-50 text-center py-6">Nenhum agendamento na sua agenda hoje.</p>}
              </div>
            </div>
          )}

          {/* SCRIPT DE COBRANÇA / VENDAS */}
          {(abaAtiva === 'cob_scripts' || abaAtiva === 'pos_scripts') && (
            <div className="grid grid-cols-2 gap-6">
              <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Cadastrar Novo Script</h3>
                <input type="text" placeholder="Título do Script" value={novoScript.titulo} onChange={e=>setNovoScript({...novoScript, titulo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`} />
                <textarea rows="5" placeholder="Escreva o texto do script..." value={novoScript.conteudo} onChange={e=>setNovoScript({...novoScript, conteudo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`}></textarea>
                <button onClick={()=>{if(novoScript.titulo){setScripts([...scripts, novoScript]); setNovoScript({titulo:'',conteudo:''}); alert('Script salvo!');}}} className="w-full bg-tema-primario py-3 rounded-xl font-bold text-xs">Salvar Script</button>
              </div>
              <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Scripts Disponíveis</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {scripts.map((s, i) => (
                    <div key={i} className="p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-tema-primario">{s.titulo}</p>
                      <p className="opacity-80">{s.conteudo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONTATOS (LISTA TELEFÔNICA / COBRANÇA) */}
          {abaAtiva === 'cob_contatos' && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Contatos / Lista Telefônica (Cobrança)</h3>
              <div className="space-y-2">
                {clientes.map(c => (
                  <div key={c.id} className="p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-xl text-xs flex justify-between items-center">
                    <div><p className="font-bold">{c.nome} (ID: {c.codigo})</p><p className="opacity-70 flex items-center space-x-1 mt-0.5"><Phone className="w-3 h-3 text-tema-primario"/><span>{formatarTelefone(c.telefone)}</span> • Devedor: R$ {c.total_vencido}</p></div>
                    <span className="text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-lg">Atraso: {c.dias_atraso || '30 Dias'}</span>
                  </div>
                ))}
                {clientes.length === 0 && <p className="text-xs opacity-50 text-center py-6">Nenhum contato de cobrança na base.</p>}
              </div>
            </div>
          )}

          {/* CHAT INTERNO */}
          {(abaAtiva === 'cob_chat' || abaAtiva === 'pos_chat') && (
            <div className={`${CardStyle} border p-6 rounded-3xl flex flex-col h-[70vh]`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2 mb-4">Chat Interno da Equipe</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {chatMensagens.map((m, i) => (
                  <div key={i} className={`p-3 rounded-2xl text-xs max-w-[70%] ${m.usuario === usuario.nome ? 'bg-tema-primario ml-auto text-black font-medium' : 'bg-zinc-500/20'}`}>
                    <p className="font-bold opacity-70 text-[9px] mb-1">{m.usuario}</p><p>{m.texto}</p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 pt-2 border-t border-zinc-500/30">
                <input type="text" placeholder="Digite sua mensagem para a equipe..." value={novaMensagem} onChange={e=>setNovaMensagem(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && novaMensagem.trim()){setChatMensagens([...chatMensagens, {usuario: usuario.nome, texto: novaMensagem}]); setNovaMensagem('');}}} className={`flex-1 ${InputStyle} border p-3 rounded-xl text-xs`} />
                <button onClick={()=>{if(novaMensagem.trim()){setChatMensagens([...chatMensagens, {usuario: usuario.nome, texto: novaMensagem}]); setNovaMensagem('');}}} className="bg-tema-primario px-6 rounded-xl font-bold"><Send className="w-4 h-4"/></button>
              </div>
            </div>
          )}

          {/* PIPELINE VENDAS / PÓS-VENDAS */}
          {abaAtiva === 'pos_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-[75vh] pb-4">
              {ESTAGIOS_POS_VENDA.map(estagio => {
                const lista = posVendas.filter(c => (c.estagio_id || 1) === estagio.id && c.nome.toLowerCase().includes(buscaPipeline.toLowerCase()));
                return (
                  <div key={estagio.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, estagio.id, 'pos-venda')} className={`${CardStyle} border rounded-3xl p-3 min-w-[260px] flex flex-col`}>
                    <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                      <span className="text-[11px] font-bold uppercase">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-zinc-500/20 text-tema-primario">{lista.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {lista.map(cli => (
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'pos-venda'})} className="bg-zinc-500/10 border border-zinc-500/20 p-3 rounded-2xl cursor-grab hover:border-tema-primario relative group">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold">{cli.nome}</p>
                              <p className="text-[9px] opacity-60">ID: {cli.codigo} • Tel: {formatarTelefone(cli.telefone)}</p>
                            </div>
                            <button onClick={() => excluirClientePipeline(cli.id, 'pos-venda')} className="text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg" title="Excluir cliente"><Trash2 className="w-4 h-4"/></button>
                          </div>
                          <p className="text-[10px] text-cyan-400 font-semibold mt-1">Plano: {cli.plano}</p>
                          <div className="mt-2 pt-2 border-t border-zinc-500/30 text-[9px] opacity-70 flex justify-between">
                            <span>Vendedor: {cli.vendedor}</span>
                            <span>Movido: {cli.operador_atual || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* CADASTRO DE CLIENTE (PÓS-VENDAS) */}
          {abaAtiva === 'pos_cadastro' && (
            <div className={`${CardStyle} border p-6 rounded-3xl max-w-lg space-y-4`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Cadastrar Cliente (Pós-Vendas / Vendas)</h3>
              <form onSubmit={salvarClientePos} className="space-y-3 text-xs">
                <div><label className="block mb-1 font-semibold opacity-70">ID / Código do Cliente</label><input type="text" placeholder="Ex: VEND-200" value={novoPosVenda.codigo} onChange={e=>setNovoPosVenda({...novoPosVenda, codigo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                <div><label className="block mb-1 font-semibold opacity-70">Nome Completo</label><input type="text" required placeholder="Nome do Cliente" value={novoPosVenda.nome} onChange={e=>setNovoPosVenda({...novoPosVenda, nome: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                <div><label className="block mb-1 font-semibold opacity-70">Telefone</label><input type="text" required placeholder="(11) 99999-9999" value={novoPosVenda.telefone} onChange={e=>setNovoPosVenda({...novoPosVenda, telefone: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                <div>
                  <label className="block mb-1 font-semibold opacity-70">Plano Contratado</label>
                  <select value={novoPosVenda.plano} onChange={e=>setNovoPosVenda({...novoPosVenda, plano: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`}>
                    <option value="Fibra 300MB">Fibra 300MB</option>
                    <option value="Fibra 500MB">Fibra 500MB</option>
                    <option value="Fibra 1GB">Fibra 1GB</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-tema-primario py-3 rounded-xl font-bold uppercase tracking-wider">Cadastrar e Enviar ao Pipeline</button>
              </form>
            </div>
          )}

          {/* CONTATOS ATIVOS (LISTA) */}
          {abaAtiva === 'pos_contatos' && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Contatos Ativos (Vendas)</h3>
              <div className="space-y-3">
                {contatosAtivos.map(c => (
                  <div key={c.id} className="p-4 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl flex justify-between items-center text-xs shadow-sm">
                    <div className="space-y-1">
                      <p className="font-bold text-sm tracking-wide">{c.nome}</p>
                      <p className="opacity-80 flex items-center space-x-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-tema-primario" />
                        <span>Tel: {formatarTelefone(c.telefone)}</span>
                        <span className="opacity-40">•</span>
                        <span>ID: {c.codigo}</span>
                      </p>
                    </div>
                    <span className="text-cyan-500 font-bold bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">Lead Ativo</span>
                  </div>
                ))}
                {contatosAtivos.length === 0 && <p className="text-xs opacity-50 text-center py-8">Nenhum contato ativo importado.</p>}
              </div>
            </div>
          )}

          {/* LISTA DE UP-GRADE */}
          {abaAtiva === 'pos_upgrade' && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Lista de Up-Grade de Planos</h3>
              <div className="space-y-3">
                {listaUpgrade.map(c => (
                  <div key={c.id} className="p-4 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl flex justify-between items-center text-xs shadow-sm">
                    <div className="space-y-1">
                      <p className="font-bold text-sm tracking-wide">{c.nome}</p>
                      <p className="opacity-80 flex items-center space-x-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-tema-primario" />
                        <span>Tel: {formatarTelefone(c.telefone)}</span>
                        <span className="opacity-40">•</span>
                        <span>ID: {c.codigo}</span>
                      </p>
                    </div>
                    <span className="text-purple-500 font-bold bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">Plano Atual: {c.plano}</span>
                  </div>
                ))}
                {listaUpgrade.length === 0 && <p className="text-xs opacity-50 text-center py-8">Nenhum registro de up-grade importado.</p>}
              </div>
            </div>
          )}

          {/* USUÁRIOS E PERMISSÕES (ADMIN) */}
          {abaAtiva === 'admin_usuarios' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${CardStyle} border p-6 rounded-3xl space-y-4 h-fit`}>
                <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Cadastrar Novo Usuário</h3>
                <form onSubmit={(e)=>{e.preventDefault(); setUsuarios([...usuarios, {id: Date.now(), ...novoUsuario}]); alert('Usuário cadastrado com sucesso!'); setNovoUsuario({nome:'', email:'', cargo:'COBRADOR', senha:'123456'});}} className="space-y-3 text-xs">
                  <div><label className="block mb-1 font-semibold opacity-70">Nome</label><input type="text" required value={novoUsuario.nome} onChange={e=>setNovoUsuario({...novoUsuario, nome: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                  <div><label className="block mb-1 font-semibold opacity-70">E-mail</label><input type="email" required value={novoUsuario.email} onChange={e=>setNovoUsuario({...novoUsuario, email: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
                  <div>
                    <label className="block mb-1 font-semibold opacity-70">Cargo / Permissão</label>
                    <select value={novoUsuario.cargo} onChange={e=>setNovoUsuario({...novoUsuario, cargo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`}>
                      <option value="VENDEDOR">VENDEDOR</option>
                      <option value="COBRADOR">COBRADOR</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-tema-primario py-3 rounded-xl font-bold uppercase">Cadastrar Usuário</button>
                </form>
              </div>

              <div className={`col-span-2 ${CardStyle} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Usuários Cadastrados ({usuarios.length})</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {usuarios.map(u => (
                    <div key={u.id} className="p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold">{u.nome}</p>
                        <p className="opacity-60 text-[10px]">{u.email} • Cargo: <span className="text-tema-primario font-bold">{u.cargo}</span></p>
                      </div>
                      <button onClick={() => setUsuarios(usuarios.filter(x => x.id !== u.id))} className="text-red-500 p-2 hover:bg-red-500/15 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* IMPORTAR LISTAS (ADMIN - CORRIGIDO PARA ID, NOME E DEVEDOR) */}
          {abaAtiva === 'admin_listas' && (
            <div className="grid grid-cols-2 gap-6">
              <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2">Subir Planilha (Upload)</h3>
                <select value={tipoImportacao} onChange={e=>setTipoImportacao(e.target.value)} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`}>
                  <option value="cobranca">Lista de Cobrança (Pipeline)</option>
                  <option value="vendas_ativas">Lista Vendas Ativas (Contatos)</option>
                  <option value="upgrade">Lista de Up-Grade</option>
                </select>
                {tipoImportacao === 'cobranca' && (
                  <select value={categoriaCobranca} onChange={e=>setCategoriaCobranca(e.target.value)} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`}>
                    <option value="30 Dias">Em Massa - 30 Dias</option>
                    <option value="60 Dias">Em Massa - 60 Dias</option>
                    <option value="90 Dias">Em Massa - 90 Dias</option>
                    <option value="Cancelados">Cancelados</option>
                  </select>
                )}
                <input type="file" onChange={handleSimularUpload} className="w-full text-xs opacity-70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-zinc-500/20 hover:file:bg-zinc-500/30 cursor-pointer"/>
                
                {previaPlanilha.length > 0 && (
                  <div className="p-4 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl text-xs space-y-2">
                    <p className="font-bold text-tema-primario">Prévia Pronta: {previaPlanilha.length} registros encontrados.</p>
                    <div className="space-y-1">
                      {previaPlanilha.map((item, idx) => (
                        <div key={idx} className="p-2 bg-black/20 rounded-lg flex justify-between items-center">
                          <span><b>ID:</b> {item.codigo} | <b>Nome:</b> {item.nome}</span>
                          {item.total_vencido && <span className="text-red-500 font-bold">Devedor: R$ {item.total_vencido}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={confirmarImportacao} disabled={previaPlanilha.length===0} className="w-full bg-tema-primario disabled:opacity-50 py-3 rounded-xl font-black text-xs uppercase tracking-wider">Confirmar e Adicionar</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
