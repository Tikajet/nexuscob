import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, Users, DollarSign, RefreshCw, Phone, Handshake, Calendar, 
  FileCheck, CreditCard, MessageSquare, CheckSquare, BarChart3, 
  Briefcase, Upload, Settings, ShieldCheck, Zap, Copy, AlertTriangle, Send
} from 'lucide-react';
import Dashboard from './components/Dashboard';

const API_URL = 'https://nexuscob-api.onrender.com';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [clientes, setClientes] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Cliente Ativo de Exemplo (Provedor de Internet)
  const clienteAtivo = {
    codigo: 'CLI-1092',
    nome: 'Carlos Eduardo Santos',
    documento: '048.291.829-10',
    telefone: '(41) 99821-4410',
    whatsapp: '5541998214410',
    email: 'carlos.santos@email.com',
    plano: 'Fibra Óptica 500 Mega',
    velocidade: '500Mbps',
    valor_mensal: 119.90,
    status_conexao: 'Bloqueio Parcial',
    total_vencido: 239.80,
    faturas_abertas: 2,
    dias_atraso: 34,
    vencimento: '10/09/2026',
    prioridade: 'ALTA',
    cobrador: 'Juliana'
  };

  const templateScript = "Olá {{nome_cliente}}! Aqui é {{cobrador}} do setor de negociação do seu Provedor de Internet.\n\nIdentificamos uma pendência de {{valor_divida}} referente ao seu plano {{plano}} (vencido em {{vencimento}} com {{dias_atraso}} dias de atraso).\n\nConseguimos uma condição especial com isenção de juros para liberação imediata da sua conexão via PIX. Podemos formalizar?";

  const renderizarScript = (template, cliente) => {
    return template
      .replace(/{{nome_cliente}}/g, cliente.nome)
      .replace(/{{cobrador}}/g, cliente.cobrador)
      .replace(/{{empresa}}/g, 'Provedor Nexus Fiber')
      .replace(/{{valor_divida}}/g, `R$ ${cliente.total_vencido.toFixed(2)}`)
      .replace(/{{plano}}/g, cliente.plano)
      .replace(/{{dias_atraso}}/g, cliente.dias_atraso)
      .replace(/{{vencimento}}/g, cliente.vencimento);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f1f5f9', margin: 0 }}>
      {/* SIDEBAR NAVEGAÇÃO CORPORATIVA */}
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* LOGO */}
        <div style={{ padding: '0 10px 15px 10px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8' }}>
            <Zap size={26} color="#38bdf8" />
            <span>NEXUS COB</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', fontWeight: '500' }}>
            Gestão Inteligente de Cobranças
          </div>
        </div>

        {/* MENU LATERAL */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'clientes', label: 'Clientes / Ficha', icon: Users },
            { id: 'cobrancas', label: 'Cobranças', icon: DollarSign },
            { id: 'pipeline', label: 'Pipeline / Funil', icon: RefreshCw },
            { id: 'contatos', label: 'Central de Contatos', icon: Phone },
            { id: 'negociacoes', label: 'Negociações', icon: Handshake },
            { id: 'promessas', label: 'Promessas', icon: Calendar },
            { id: 'acordos', label: 'Acordos', icon: FileCheck },
            { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
            { id: 'scripts', label: 'Scripts', icon: MessageSquare },
            { id: 'tarefas', label: 'Tarefas / Agenda', icon: CheckSquare },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
            { id: 'equipe', label: 'Equipe / Performance', icon: Briefcase },
            { id: 'importar', label: 'Importar Excel', icon: Upload },
            { id: 'configuracoes', label: 'Configurações', icon: Settings },
            { id: 'auditoria', label: 'Auditoria', icon: ShieldCheck },
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
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: ativo ? '#0284c7' : 'transparent',
                  color: ativo ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                  fontWeight: ativo ? 'bold' : 'normal',
                  transition: '0.2s'
                }}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, padding: '20px 25px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {/* CABEÇALHO */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '14px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>NEXUS COB — Provedor de Internet</h1>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Plataforma Integrada de Recuperação de Inadimplência</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.8rem', fontWeight: 'bold' }}>
              ● Conexão API On-line
            </span>
            <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 'bold' }}>
              Operador: <span style={{ color: '#0284c7' }}>Juliana</span>
            </div>
          </div>
        </header>

        {/* MÓDULO 1: DASHBOARD */}
        {abaAtiva === 'dashboard' && <Dashboard />}

        {/* MÓDULO 2: FICHA DO CLIENTE E ATENDIMENTO COMPLETO */}
        {abaAtiva === 'clientes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
            {/* FICHA TÉCNICA E FINANCEIRA DO CLIENTE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* ALERTA DE PRÓXIMA AÇÃO RECOMENDADA */}
              <div style={{ backgroundColor: '#fff7ed', borderLeft: '5px solid #f97316', padding: '15px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#c2410c', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={18} /> PRÓXIMA AÇÃO RECOMENDADA PELO SISTEMA
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#9a3412', marginTop: '4px' }}>
                    Cliente possui 34 dias de atraso e sinal suspenso parcialmente. Enviar cobrança preventiva via WhatsApp.
                  </div>
                </div>
                <button style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Executar Ação
                </button>
              </div>

              {/* DADOS DO CLIENTE */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0f172a' }}>{clienteAtivo.nome}</h3>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Código:</strong> {clienteAtivo.codigo}</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>CPF/CNPJ:</strong> {clienteAtivo.documento}</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>WhatsApp:</strong> {clienteAtivo.telefone}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0284c7' }}>Contrato Provedor</h4>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Plano:</strong> {clienteAtivo.plano}</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Status Conexão:</strong> <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{clienteAtivo.status_conexao}</span></p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Dívida Total:</strong> <span style={{ color: '#dc2626', fontWeight: 'bold' }}>R$ {clienteAtivo.total_vencido.toFixed(2)}</span></p>
                </div>
              </div>
            </div>

            {/* PAINEL DE SCRIPT INTELIGENTE */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#0284c7" />
                Script Recomendado
              </h3>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {renderizarScript(templateScript, clienteAtivo)}
              </div>

              <button 
                onClick={() => navigator.clipboard.writeText(renderizarScript(templateScript, clienteAtivo))}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                <Send size={16} /> Copiar para WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* MÓDULO IMPORTAÇÃO EXCEL */}
        {abaAtiva === 'importar' && (
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <Upload size={48} color="#0284c7" style={{ marginBottom: '15px' }} />
            <h2>Nexus Cob → Importar Carteira de Inadimplência</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Envie arquivos `.xlsx`, `.xls` ou `.csv` extraídos do seu sistema SGP/ERP.</p>
            <input type="file" accept=".xlsx, .xls, .csv" style={{ marginTop: '15px' }} />
          </div>
        )}
      </main>
    </div>
  );
}
