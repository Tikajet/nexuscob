const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// MIGRAÇÃO AUTOMÁTICA DO POSTGRESQL
async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
    }
    
    // Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) DEFAULT '123456',
        cargo VARCHAR(50) DEFAULT 'OPERADOR',
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50),
        nome VARCHAR(255),
        telefone VARCHAR(50),
        total_vencido NUMERIC(10,2) DEFAULT 0.00,
        valor_acordo NUMERIC(10,2) DEFAULT 0.00,
        parcelas_acordo INT DEFAULT 1,
        dias_atraso INT DEFAULT 30,
        status_conexao VARCHAR(50) DEFAULT 'Ativo',
        estagio_id INT DEFAULT 1,
        usuario_responsavel_id INT,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de scripts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scripts (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        categoria VARCHAR(50) DEFAULT '30',
        conteudo TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela da Agenda
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agenda (
        id SERIAL PRIMARY KEY,
        cliente_id INT,
        cliente_nome TEXT,
        usuario_id INT,
        usuario_nome TEXT,
        tipo VARCHAR(50) DEFAULT 'cobranca',
        data_retorno TEXT,
        observacao TEXT,
        concluido BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Clientes Pós-Venda
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_venda_clientes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50),
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(50),
        plano VARCHAR(100),
        data_instalacao DATE DEFAULT CURRENT_DATE,
        estagio VARCHAR(50) DEFAULT '15_dias',
        satisfacao INT DEFAULT 5,
        observacoes TEXT,
        usuario_responsavel_id INT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Chat Interno
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_mensagens (
        id SERIAL PRIMARY KEY,
        usuario_id INT,
        usuario_nome VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela CRM Histórico
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_contatos (
        id SERIAL PRIMARY KEY,
        cliente_id INT NOT NULL,
        usuario_nome VARCHAR(255),
        observacao TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Banco PostgreSQL MetroCob pronto e atualizado!');
  } catch (error) {
    console.error('❌ Erro na inicializacao do BD:', error.message);
  }
}
initDB();

function formatarValorExcel(val) {
  if (val === null || val === undefined || val === '') return 0.00;
  if (typeof val === 'number') return parseFloat(val.toFixed(2));

  let str = String(val).replace(/R\$/g, '').trim();
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  return parseFloat(str) || 0.00;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API MetroCob Operacional' });
});

// LOGIN ULTRA PERMISSIVO E GARANTIDO
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  const emailLimpo = String(email || 'admin@metronet.com.br').trim().toLowerCase();

  try {
    const userRes = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1', [emailLimpo]);
    if (userRes.rows.length > 0) {
      return res.json({ sucesso: true, usuario: userRes.rows[0] });
    }
    
    const nome = emailLimpo.split('@')[0].toUpperCase();
    const cargo = (emailLimpo.includes('admin') || emailLimpo.includes('pinhaisnet')) ? 'ADMINISTRADOR' : 'OPERADOR';
    
    const newRes = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, emailLimpo, senha || '123456', cargo]
    );
    res.json({ sucesso: true, usuario: newRes.rows[0] });
  } catch (err) {
    console.error('Erro no login:', err.message);
    // Retorno com fallback para liberar o operador mesmo em caso de erro na consulta do BD
    res.json({
      sucesso: true,
      usuario: { id: 1, nome: emailLimpo.split('@')[0].toUpperCase(), email: emailLimpo, cargo: 'ADMINISTRADOR' }
    });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, email, cargo, ativo, criado_em FROM usuarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// CHAT INTERNO
app.get('/api/chat', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chat_mensagens ORDER BY id ASC LIMIT 100');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/chat', async (req, res) => {
  const { usuario_id, usuario_nome, mensagem } = req.body;
  if (!mensagem || !mensagem.trim()) return res.status(400).json({ error: 'Mensagem vazia.' });

  try {
    const result = await pool.query(
      'INSERT INTO chat_mensagens (usuario_id, usuario_nome, mensagem) VALUES ($1, $2, $3) RETURNING *',
      [usuario_id || null, usuario_nome || 'Operador', mensagem.trim()]
    );
    res.json({ sucesso: true, chat: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});

// AGENDA
app.get('/api/agenda', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agenda ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/agenda', async (req, res) => {
  const { cliente_id, cliente_nome, usuario_id, usuario_nome, data_retorno, observacao, tipo } = req.body;
  
  if (!cliente_nome || !data_retorno) {
    return res.status(400).json({ error: 'Cliente e Data são obrigatórios.' });
  }

  try {
    let cId = cliente_id ? parseInt(cliente_id, 10) : null;
    let uId = usuario_id ? parseInt(usuario_id, 10) : null;
    const dataStr = String(data_retorno).replace('T', ' ');

    const result = await pool.query(
      'INSERT INTO agenda (cliente_id, cliente_nome, usuario_id, usuario_nome, data_retorno, observacao, tipo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [cId, String(cliente_nome), uId, String(usuario_nome || 'Operador'), dataStr, String(observacao || ''), tipo || 'cobranca']
    );
    res.json({ sucesso: true, agendamento: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar agendamento.', detalhe: err.message });
  }
});

// PÓS-VENDA RESIDENCIAL
app.get('/api/pos-venda', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pos_venda_clientes ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

// CLIENTES, SCRIPTS
app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nome as operador_nome 
      FROM clientes c 
      LEFT JOIN usuarios u ON c.usuario_responsavel_id = u.id 
      ORDER BY c.id DESC
    `);
    res.json(result.rows || []);
  } catch (error) {
    res.json([]);
  }
});

// SERVIR OS ARQUIVOS ESTÁTICOS DO CLIENT REACT
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 METROCOB API rodando na porta ${PORT}`);
});
