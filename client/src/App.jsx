import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Calendar, Settings, MessageSquare, Search, LogOut, 
  Send, Trash2, Sun, Moon, Filter, Award, ChevronDown, ChevronRight, Upload, 
  HeartHandshake, PlusCircle, Wrench, BookOpen, CheckCircle, CalendarPlus, Star, UserPlus, Edit3, Phone, ShieldCheck, Sparkles, Lock
} from 'lucide-react';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [temaEscuro, setTemaEscuro] = useState(() => localStorage.getItem('nexus_theme') !== 'light');

  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [menuCobranca, setMenuCobranca] = useState(false);
  const [menuPosVenda, setMenuPosVenda] = useState(false);
  const [menuAdmin, setMenuAdmin] = useState(false);

  // ESTADO DE USUÁRIOS BUSCADO DA API/BANCO DE DADOS
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);

  const [novoUsuario, setNovoUsuario] = useState({ nome: '', cargo: 'COBRADOR', senha: '123456' });

  // Buscar usuários do banco de dados na inicialização
  const carregarUsuariosDoBanco = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const dados = await res.json();
        setUsuarios(dados);
      }
    } catch (err) {
      console.error("Erro ao buscar usuários do banco", err);
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  useEffect(() => {
    carregarUsuariosDoBanco();
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_theme', temaEscuro ? 'dark' : 'light');
    if (temaEscuro) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [temaEscuro]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usuarioSelecionadoId) {
      alert('Selecione um usuário.');
      return;
    }
    const achado = usuarios.find(u => String(u.id) === String(usuarioSelecionadoId));
    if (!achado) {
      alert('Usuário não localizado.');
      return;
    }
    if (String(achado.senha || '123456') !== String(senhaLogin)) {
      alert('Senha incorreta.');
      return;
    }
    setUsuario(achado);
  };

  const cadastrarUsuarioNoBanco = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUsuario)
      });
      if (res.ok) {
        alert('Usuário salvo no banco de dados com sucesso!');
        setNovoUsuario({ nome: '', cargo: 'COBRADOR', senha: '123456' });
        carregarUsuariosDoBanco(); // Atualiza em tempo real
      } else {
        alert('Erro ao salvar usuário no banco.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar no banco.');
    }
  };

  const InputStyle = temaEscuro ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-indigo-500 shadow-inner' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 shadow-sm';
  const CardStyle = temaEscuro ? 'bg-zinc-900/90 border-zinc-800/80 shadow-2xl backdrop-blur-xl text-zinc-100' : 'bg-white/90 border-slate-200/80 shadow-xl backdrop-blur-xl text-slate-900';

  if (!usuario) {
    return (
      <div className={`min-h-screen ${temaEscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col justify-between items-center p-6 font-sans relative overflow-hidden select-none`}>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <div className={`w-full max-w-md ${CardStyle} border p-8 rounded-3xl space-y-6 relative z-10 shadow-2xl transition-all`}>
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center font-black text-3xl mb-2 shadow-xl shadow-indigo-500/30 text-white">N</div>
              <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">NEXUS</h1>
              <h2 className="text-sm font-bold tracking-widest uppercase opacity-80">METRONET</h2>
              <p className="text-[11px] opacity-60 mt-1 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500"/> Gestão Operacional Conectada
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-70">Operador / Usuário (Banco de Dados)</label>
                <select 
                  required 
                  value={usuarioSelecionadoId} 
                  onChange={e => setUsuarioSelecionadoId(e.target.value)} 
                  className={`w-full ${InputStyle} border rounded-xl px-4 py-3.5 text-xs transition-all outline-none`}
                >
                  <option value="">{carregandoUsuarios ? 'Carregando do banco...' : '-- Selecione o operador --'}</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-70">Senha de Acesso</label>
                <input 
                  type="password" 
                  required 
                  value={senhaLogin} 
                  onChange={e => setSenhaLogin(e.target.value)} 
                  placeholder="••••••••" 
                  className={`w-full ${InputStyle} border rounded-xl px-4 py-3.5 text-xs transition-all outline-none`} 
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-4 rounded-xl uppercase tracking-wider text-xs shadow-lg shadow-indigo-600/30 transition-all transform active:scale-[0.99]">
                Acessar Plataforma
              </button>
            </form>
          </div>
        </div>

        <footer className="w-full text-center space-y-1.5 py-4 border-t border-slate-500/20 text-xs opacity-85 z-10">
          <p className="italic font-medium max-w-xl mx-auto text-[11px]">"Tudo quanto fizerem, façam-no de todo o coração, como para o Senhor, e não para os homens." — Colossenses 3:23</p>
          <p className="font-black tracking-widest uppercase text-[11px] text-indigo-500">DEVELOPER JET SISTEMAS</p>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans ${temaEscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <aside className={`w-[270px] ${temaEscuro ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-slate-200'} border-r flex flex-col justify-between p-4 shadow-2xl z-10 shrink-0 backdrop-blur-md`}>
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30">N</div>
            <div>
              <span className="font-black text-lg tracking-wide">NEXUS<span className="text-indigo-500">COB</span></span>
              <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Metronet Enterprise</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <button onClick={() => setAbaAtiva('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'dashboard' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 font-bold' : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'}`}>
              <BarChart2 className="w-4 h-4"/> <span>Dashboard / Ranking</span>
            </button>
            
            {usuario.cargo === 'ADMIN' && (
              <button onClick={() => setAbaAtiva('admin_usuarios')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${abaAtiva === 'admin_usuarios' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 font-bold' : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'}`}>
                <Settings className="w-4 h-4"/> <span>Usuários e Permissões</span>
              </button>
            )}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-500/20 space-y-3">
          <div className="bg-slate-500/10 p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-500/10">
            <div>
              <p className="font-bold truncate max-w-[120px]">{usuario.nome}</p>
              <p className="text-[9px] text-indigo-500 font-bold">{usuario.cargo}</p>
            </div>
            <button onClick={() => setUsuario(null)} className="text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg transition-all"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden p-6 space-y-6">
        {abaAtiva === 'dashboard' && (
          <div className={`${CardStyle} border p-6 rounded-3xl space-y-4`}>
            <h2 className="text-lg font-bold text-indigo-500">Sistema Conectado ao Banco de Dados Principal</h2>
            <p className="text-xs opacity-70">Todos os logins agora compartilham o mesmo banco de dados sincronizado em nuvem.</p>
          </div>
        )}

        {abaAtiva === 'admin_usuarios' && (
          <div className="grid grid-cols-3 gap-6">
            <div className={`${CardStyle} border p-6 rounded-3xl space-y-4 h-fit shadow-xl`}>
              <h3 className="font-bold text-indigo-500 border-b border-slate-500/20 pb-2 text-xs uppercase">Novo Usuário (Salva no Banco)</h3>
              <form onSubmit={cadastrarUsuarioNoBanco} className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 font-semibold opacity-70">Nome do Operador</label>
                  <input type="text" required value={novoUsuario.nome} onChange={e=>setNovoUsuario({...novoUsuario, nome: e.target.value})} placeholder="Ex: JESSICA" className={`w-full ${InputStyle} border p-3 rounded-xl outline-none`} />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-70">Senha de Acesso</label>
                  <input type="password" required minLength={4} value={novoUsuario.senha} onChange={e=>setNovoUsuario({...novoUsuario, senha: e.target.value})} placeholder="••••••" className={`w-full ${InputStyle} border p-3 rounded-xl outline-none`} />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-70">Cargo / Função</label>
                  <select value={novoUsuario.cargo} onChange={e=>setNovoUsuario({...novoUsuario, cargo: e.target.value})} className={`w-full ${InputStyle} border p-3 rounded-xl outline-none`}>
                    <option value="VENDEDOR">VENDEDOR</option>
                    <option value="COBRADOR">COBRADOR</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold uppercase shadow-lg shadow-indigo-600/30 transition-all">Salvar no Banco</button>
              </form>
            </div>

            <div className={`col-span-2 ${CardStyle} border p-6 rounded-3xl space-y-4 shadow-xl`}>
              <h3 className="font-bold text-indigo-500 border-b border-slate-500/20 pb-2 text-xs uppercase">Usuários Cadastrados no Banco ({usuarios.length})</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {usuarios.map(u => (
                  <div key={u.id} className="p-3.5 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex justify-between items-center text-xs shadow-sm">
                    <div>
                      <p className="font-bold text-sm">{u.nome}</p>
                      <p className="opacity-60 text-[10px]">Cargo: <span className="text-indigo-500 font-bold">{u.cargo}</span> • Email/Login: {u.email || u.nome}</p>
                    </div>
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
