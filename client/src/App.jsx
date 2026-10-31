import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, Search, LogOut, 
  Trash2, Sun, Moon, ChevronDown, ChevronRight, PhoneCall,
  HeartHandshake, PlusCircle, Star, Sparkles, BookOpen, Layers
} from 'lucide-react';

const ESTAGIOS_COBRANCA = [
  { id: 1, nome: 'Novos Contatos', cor: 'border-slate-500' },
  { id: 2, nome: '1ª Tentativa', cor: 'border-blue-500' },
  { id: 3, nome: '2ª Tentativa', cor: 'border-indigo-500' },
  { id: 4, nome: '3ª Tentativa', cor: 'border-purple-500' },
  { id: 5, nome: 'Em Contato', cor: 'border-amber-500' },
  { id: 6, nome: 'Acordo Realizado', cor: 'border-emerald-500' },
  { id: 7, nome: 'Acordo Pago (Gestão)', cor: 'border-teal-500', restrito: true }
];

const ESTAGIOS_POS_VENDA = [
  { id: 1, nome: 'Venda Instalada', cor: 'border-blue-500' },
  { id: 2, nome: 'Acompanhamento 15 Dias', cor: 'border-cyan-500' },
  { id: 3, nome: 'Acompanhamento 30 Dias', cor: 'border-purple-500' },
  { id: 4, nome: 'Satisfação do Cliente', cor: 'border-emerald-500', comAvaliacao: true }
];

const formatarTelefone = (tel) => {
  if (!tel) return '';
  const limpo = String(tel).replace(/\D/g, '');
  if (limpo.length === 11) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  if (limpo.length === 10) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  return tel;
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [temaEscuro, setTemaEscuro] = useState(() => localStorage.getItem('nexus_theme') !== 'light');

  const [abaAtiva, setAbaAtiva] = useState('cob_pipeline');
  const [menuCobranca, setMenuCobranca] = useState(true);
  const [menuPosVenda, setMenuPosVenda] = useState(true);
  const [menuAdmin, setMenuAdmin] = useState(true);

  // ESTADOS DO SISTEMA
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState(() => JSON.parse(localStorage.getItem('nexus_clientes') || '[]'));
  const [posVendas, setPosVendas] = useState(() => JSON.parse(localStorage.getItem('nexus_posVendas') || '[]'));
  const [listaUpgrade, setListaUpgrade] = useState(() => JSON.parse(localStorage.getItem('nexus_listaUpgrade') || '[]'));
  const [listaVendasAtivas, setListaVendasAtivas] = useState(() => JSON.parse(localStorage.getItem('nexus_listaVendasAtivas') || '[]'));
  const [agenda, setAgenda] = useState(() => JSON.parse(localStorage.getItem('nexus_agenda') || '[]'));
  const [planos, setPlanos] = useState(() => JSON.parse(localStorage.getItem('nexus_planos') || '[{"id":1, "nome":"Fibra 300 Mega", "valor":"99.90"},{"id":2, "nome":"Fibra 600 Mega", "valor":"129.90"}]'));
  const [scripts, setScripts] = useState(() => JSON.parse(localStorage.getItem('nexus_scripts') || '[]'));

  // FORMULÁRIOS & IMPORTAÇÃO
  const [buscaPipeline, setBuscaPipeline] = useState('');
  const [tipoImportacao, setTipoImportacao] = useState('cobranca');
  const [categoriaCobranca, setCategoriaCobranca] = useState('30 Dias');
  const [previaPlanilha, setPreviaPlanilha] = useState([]);

  const [novoUsuario, setNovoUsuario] = useState({ nome: '', login: '', senha: '', cargo: 'COBRADOR' });
  const [novoClienteCob, setNovoClienteCob] = useState({ codigo: '', nome: '', telefone: '', total_vencido: '', dias_atraso: '30 Dias' });
  const [novoPosVenda, setNovoPosVenda] = useState({ codigo: '', nome: '', telefone: '', plano: '' });
  const [novoPlano, setNovoPlano] = useState({ nome: '', valor: '' });
  const [novoScript, setNovoScript] = useState({ titulo: '', conteudo: '' });

  // AUTENTICAÇÃO VIA API
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginInput, senha: senhaInput })
      });
      const data = await res.json();
      if (res.ok) {
        setUsuario(data);
        carregarUsuarios();
      } else {
        alert(data.error || 'Falha ao autenticar.');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
    }
  };

  const carregarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) setUsuarios(await res.json());
    } catch (err) { console.error(err); }
  };

  const cadastrarUsuario = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUsuario)
      });
      if (res.ok) {
        alert('Usuário cadastrado com sucesso!');
        setNovoUsuario({ nome: '', login: '', senha: '', cargo: 'COBRADOR' });
        carregarUsuarios();
      } else {
        const d = await res.json();
        alert(d.error || 'Erro ao salvar usuário.');
      }
    } catch { alert('Erro na requisição.'); }
  };

  const excluirUsuario = async (id) => {
    if (!confirm('Deseja excluir este usuário?')) return;
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) carregarUsuarios();
    } catch { alert('Erro ao excluir.'); }
  };

  // PERSISTÊNCIA LOCAL DAS LISTAS
  useEffect(() => { localStorage.setItem('nexus_clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('nexus_posVendas', JSON.stringify(posVendas)); }, [posVendas]);
  useEffect(() => { localStorage.setItem('nexus_listaUpgrade', JSON.stringify(listaUpgrade)); }, [listaUpgrade]);
  useEffect(() => { localStorage.setItem('nexus_listaVendasAtivas', JSON.stringify(listaVendasAtivas)); }, [listaVendasAtivas]);
  useEffect(() => { localStorage.setItem('nexus_agenda', JSON.stringify(agenda)); }, [agenda]);
  useEffect(() => { localStorage.setItem('nexus_planos', JSON.stringify(planos)); }, [planos]);
  useEffect(() => { localStorage.setItem('nexus_scripts', JSON.stringify(scripts)); }, [scripts]);

  useEffect(() => {
    localStorage.setItem('nexus_theme', temaEscuro ? 'dark' : 'light');
    if (temaEscuro) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [temaEscuro]);

  // DRAG & DROP NOS PIPELINES
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
      if (estagioId === 7 && usuario.cargo !== 'SUPERVISOR' && usuario.cargo !== 'ADMIN') {
        alert('Apenas o SUPERVISOR ou ADMINISTRADOR pode mover para o estágio Acordo Pago.');
        return;
      }
      setClientes(c => c.map(x => x.id == id ? { ...x, estagio_id: estagioId, operador: usuario.nome } : x));
    } else if (tipoPipeline === 'pos-venda') {
      setPosVendas(p => p.map(x => x.id == id ? { ...x, estagio_id: estagioId, operador: usuario.nome } : x));
    }
  };

  const avaliarClientePos = (id, estrelas) => {
    setPosVendas(p => p.map(x => x.id === id ? { ...x, avaliacao: estrelas } : x));
  };

  // LEITOR DE PLANILHAS (CSV/TXT)
  const lerCSV = (texto, delimitador) => {
    const linhas = [];
    let linha = [], campo = '', aspas = false;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto[i];
      if (ch === '"' && texto[i + 1] === '"' && aspas) { campo += '"'; i++; }
      else if (ch === '"') aspas = !aspas;
      else if (ch === delimitador && !aspas) { linha.push(campo.trim()); campo = ''; }
      else if ((ch === '\n' || ch === '\r') && !aspas) {
        if (ch === '\r' && texto[i + 1] === '\n') i++;
        linha.push(campo.trim());
        if (linha.some(v => v !== '')) linhas.push(linha);
        linha = []; campo = '';
      } else campo += ch;
    }
    linha.push(campo.trim());
    if (linha.some(v => v !== '')) linhas.push(linha);
    return linhas;
  };

  const handleUploadPlanilha = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const delimitador = [',', ';', '\t'].sort((a, b) => texto.split(b).length - texto.split(a).length)[0];
      const linhas = lerCSV(texto.replace(/^\uFEFF/, ''), delimitador);
      if (linhas.length < 2) return alert('Arquivo sem conteúdo válido.');
      
      const registros = linhas.slice(1).map((col, idx) => ({
        id: `IMP-${Date.now()}-${idx}`,
        codigo: col[0] || `ID-${idx + 1}`,
        nome: col[1] || 'Sem Nome',
        valor_ou_tel_ou_plano: col[2] || '',
        estagio_id: 1,
        operador: usuario?.nome
      }));
      setPreviaPlanilha(registros);
    } catch { alert('Erro ao processar arquivo.'); }
  };

  const processarImportacao = () => {
    if (tipoImportacao === 'cobranca') {
      const mapeados = previaPlanilha.map(r => ({
        ...r, total_vencido: r.valor_ou_tel_ou_plano || '0.00', dias_atraso: categoriaCobranca
      }));
      setClientes(c => [...c, ...mapeados]);
      setAbaAtiva('cob_pipeline');
    } else if (tipoImportacao === 'upgrade') {
      const mapeados = previaPlanilha.map(r => ({ ...r, plano: r.valor_ou_tel_ou_plano }));
      setListaUpgrade(u => [...u, ...mapeados]);
      setAbaAtiva('pos_upgrade');
    } else if (tipoImportacao === 'vendas_ativas') {
      const mapeados = previaPlanilha.map(r => ({ ...r, telefone: r.valor_ou_tel_ou_plano }));
      setListaVendasAtivas(v => [...v, ...mapeados]);
      setAbaAtiva('pos_vendas_ativas');
    }
    alert('Planilha importada com sucesso!');
    setPreviaPlanilha([]);
  };

  const InputStyle = temaEscuro ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500 shadow-inner' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 shadow-sm';
  const CardStyle = temaEscuro ? 'bg-slate-900/90 border-slate-800/80 shadow-2xl backdrop-blur-xl text-slate-100' : 'bg-white/90 border-slate-200/80 shadow-xl backdrop-blur-xl text-slate-900';

  if (!usuario) {
    return (
      <div className={`min-h-screen ${temaEscuro ? 'bg-[#090D16] text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col justify-between items-center p-6 font-sans relative overflow-hidden select-none`}>
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <div className={`w-full max-w-md ${CardStyle} border p-8 rounded-3xl space-y-6 relative z-10 shadow-2xl`}>
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-3xl mb-2 shadow-xl text-white">N</div>
              <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">NEXUS</h1>
              <h2 className="text-sm font-bold tracking-widest uppercase opacity-80">METRONET B2C</h2>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-70">Login / Usuário</label>
                <input type="text" required value={loginInput} onChange={e => setLoginInput(e.target.value)} placeholder="Seu usuário" className={`w-full ${InputStyle} border rounded-xl px-4 py-3.5 text-xs outline-none`} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-70">Senha de Acesso</label>
                <input type="password" required value={senhaInput} onChange={e => setSenhaInput(e.target.value)} placeholder="••••••••" className={`w-full ${InputStyle} border rounded-xl px-4 py-3.5 text-xs outline-none`} />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black py-4 rounded-xl uppercase tracking-wider text-xs shadow-lg transition-all">
                Acessar Sistema
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans ${temaEscuro ? 'bg-[#090D16] text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* SIDEBAR NAVEGAÇÃO */}
      <aside className={`w-[270px] ${temaEscuro ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'} border-r flex flex-col justify-between p-4 shadow-2xl z-10 shrink-0 backdrop-blur-md`}>
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg">N</div>
            <div>
              <span className="font-black text-lg tracking-wide">NEXUS<span className="text-indigo-400">COB</span></span>
              <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Metronet Enterprise</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {/* SUBMENU COBRANÇA */}
            <div>
              <button onClick={() => setMenuCobranca(!menuCobranca)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva.startsWith('cob_') ? 'text-indigo-400 font-bold' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Users className="w-4 h-4"/><span>COBRANÇA</span></div>
                {menuCobranca ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuCobranca && (
                <div className="ml-4 mt-1 border-l-2 border-indigo-500/30 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('cob_pipeline')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_pipeline' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Pipeline Cobrança</button>
                  <button onClick={() => setAbaAtiva('cob_cadastro')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_cadastro' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Cadastro de Cliente</button>
                  <button onClick={() => setAbaAtiva('cob_agenda')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_agenda' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Agenda</button>
                  <button onClick={() => setAbaAtiva('cob_scripts')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'cob_scripts' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Script de Vendas/Cob</button>
                </div>
              )}
            </div>

            {/* SUBMENU PÓS-VENDAS B2C */}
            <div>
              <button onClick={() => setMenuPosVenda(!menuPosVenda)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva.startsWith('pos_') ? 'text-indigo-400 font-bold' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><HeartHandshake className="w-4 h-4"/><span>PÓS-VENDAS B2C</span></div>
                {menuPosVenda ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuPosVenda && (
                <div className="ml-4 mt-1 border-l-2 border-indigo-500/30 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('pos_pipeline')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_pipeline' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Pipeline Pós-Vendas</button>
                  <button onClick={() => setAbaAtiva('pos_cadastro')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_cadastro' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Cadastro de Cliente</button>
                  <button onClick={() => setAbaAtiva('pos_planos')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_planos' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Cadastro de Planos</button>
                  <button onClick={() => setAbaAtiva('pos_upgrade')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_upgrade' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Opção Up-Grade</button>
                  <button onClick={() => setAbaAtiva('pos_vendas_ativas')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_vendas_ativas' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Vendas Ativas</button>
                  <button onClick={() => setAbaAtiva('pos_scripts')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'pos_scripts' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Script de Vendas</button>
                </div>
              )}
            </div>

            {/* SUBMENU ADMINISTRAÇÃO - LIBERADO PARA TODOS */}
            <div>
              <button onClick={() => setMenuAdmin(!menuAdmin)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${abaAtiva.startsWith('admin_') ? 'text-indigo-400 font-bold' : 'opacity-70 hover:opacity-100'}`}>
                <div className="flex items-center space-x-3"><Settings className="w-4 h-4"/><span>ADMINISTRAÇÃO</span></div>
                {menuAdmin ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
              </button>
              {menuAdmin && (
                <div className="ml-4 mt-1 border-l-2 border-indigo-500/30 space-y-1 pl-2 text-[11px]">
                  <button onClick={() => setAbaAtiva('admin_usuarios')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'admin_usuarios' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Cadastro de Usuários</button>
                  <button onClick={() => setAbaAtiva('admin_listas')} className={`w-full text-left py-2 px-3 rounded-lg ${abaAtiva === 'admin_listas' ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'opacity-70'}`}>Opção de Listas</button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-500/20 space-y-3">
          <button onClick={() => setTemaEscuro(!temaEscuro)} className="w-full flex items-center justify-center space-x-2 bg-slate-500/10 py-2.5 rounded-xl text-xs font-semibold">
            {temaEscuro ? <Sun className="w-4 h-4 text-amber-500"/> : <Moon className="w-4 h-4 text-indigo-400"/>}
            <span>{temaEscuro ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>
          <div className="bg-slate-500/10 p-3 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="font-bold truncate max-w-[120px]">{usuario.nome}</p>
              <p className="text-[9px] text-indigo-400 font-bold">{usuario.cargo}</p>
            </div>
            <button onClick={() => setUsuario(null)} className="text-rose-500 hover:bg-rose-500/15 p-1.5 rounded-lg"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`h-16 ${CardStyle} border-b flex items-center justify-between px-6 shrink-0`}>
          <h2 className="text-xs font-black uppercase tracking-wider text-indigo-400">{abaAtiva.replace('_', ' - ')}</h2>
          <div className="relative w-72">
            <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-3"/>
            <input type="text" placeholder="Buscar registros..." value={buscaPipeline} onChange={e => setBuscaPipeline(e.target.value)} className={`w-full ${InputStyle} border rounded-full pl-10 pr-4 py-2 text-xs outline-none`} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* PIPELINE COBRANÇA */}
          {abaAtiva === 'cob_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-[75vh] pb-4">
              {ESTAGIOS_COBRANCA.map(estagio => {
                const lista = clientes.filter(c => (c.estagio_id || 1) === estagio.id && c.nome.toLowerCase().includes(buscaPipeline.toLowerCase()));
                return (
                  <div key={estagio.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, estagio.id, 'cobranca')} className={`${CardStyle} border rounded-3xl p-3.5 min-w-[270px] flex flex-col shadow-lg`}>
                    <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                      <span className="text-[11px] font-bold uppercase tracking-wide">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-indigo-500/20 text-indigo-400">{lista.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {lista.map(cli => (
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'cobranca'})} className="bg-slate-500/10 border border-slate-500/20 p-3.5 rounded-2xl cursor-grab hover:border-indigo-500 transition-all shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold">{cli.nome}</p>
                              <p className="text-[9px] opacity-60">ID: {cli.codigo}</p>
                            </div>
                            <button onClick={() => setClientes(clientes.filter(c => c.id !== cli.id))} className="text-rose-500 hover:bg-rose-500/15 p-1 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                          {cli.dias_atraso && <p className="text-[9px] text-amber-400 font-bold mt-1">Atraso: {cli.dias_atraso}</p>}
                          <p className="text-xs font-black text-rose-400 mt-2">R$ {parseFloat(cli.total_vencido||0).toFixed(2)}</p>
                          {cli.telefone && (
                            <a href={`sip:${cli.telefone.replace(/\D/g, '')}`} className="mt-3 inline-flex items-center space-x-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all">
                              <PhoneCall className="w-3 h-3"/> <span>Ligar via MicroSIP</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* PIPELINE PÓS-VENDAS */}
          {abaAtiva === 'pos_pipeline' && (
            <div className="flex gap-4 overflow-x-auto h-[75vh] pb-4">
              {ESTAGIOS_POS_VENDA.map(estagio => {
                const lista = posVendas.filter(c => (c.estagio_id || 1) === estagio.id && c.nome.toLowerCase().includes(buscaPipeline.toLowerCase()));
                return (
                  <div key={estagio.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, estagio.id, 'pos-venda')} className={`${CardStyle} border rounded-3xl p-3.5 min-w-[270px] flex flex-col shadow-lg`}>
                    <div className={`border-b-2 ${estagio.cor} pb-2 mb-3 flex justify-between items-center`}>
                      <span className="text-[11px] font-bold uppercase tracking-wide">{estagio.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-indigo-500/20 text-indigo-400">{lista.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {lista.map(cli => (
                        <div key={cli.id} draggable onDragStart={(e) => onDragStart(e, {...cli, tipoPipeline: 'pos-venda'})} className="bg-slate-500/10 border border-slate-500/20 p-3.5 rounded-2xl cursor-grab hover:border-indigo-500 transition-all shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold">{cli.nome}</p>
                              <p className="text-[9px] opacity-60">ID: {cli.codigo}</p>
                            </div>
                            <button onClick={() => setPosVendas(posVendas.filter(c => c.id !== cli.id))} className="text-rose-500 hover:bg-rose-500/15 p-1 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                          <p className="text-[10px] text-cyan-400 font-semibold mt-1">Plano: {cli.plano || 'N/A'}</p>
                          {estagio.comAvaliacao && (
                            <div className="mt-2 pt-2 border-t border-slate-500/20 flex items-center justify-between">
                              <span className="text-[9px] font-bold opacity-70">Nota:</span>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map(num => (
                                  <Star key={num} onClick={() => avaliarClientePos(cli.id, num)} className={`w-3.5 h-3.5 cursor-pointer ${num <= (cli.avaliacao || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VENDAS ATIVAS */}
          {abaAtiva === 'pos_vendas_ativas' && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4 shadow-xl`}>
              <h3 className="font-bold text-indigo-400 border-b border-slate-500/20 pb-2 text-xs uppercase">Lista de Vendas Ativas</h3>
              <div className="space-y-2">
                {listaVendasAtivas.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-500/10 border border-slate-500/20 rounded-2xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold">{item.nome} (ID: {item.codigo})</p>
                      <p className="opacity-70 text-[10px]">Tel: {formatarTelefone(item.telefone)}</p>
                    </div>
                    {item.telefone && (
                      <a href={`sip:${item.telefone.replace(/\D/g, '')}`} className="inline-flex items-center space-x-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all">
                        <PhoneCall className="w-3 h-3"/> <span>Ligar MicroSIP</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMPORTAÇÃO DE LISTAS */}
          {abaAtiva === 'admin_listas' && (
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4 shadow-xl max-w-xl`}>
              <h3 className="font-bold text-indigo-400 border-b border-slate-500/20 pb-2 text-xs uppercase">Importar Planilhas (CSV / TXT)</h3>
              <div>
                <label className="block mb-1 text-xs font-semibold opacity-70">Tipo de Lista</label>
                <select value={tipoImportacao} onChange={e=>setTipoImportacao(e.target.value)} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`}>
                  <option value="cobranca">Lista para Cobrança (ID, Nome, Valor Devedor R$)</option>
                  <option value="upgrade">Lista Up-Grade (ID, Nome, Plano Atual)</option>
                  <option value="vendas_ativas">Vendas Ativas (ID, Nome, Telefone)</option>
                </select>
              </div>

              {tipoImportacao === 'cobranca' && (
                <div>
                  <label className="block mb-1 text-xs font-semibold opacity-70">Faixa de Atraso</label>
                  <select value={categoriaCobranca} onChange={e=>setCategoriaCobranca(e.target.value)} className={`w-full ${InputStyle} border p-3 rounded-xl text-xs`}>
                    <option value="30 Dias">30 Dias</option>
                    <option value="60 Dias">60 Dias</option>
                    <option value="90 Dias">90 Dias</option>
                    <option value="Cancelados">Cancelados</option>
                  </select>
                </div>
              )}

              <input type="file" accept=".csv,.txt" onChange={handleUploadPlanilha} className="w-full text-xs opacity-70 cursor-pointer"/>
              {previaPlanilha.length > 0 && (
                <div className="p-3 bg-slate-500/10 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-400">{previaPlanilha.length} registro(s) prontos para importar.</p>
                </div>
              )}
              <button onClick={processarImportacao} disabled={previaPlanilha.length === 0} className="w-full bg-indigo-600 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold uppercase text-xs">Processar e Importar</button>
            </div>
          )}

          {/* CADASTRO DE USUÁRIOS */}
          {abaAtiva === 'admin_usuarios' && (
            <div className="grid grid-cols-3 gap-6">
              <div className={`${CardStyle} border p-6 rounded-3xl space-y-4 h-fit shadow-xl`}>
                <h3 className="font-bold text-indigo-400 border-b border-slate-500/20 pb-2 text-xs uppercase">Novo Usuário</h3>
                <form onSubmit={cadastrarUsuario} className="space-y-3 text-xs">
                  <input type="text" required placeholder="Nome Completo" value={novoUsuario.nome} onChange={e=>setNovoUsuario({...novoUsuario, nome: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} />
                  <input type="text" required placeholder="Login de Acesso" value={novoUsuario.login} onChange={e=>setNovoUsuario({...novoUsuario, login: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} />
                  <input type="password" required placeholder="Senha" value={novoUsuario.senha} onChange={e=>setNovoUsuario({...novoUsuario, senha: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`} />
                  <select value={novoUsuario.cargo} onChange={e=>setNovoUsuario({...novoUsuario, cargo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl`}>
                    <option value="COBRADOR">COBRADOR (Agente)</option>
                    <option value="SUPERVISOR">SUPERVISOR (Acesso Total)</option>
                    <option value="ADMIN">ADMIN (Acesso Total)</option>
                  </select>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold uppercase">Cadastrar Usuário</button>
                </form>
              </div>
              <div className={`col-span-2 ${CardStyle} border p-6 rounded-3xl space-y-4 shadow-xl`}>
                <h3 className="font-bold text-indigo-400 border-b border-slate-500/20 pb-2 text-xs uppercase">Usuários Cadastrados ({usuarios.length})</h3>
                <div className="space-y-2">
                  {usuarios.map(u => (
                    <div key={u.id} className="p-3.5 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold">{u.nome} ({u.login})</p>
                        <p className="text-[10px] opacity-60">Cargo: <span className="text-indigo-400 font-bold">{u.cargo}</span></p>
                      </div>
                      <button onClick={() => excluirUsuario(u.id)} className="text-rose-500"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
