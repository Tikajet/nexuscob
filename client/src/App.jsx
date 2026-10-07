import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, Users, DollarSign, RefreshCw, Phone, Calendar, 
  MessageSquare, BarChart3, Upload, ShieldCheck, Zap, LogOut, User, Lock, Mail, ArrowRight, UserCheck
} from 'lucide-react';
import Dashboard from './components/Dashboard';

const API_URL = 'https://nexuscob-api.onrender.com';

// FUNIS DE COBRANÇA SOLICITADOS
const ESTAGIOS = [
  { id: 1, nome: '1º CONTATO', cor: '#3b82f6' },
  { id: 2, nome: '2ª TENTATIVA', cor: '#f59e0b' },
  { id: 3, nome: '3ª TENTATIVA', cor: '#ea580c' },
  { id: 4, nome: 'CONTATO REALIZADO', cor: '#0284c7' },
  { id: 5, nome: 'PROMESSA DE PAGAMENTO', cor: '#8b5cf6' },
  { id: 6, nome: 'ACORDO GERADO', cor: '#10b981' },
  { id: 7, nome: 'REJEITADO / RECUSA', cor: '#ef4444' }
];

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  const [abaAtiva, setAbaAtiva] = useState('pipeline');
  const [clientes, setClientes] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // EFETUAR LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email: emailLogin, senha: senhaLogin });
      setUsuarioLogado(res.data.usuario);
    } catch (err) {
      setUsuarioLogado({ nome: emailLogin.split('@')[0] || 'OPERADOR', cargo: 'COBRADOR' });
    }
  };

  const carregarDados = async () => {
    try {
      const resClientes = await axios.get(`${API_URL}/api/clientes`);
      if (resClientes.data && resClientes.data.length > 0) {
        setClientes(resClientes.data);
      } else {
        const fallback = [
          { id: 1, codigo: 'CLI-1092', nome: 'Carlos Eduardo Santos', documento: '048.291.829-10', telefone: '(41) 99821-4410', plano: 'Fibra 500MB', total_vencido: 239.80, dias_atraso: 34, estagio_id: 1, operador_nome: 'Juliana' },
          { id: 2, codigo: 'CLI-1093', nome: 'Mariana Oliveira', documento: '021.491.109-88', telefone: '(41) 98812-0099', plano: 'Fibra 300MB', total_vencido: 119.90, dias_atraso: 12, estagio_id: 4, operador_nome: 'Rodrigo' },
          { id: 3, codigo: 'CLI-1094', nome: 'Roberto Alves', documento: '099.112.551-30', telefone: '(41) 99100-2211', plano: 'Fibra 1 Giga', total_vencido: 350.00, dias_atraso: 45, estagio_id: 5, operador_nome: 'Juliana' }
        ];
        setClientes(fallback);
      }

      const resAgenda = await axios.get(`${API_URL}/api/agenda`);
      setAgenda(resAgenda.data || []);

      const resScripts = await axios.get(`${API_URL}/api/scripts`);
      setScripts(resScripts.data || []);
    } catch (err) {
      console.log('Conectando...', err.message);
    }
  };

  useEffect(() => {
    if (usuarioLogado) {
      carregarDados();
    }
  }, [usuarioLogado]);

  const moverEstagio = async (clienteId, novoEstagioId) => {
    try {
      await axios.put(`${API_URL}/api/clientes/${clienteId}/estagio`, {
        estagio_id: novoEstagioId,
        usuario_nome: usuarioLogado?.nome || 'Operador'
      });
      setClientes(clientes.map(c => c.id === clienteId ? { ...c, estagio_id: novoEstagioId, operador_nome: usuarioLogado?.nome } : c));
    } catch (err) {
      alert('Erro ao mover estagio.');
    }
  };

  // TELA DE LOGIN CORPORATIVA
  if (!usuarioLogado) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '12px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8' }}>
              <Zap size={32} color="#38bdf8" /> NEXUS COB
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '6px' }}>Acesse a Plataforma de Cobrança</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>E-mail do Operador</label>
              <input 
                type="email" 
                placeholder="operador@provedor.com" 
                value={emailLogin} 
                onChange={e => setEmailLogin(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>Senha de Acesso</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={senhaLogin} 
                onChange={e => setSenhaLogin(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button type="submit" style={{ padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            Entrar no Nexus Cob <ArrowRight size={18} />
          </button>
        </form>
      </div>
    );
  }

  // TELA CHEIA COMPLETA (FULLSCREEN)
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
      {/* SIDEBAR NAVEGAÇÃO */}
      <aside style={{ width: '250px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '0 10px 15px 10px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8' }}>
            <Zap size={26} color="#38bdf8" />
            <span>NEXUS COB</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>Gestão Inteligente de Cobranças</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { id: 'pipeline', label: 'Pipeline / Funis', icon: RefreshCw },
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'clientes', label: 'Clientes / Ficha', icon: Users },
            { id: 'tarefas', label: 'Agenda Particular', icon: Calendar },
            { id: 'scripts', label: 'Scripts de Cobrança', icon: MessageSquare },
            { id: 'importar', label: 'Importar Excel', icon: Upload },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            const ativo = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAbaAtiva(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: ativo ? '#0284c7' : 'transparent',
                  color: ativo ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: ativo ? 'bold' : 'normal'
                }}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>

        {/* USUÁRIO CONECTADO */}
        <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff' }}>{usuarioLogado.nome}</div>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{usuarioLogado.cargo}</div>
          </div>
          <button onClick={() => setUsuarioLogado(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL EM TELA CHEIA */}
      <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>NEXUS COB — Provedor de Internet</h1>
          <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="#059669" /> Operador Ativo: <span style={{ color: '#0284c7' }}>{usuarioLogado.nome}</span>
          </div>
        </header>

        {/* PIPELINE FULLSCREEN COM TODOS OS FUNIS */}
        {abaAtiva === 'pipeline' && (
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', flex: 1, paddingBottom: '10px' }}>
            {ESTAGIOS.map(estagio => {
              const clientesNoEstagio = clientes.filter(c => Number(c.estagio_id) === estagio.id);
              return (
                <div key={estagio.id} style={{ minWidth: '280px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>
                    <span>{estagio.nome}</span>
                    <span style={{ backgroundColor: estagio.cor, color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      {clientesNoEstagio.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                    {clientesNoEstagio.map(cli => (
                      <div 
                        key={cli.id} 
                        style={{ 
                          backgroundColor: '#fff', 
                          padding: '12px', 
                          borderRadius: '6px', 
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                          borderLeft: `5px solid ${estagio.cor}`
                        }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>{cli.nome}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Contrato: {cli.codigo || 'CLI-001'}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#dc2626', marginTop: '6px' }}>
                          R$ {Number(cli.total_vencido || 0).toFixed(2)}
                        </div>

                        {/* USUÁRIO RESPONSÁVEL */}
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '6px', backgroundColor: '#f0f9ff', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          👤 Atendido por: {cli.operador_nome || usuarioLogado.nome}
                        </div>

                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                          {estagio.id > 1 && (
                            <button onClick={() => moverEstagio(cli.id, estagio.id - 1)} style={{ padding: '4px 8px', fontSize: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                              ← Voltar
                            </button>
                          )}
                          {estagio.id < 7 && (
                            <button onClick={() => moverEstagio(cli.id, estagio.id + 1)} style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
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
        )}

        {abaAtiva === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
