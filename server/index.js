const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Rota de Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Nexus-Cob rodando perfeitamente!' });
});

// Rota auxiliar para renderização de Scripts Dinâmicos
app.post('/api/scripts/renderizar', (req, res) => {
  const { template, cliente } = req.body;

  if (!template || !cliente) {
    return res.status(400).json({ error: 'Template e dados do cliente são obrigatórios.' });
  }

  let textoRenderizado = template
    .replace(/{NOME_CLIENTE}/g, cliente.nome || '')
    .replace(/{VALOR_DEVIDO}/g, cliente.valor_devido ? `R$ ${Number(cliente.valor_devido).toFixed(2)}` : 'R$ 0,00')
    .replace(/{DIAS_ATRASO}/g, cliente.dias_atraso || '0')
    .replace(/{DATA_VENCIMENTO}/g, cliente.data_vencimento || '')
    .replace(/{NUMERO_CONTRATO}/g, cliente.numero_contrato || '')
    .replace(/{NOME_OPERADOR}/g, cliente.nome_operador || '');

  res.json({ script: textoRenderizado });
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Nexus-Cob rodando na porta ${PORT}`);
});
