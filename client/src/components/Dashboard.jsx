import React from 'react';
import { DollarSign, Users, CheckCircle, AlertTriangle, TrendingUp, PieChart } from 'lucide-react';

export default function Dashboard({ clientes = [] }) {
  const totalClientes = clientes.length;

  const totalDevedor = clientes.reduce((acc, c) => acc + Number(c.total_vencido || 0), 0);

  // Acordos Gerados (Estágio ID 6)
  const clientesAcordo = clientes.filter(c => Number(c.estagio_id) === 6);
  const totalAcordos = clientesAcordo.reduce((acc, c) => acc + Number(c.total_vencido || 0), 0);

  // Clientes com Rejeição / Recusa (Estágio ID 7)
  const clientesRecusa = clientes.filter(c => Number(c.estagio_id) === 7);

  // Distribuição por dias de atraso
  const devedores30 = clientes.filter(c => Number(c.dias_atraso || 0) <= 30 && String(c.status_conexao).toLowerCase() !== 'cancelado');
  const devedores60 = clientes.filter(c => Number(c.dias_atraso || 0) > 30 && Number(c.dias_atraso || 0) <= 60 && String(c.status_conexao).toLowerCase() !== 'cancelado');
  const devedores90 = clientes.filter(c => Number(c.dias_atraso || 0) > 60 && String(c.status_conexao).toLowerCase() !== 'cancelado');
  const cancelados = clientes.filter(c => String(c.status_conexao).toLowerCase() === 'cancelado');

  const taxaSucesso = totalClientes > 0 ? ((clientesAcordo.length / totalClientes) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📊 Dashboard Geral do Pipeline de Cobrança</h2>

      {/* CARDS DE RESUMO SUPERIOR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '8px', color: '#0284c7' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Total em Carteira</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a' }}>{totalClientes}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Total em Aberto</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#dc2626' }}>R$ {totalDevedor.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#d1fae5', borderRadius: '8px', color: '#059669' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Acordos Recorrentes</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>R$ {totalAcordos.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#d97706' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Taxa de Eficiência</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#d97706' }}>{taxaSucesso}%</div>
          </div>
        </div>
      </div>

      {/* BLOCO SEGUNDÁRIO DE DISTRIBUIÇÃO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* FAIXAS DE ATRASO */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="#0284c7" /> Distribuição por Perfil de Atraso
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Devedores 30 Dias:</span>
              <strong>{devedores30.length} clientes (R$ {devedores30.reduce((a,c) => a + Number(c.total_vencido||0), 0).toFixed(2)})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Devedores 60 Dias:</span>
              <strong>{devedores60.length} clientes (R$ {devedores60.reduce((a,c) => a + Number(c.total_vencido||0), 0).toFixed(2)})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Devedores 90+ Dias:</span>
              <strong>{devedores90.length} clientes (R$ {devedores90.reduce((a,c) => a + Number(c.total_vencido||0), 0).toFixed(2)})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ef4444' }}>
              <span>Clientes Cancelados:</span>
              <strong>{cancelados.length} clientes (R$ {cancelados.reduce((a,c) => a + Number(c.total_vencido||0), 0).toFixed(2)})</strong>
            </div>
          </div>
        </div>

        {/* STATUS DAS RECUSAS E ACORDOS */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#eab308" /> Status de Negociações
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#166534' }}>Acordos Fechados</div>
              <div style={{ fontSize: '0.8rem', color: '#15803d' }}>{clientesAcordo.length} clientes fecharam proposta de acordo.</div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#991b1b' }}>Recusas e Insucessos</div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{clientesRecusa.length} clientes recusaram ou não aceitaram propostas.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
