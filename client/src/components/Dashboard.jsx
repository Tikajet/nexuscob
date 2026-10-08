import React from 'react';
import { DollarSign, Users, CheckCircle, AlertTriangle, TrendingUp, PieChart, BarChart3 } from 'lucide-react';

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

  const val30 = devedores30.reduce((a,c) => a + Number(c.total_vencido||0), 0);
  const val60 = devedores60.reduce((a,c) => a + Number(c.total_vencido||0), 0);
  const val90 = devedores90.reduce((a,c) => a + Number(c.total_vencido||0), 0);
  const valCanc = cancelados.reduce((a,c) => a + Number(c.total_vencido||0), 0);

  const taxaSucesso = totalClientes > 0 ? ((clientesAcordo.length / totalClientes) * 100).toFixed(1) : '0.0';

  // Função para formatar Moeda BRL (Ex: R$ 16.758,54)
  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Mapeamento dos 7 Estágios para o gráfico visual
  const estagiosNomes = [
    { id: 1, nome: '1º Contato', cor: '#3b82f6' },
    { id: 2, nome: '2ª Tentativa', cor: '#f59e0b' },
    { id: 3, nome: '3ª Tentativa', cor: '#ea580c' },
    { id: 4, nome: 'Contato Realizado', cor: '#0284c7' },
    { id: 5, nome: 'Promessa Pagto', cor: '#8b5cf6' },
    { id: 6, nome: 'Acordo Gerado', cor: '#10b981' },
    { id: 7, nome: 'Rejeitado / Recusa', cor: '#ef4444' }
  ];

  const maxClientesEstagio = Math.max(...estagiosNomes.map(e => clientes.filter(c => Number(c.estagio_id) === e.id).length), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart3 size={22} color="#0284c7" /> Dashboard Geral do Pipeline de Cobrança
      </h2>

      {/* CARDS DE RESUMO SUPERIOR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '8px', color: '#0284c7' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Total em Carteira</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a' }}>{totalClientes} contatos</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Total em Aberto</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626' }}>{formatarMoeda(totalDevedor)}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#d1fae5', borderRadius: '8px', color: '#059669' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>Acordos Gerados</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{formatarMoeda(totalAcordos)}</div>
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

      {/* BLOCO SEGUNDÁRIO DE GRÁFICOS E DISTRIBUIÇÃO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* GRÁFICO DE DISTRIBUIÇÃO POR PERFIL DE ATRASO */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="#0284c7" /> Distribuição por Perfil de Atraso
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Devedores 30 Dias', qtd: devedores30.length, val: val30, cor: '#0284c7' },
              { label: 'Devedores 60 Dias', qtd: devedores60.length, val: val60, cor: '#f59e0b' },
              { label: 'Devedores 90+ Dias', qtd: devedores90.length, val: val90, cor: '#ea580c' },
              { label: 'Clientes Cancelados', qtd: cancelados.length, val: valCanc, cor: '#ef4444' }
            ].map((f, index) => {
              const pct = totalClientes > 0 ? (f.qtd / totalClientes) * 100 : 0;
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#334155' }}>{f.label}:</span>
                    <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{f.qtd} clientes <span style={{ color: '#64748b', fontWeight: 'normal' }}>({formatarMoeda(f.val)})</span></span>
                  </div>
                  {/* BARRA VISUAL */}
                  <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: f.cor, borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STATUS DAS NEGOCIAÇÕES */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#eab308" /> Resumo de Negociações
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#166534' }}>Acordos Fechados</div>
              <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '2px' }}>
                <strong>{clientesAcordo.length} clientes</strong> fecharam proposta gerando <strong>{formatarMoeda(totalAcordos)}</strong>.
              </div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#991b1b' }}>Recusas e Insucessos</div>
              <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '2px' }}>
                <strong>{clientesRecusa.length} clientes</strong> recusaram ou não aceitaram propostas de negociação.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO VISUAL DO FUNIL DE VENDAS (TODOS OS ESTÁGIOS) */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="#0284c7" /> Volume de Clientes por Estágio do Funil
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', alignItems: 'flex-end', minHeight: '160px', padding: '10px 0' }}>
          {estagiosNomes.map(estagio => {
            const qtd = clientes.filter(c => Number(c.estagio_id) === estagio.id).length;
            const alturaPct = maxClientesEstagio > 0 ? (qtd / maxClientesEstagio) * 100 : 0;

            return (
              <div key={estagio.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#0f172a' }}>{qtd}</span>
                <div style={{ width: '100%', maxWidth: '35px', height: `${Math.max(alturaPct, 6)}%`, backgroundColor: estagio.cor, borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease' }}></div>
                <span style={{ fontSize: '0.68rem', color: '#475569', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {estagio.nome}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
