import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { DollarSign, TrendingUp, CheckCircle2, Clock, Users } from 'lucide-react';

const dadosRecuperacaoMensal = [
  { mes: 'Mai', recuperado: 45000, meta: 50000 },
  { mes: 'Jun', recuperado: 58000, meta: 55000 },
  { mes: 'Jul', recuperado: 62000, meta: 60000 },
  { mes: 'Ago', recuperado: 75000, meta: 65000 },
  { mes: 'Set', recuperado: 89000, meta: 70000 },
  { mes: 'Out', recuperado: 94500, meta: 75000 },
];

const dadosStatusAcordos = [
  { name: 'Pagos / Quitados', value: 65, color: '#10b981' },
  { name: 'Em Andamento', value: 25, color: '#3b82f6' },
  { name: 'Quebrados / Atrasados', value: 10, color: '#ef4444' },
];

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* CARDS DE KPI DE TOPO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>TOTAL RECUPERADO (MÊS)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#0f172a', margin: '8px 0' }}>R$ 94.500,00</div>
          <div style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} /> +12.4% em relação ao mês anterior
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>TAXA DE CONVERSÃO / ACORDOS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#0f172a', margin: '8px 0' }}>68.5%</div>
          <div style={{ color: '#3b82f6', fontSize: '0.8rem' }}>Meta mensal: 60.0%</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>ACORDOS EM ANDAMENTO</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#0f172a', margin: '8px 0' }}>R$ 38.200,00</div>
          <div style={{ color: '#d97706', fontSize: '0.8rem' }}>42 clientes em parcelamento</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>TICKET MÉDIO DE ACORDO</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#0f172a', margin: '8px 0' }}>R$ 1.150,00</div>
          <div style={{ color: '#8b5cf6', fontSize: '0.8rem' }}>Média de 3.2 parcelas</div>
        </div>
      </div>

      {/* ÁREA DE GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* GRÁFICO 1: EVOLUÇÃO DE RECUPERAÇÃO MENSAL */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#0f172a' }}>Evolução de Valores Recuperados (R$)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosRecuperacaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="recuperado" fill="#0284c7" name="Valor Recuperado" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: DISTRIBUIÇÃO DE STATUS DOS ACORDOS */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#0f172a' }}>Status dos Acordos (%)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dadosStatusAcordos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {dadosStatusAcordos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
