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
    
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nome VARCHAR(255);`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone VARCHAR(50);`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_vencido NUMERIC(10,2) DEFAULT 0.00;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS valor_acordo NUMERIC(10,2) DEFAULT 0.00;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS parcelas_acordo INT DEFAULT 1;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dias_atraso INT DEFAULT 30;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status_conexao VARCHAR(50) DEFAULT 'Ativo';`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estagio_id INT DEFAULT 1;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS usuario_responsavel_id INT;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

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

// LOGIN E USUÁRIOS
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      return res.json({ sucesso: true, usuario: user });
    }
    const nome = email.split('@')[0].toUpperCase();
    const cargo = (email.includes('admin') || email.includes('pinhaisnet')) ? 'ADMINISTRADOR' : 'OPERADOR';
    const newRes = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, email, senha || '123456', cargo]
    );
    res.json({ sucesso: true, usuario: newRes.rows[0] });
  } catch (err) {
    res.json({ sucesso: true, usuario: { id: 1, nome: email.split('@')[0].toUpperCase(), email, cargo: 'ADMINISTRADOR' } });
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
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens do chat.' });
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
    const { tipo } = req.query;
    let query = 'SELECT * FROM agenda';
    let params = [];
    if (tipo) {
      query += ' WHERE tipo = $1';
      params.push(tipo);
    }
    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
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

app.put('/api/agenda/:id/concluir', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE agenda SET concluido = TRUE WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao concluir agendamento.' });
  }
});

app.delete('/api/agenda/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM agenda WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir agendamento.' });
  }
});

// PÓS-VENDA RESIDENCIAL
app.get('/api/pos-venda', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pos_venda_clientes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pós-venda.' });
  }
});

app.post('/api/pos-venda', async (req, res) => {
  const { codigo, nome, telefone, plano, estagio, observacoes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pos_venda_clientes (codigo, nome, telefone, plano, estagio, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [codigo || `PV-${Math.floor(1000 + Math.random() * 9000)}`, nome, telefone || '', plano || 'Fibra Residencial', estagio || '15_dias', observacoes || '']
    );
    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar pós-venda.' });
  }
});

// CLIENTES, SCRIPTS
app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scripts ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar scripts.' });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nome as operador_nome 
      FROM clientes c 
      LEFT JOIN usuarios u ON c.usuario_responsavel_id = u.id 
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
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
