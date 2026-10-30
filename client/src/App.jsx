import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Trash2, Sun, Moon, Filter, Award, ChevronDown, ChevronRight, Upload, 
  HeartHandshake, PlusCircle, Wrench, BookOpen, CheckCircle, CalendarPlus, Star, UserPlus
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
  const [clientes, setClientes] = useState([]); // Pipeline de Cobrança e Contatos
  const [posVendas, setPosVendas] = useState([]); // Pipeline de Vendas
  const [contatosAtivos, setContatosAtivos] = useState([]); // Lista Vendas Ativa
  const [listaUpgrade, setListaUpgrade] = useState([]); // Lista Up-Grade
  const [agenda, setAgenda] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [chatMensagens, setChatMensagens] = useState([]);

  // Estados de Formulários e Importações
  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [tipoImportacao, setTipoImportacao] = useState('cobranca');
  const [categoriaCobranca, setCategoriaCobranca] = useState('30 Dias');
  const [previaPlanilha, setPreviaPlanilha] = useState([]);
  
  const [novoCliente, setNovoCliente] = useState({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30' });
  const [novaMensagem, setNovaMensagem] = useState('');
  const [novoScript, setNovoScript] = useState({ titulo: '', conteudo: '' });

  // Modais
  const [modalAcordo, setModalAcordo] = useState({ exibir: false, clienteId: null, valor: '', parcelas: '1' });
  const [modalAgendaRapida, setModalAgendaRapida] = useState({ exibir: false, clienteNome: '', clienteId: null, tipo: '' });

  useEffect(() => {
    localStorage.setItem('nexus_theme', temaEscuro ? 'dark' : 'light');
    if (temaEscuro) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [temaEscuro]);

  const handleLogin = (e) => {
    e.preventDefault();
    setUsuario({ id: 1, nome: emailLogin.split('@')[0], email: emailLogin, cargo: 'ADMIN' });
  };

  // --- DRAG AND DROP & MOVIMENTAÇÃO ---
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
    setModalAgendaRapida({ exibir: false, clienteNome: '', clienteId: null, tipo: '' });
    alert('Agendado com sucesso!');
  };

  // --- IMPORTAÇÃO DE LISTAS CORRIGIDA ---
  const handleSimularUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isCob = tipoImportacao === 'cobranca';
      const isUp = tipoImportacao === 'upgrade';
      setPreviaPlanilha([
        { 
          id: Date.now() + 1, 
          codigo: 'CLI001', 
          nome: 'Importado Silva', 
          telefone: '11999999999', 
          total_vencido: isCob ? '150.00' : undefined,
          dias_atraso: isCob ? categoriaCobranca : undefined,
          plano: isUp ? 'Fibra 100MB' : undefined,
          estagio_id: 1 // Sempre cai na primeira coluna do pipeline
        },
        { 
          id: Date.now() + 2, 
          codigo: 'CLI002', 
          nome: 'Importado Souza', 
          telefone: '11988888888',
          total_vencido: isCob ? '320.00' : undefined,
          dias_atraso: isCob ? categoriaCobranca : undefined,
          plano: isUp ? 'Fibra 200MB' : undefined,
          estagio_id: 1
        }
      ]);
    }
  };

  const confirmarImportacao = () => {
    if (tipoImportacao === 'cobranca') setClientes([...clientes, ...previaPlanilha]);
    if (tipoImportacao === 'vendas_ativas') setContatosAtivos([...contatosAtivos, ...previaPlanilha]);
    if (tipoImportacao === 'upgrade') setListaUpgrade([...listaUpgrade, ...previaPlanilha]);
    setPreviaPlanilha([]);
    alert('Planilha distribuída com sucesso para as áreas corretas!');
  };

  // --- COMPONENTES GÉNERICOS PARA AS TELAS ---
  const InputStyle = temaEscuro ? 'bg-black border-zinc-800 text-white focus:border-[#f97316]' : 'bg-[#F5F7FA] border-[#E2E8F0] text-black focus:border-[#8B1E3F]';
  const CardStyle = temaEscuro ? 'bg-[#121212] border-zinc-800' : 'bg-white border-[#E2E8F0] shadow-sm';

  if (!usuario) {
    return (
      <div className={`min-h-screen ${temaEscuro ? 'bg-black' : 'bg-[#F5F7FA]'} flex flex-col justify-center items-center p-4 font-sans`}>
        <div className={`w-full max-w-md ${CardStyle} border p-8 rounded-3xl space-y-6 shadow-2xl`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-tema-primario rounded-2xl flex items-center justify-center font-black text-2xl mb-3 shadow-lg">N</div>
            <h1 className="text-2xl font-black tracking-wider">NEXUS <span className="text-tema-primario">COB</span></h1>
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
      
      {/* MODAL AGENDA RAPIDA */}
      {modalAgendaRapida.exibir && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className={`${CardStyle} border p-6 rounded-3xl max-w-sm w-full text-center space-y-4`}>
            <CalendarPlus className="w-12 h-12 text-tema-primario mx-auto" />
            <h3 className="text-lg font-bold">Agendar Retorno</h3>
            <p className="text-sm opacity-70">Adicionar <b>{modalAgendaRapida.clienteNome}</b> para retorno amanhã?</p>
            <div className="flex space-x-2 pt-4">
              <button onClick={() => setModalAgendaRapida({exibir:false})} className="w-1/2 bg-zinc-400/20 py-3 rounded-xl font-bold">Cancelar</button>
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
              <div><label className="block mb-1 font-semibold opacity-70">Valor Final (R$)</label><input type="text" required value={modalAcordo.valor} onChange={e => setModalAcordo({...modalAcordo, valor: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} /></div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setModalAcordo({exibir:false})} className="w-1/2 bg-zinc-400/20 py-3 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="w-1/2 bg-tema-primario py-3 rounded-xl font-bold">Salvar Acordo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-[260px] ${temaEscuro ? 'bg-[#0a0a0a] border-zinc-900' : 'bg-white border-[#E2E8F0]'} border-r flex flex-col justify-between p-4 shadow-xl z-10`}>
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

            {/* Menu Vendas */}
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

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${CardStyle} border p-5 rounded-3xl`}><h3 className="font-bold border-b border-zinc-500/30 pb-3 mb-3">Total Carteira (Cobrança)</h3><p className="text-3xl font-black text-tema-primario">{clientes.length} Clientes</p></div>
              <div className={`${CardStyle} border p-5 rounded-3xl`}><h3 className="font-bold border-b border-zinc-500/30 pb-3 mb-3">Vendas Ativas (Pos)</h3><p className="text-3xl font-black text-cyan-500">{posVendas.length} Registros</p></div>
              <div className={`${CardStyle} border p-5 rounded-3xl`}><h3 className="font-bold border-b border-zinc-500/30 pb-3 mb-3">Listas de Up-Grade</h3><p className="text-3xl font-black text-purple-500">{listaUpgrade.length} Prontos</p></div>
            </div>
          )}

          {/* PIPELINE DE COBRANÇA */}
          {abaAtiva === 'cob_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-full pb-4">
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
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'cobranca'})} className="bg-zinc-500/10 border border-zinc-500/20 p-3 rounded-2xl cursor-grab hover:border-tema-primario">
                          <div className="flex justify-between items-start">
                            <div><p className="text-xs font-bold">{cli.nome}</p><p className="text-[9px] opacity-60">ID: {cli.codigo}</p></div>
                            <button onClick={() => setModalAgendaRapida({exibir:true, clienteNome: cli.nome, clienteId: cli.id, tipo:'cobranca'})} className="text-tema-primario hover:bg-zinc-500/20 p-1.5 rounded-lg"><CalendarPlus className="w-4 h-4"/></button>
                          </div>
                          {cli.dias_atraso && <p className="text-[9px] text-orange-500 font-bold mt-1">Atraso: {cli.dias_atraso}</p>}
                          <p className="text-xs font-black text-red-500 mt-2">R$ {parseFloat(cli.total_vencido||0).toFixed(2)}</p>
                          {cli.valor_acordo > 0 && <p className="text-[10px] font-bold text-green-500">Acordo: R$ {cli.valor_acordo}</p>}
                          <div className="mt-2 pt-2 border-t border-zinc-500/30 flex justify-between items-center text-[9px] opacity-70">
                            <span className="flex items-center space-x-1"><UserPlus className="w-3 h-3"/> <span>{cli.operador_atual || 'Aguardando Operador'}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* PIPELINE DE VENDAS */}
          {abaAtiva === 'pos_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-full pb-4">
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
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'pos-venda'})} className="bg-zinc-500/10 border border-zinc-500/20 p-3 rounded-2xl cursor-grab hover:border-tema-primario">
                          <p className="text-xs font-bold">{cli.nome}</p>
                          <div className="mt-2 pt-2 border-t border-zinc-500/30 text-[9px] opacity-70">Movido por: {cli.operador_atual || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TELAS GENÉRICAS (CADASTRO, AGENDA, SCRIPTS, CONTATOS E CHAT) */}
          {(abaAtiva === 'cob_cadastro' || abaAtiva === 'pos_cadastro') && (
            <div className={`${CardStyle} border p-6 rounded-3xl max-w-lg space-y-4`}>
              <h3 className="font-bold text-tema-primario">Cadastrar Novo Cliente</h3>
              <form className="space-y-3 text-xs" onSubmit={(e)=>{e.preventDefault(); alert('Cliente cadastrado!')}}>
                <input type="text" placeholder="Nome Completo" className={`w-full ${InputStyle} border p-3 rounded-xl`} />
                <input type="text" placeholder="Telefone" className={`w-full ${InputStyle} border p-3 rounded-xl`} />
                <button type="submit" className="w-full bg-tema-primario py-3 rounded-xl font-bold">Salvar Cliente</button>
              </form>
            </div>
          )}

          {(abaAtiva === 'cob_agenda' || abaAtiva === 'pos_agenda') && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
              <h3 className="font-bold text-tema-primario">Sua Agenda de Retornos</h3>
              {agenda.length === 0 ? <p className="text-xs opacity-70">Nenhum agendamento futuro.</p> : (
                <div className="space-y-2">
                  {agenda.map(a => (
                    <div key={a.id} className="p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-xl text-xs flex justify-between">
                      <span><b>{a.cliente_nome}</b> - {a.tipo}</span>
                      <span className="text-tema-primario font-bold">Retornar em: {a.data_retorno}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(abaAtiva === 'cob_scripts' || abaAtiva === 'pos_scripts') && (
            <div className="grid grid-cols-2 gap-6">
              <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-tema-primario">Cadastrar Script</h3>
                <input type="text" placeholder="Título da Oferta/Abordagem" value={novoScript.titulo} onChange={e=>setNovoScript({...novoScript, titulo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`} />
                <textarea rows="4" placeholder="Escreva o script aqui..." value={novoScript.conteudo} onChange={e=>setNovoScript({...novoScript, conteudo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`}></textarea>
                <button onClick={()=>{setScripts([...scripts, novoScript]); setNovoScript({titulo:'',conteudo:''})}} className="w-full bg-tema-primario py-3 rounded-xl font-bold text-xs">Salvar Script</button>
              </div>
              <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
                <h3 className="font-bold text-tema-primario">Base de Scripts</h3>
                {scripts.map((s, i) => (
                  <div key={i} className="p-3 bg-zinc-500/10 rounded-xl text-xs"><p className="font-bold">{s.titulo}</p><p className="opacity-70 mt-1">{s.conteudo}</p></div>
                ))}
              </div>
            </div>
          )}

          {(abaAtiva === 'cob_contatos' || abaAtiva === 'pos_contatos' || abaAtiva === 'pos_upgrade') && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
              <h3 className="font-bold text-tema-primario">Lista Telefônica / Contatos Importados</h3>
              <div className="space-y-2">
                {abaAtiva === 'pos_upgrade' ? listaUpgrade.map(c => <div key={c.id} className="p-3 bg-zinc-500/10 rounded-xl text-xs flex justify-between"><span>{c.nome} ({c.telefone})</span><span className="text-purple-500 font-bold">{c.plano}</span></div>)
                 : abaAtiva === 'pos_contatos' ? contatosAtivos.map(c => <div key={c.id} className="p-3 bg-zinc-500/10 rounded-xl text-xs flex justify-between"><span>{c.nome} ({c.telefone})</span><span className="text-cyan-500 font-bold">Venda Ativa</span></div>)
                 : clientes.map(c => <div key={c.id} className="p-3 bg-zinc-500/10 rounded-xl text-xs flex justify-between"><span>{c.nome} ({c.telefone})</span><span className="text-orange-500 font-bold">Atraso: {c.dias_atraso}</span></div>)}
              </div>
            </div>
          )}

          {(abaAtiva === 'cob_chat' || abaAtiva === 'pos_chat') && (
            <div className={`${CardStyle} border p-6 rounded-3xl flex flex-col h-[70vh]`}>
              <h3 className="font-bold text-tema-primario border-b border-zinc-500/30 pb-2 mb-4">Chat da Equipe</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {chatMensagens.map((m, i) => (
                  <div key={i} className={`p-3 rounded-2xl text-xs max-w-[70%] ${m.usuario === usuario.nome ? 'bg-tema-primario ml-auto' : 'bg-zinc-500/20'}`}>
                    <p className="font-bold opacity-70 text-[9px] mb-1">{m.usuario}</p><p>{m.texto}</p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 pt-2 border-t border-zinc-500/30">
                <input type="text" placeholder="Digite sua mensagem..." value={novaMensagem} onChange={e=>setNovaMensagem(e.target.value)} className={`flex-1 ${InputStyle} border p-3 rounded-xl text-xs`} />
                <button onClick={()=>{setChatMensagens([...chatMensagens, {usuario: usuario.nome, texto: novaMensagem}]); setNovaMensagem('');}} className="bg-tema-primario px-6 rounded-xl font-bold"><Send className="w-4 h-4"/></button>
              </div>
            </div>
          )}

          {/* ADMINISTRAÇÃO LISTAS (CORRIGIDA) */}
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
                <button onClick={confirmarImportacao} disabled={previaPlanilha.length===0} className="w-full bg-tema-primario disabled:opacity-50 py-3 rounded-xl font-black text-xs uppercase tracking-wider">Confirmar e Adicionar</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
