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

// MIGRAÇÃO E ESTRUTURA DO POSTGRESQL
async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
    }
    
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scripts (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        categoria VARCHAR(50) DEFAULT '30',
        conteudo TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
    await pool.query(`ALTER TABLE agenda ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'cobranca';`).catch(() => {});

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_mensagens (
        id SERIAL PRIMARY KEY,
        usuario_id INT,
        usuario_nome VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_contatos (
        id SERIAL PRIMARY KEY,
        cliente_id INT NOT NULL,
        usuario_nome VARCHAR(255),
        observacao TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Banco PostgreSQL MetroCob pronto e preservado!');
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

app.post('/api/usuarios', async (req, res) => {
  const { nome, email, cargo, senha } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo',
      [nome, email, senha || '123456', cargo || 'OPERADOR']
    );
    res.json({ sucesso: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, cargo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE usuarios SET nome = $1, email = $2, cargo = $3 WHERE id = $4 RETURNING id, nome, email, cargo',
      [nome, email, cargo, id]
    );
    res.json({ sucesso: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar usuário.' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
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
    const { tipo } = req.query;
    let query = 'SELECT * FROM agenda';
    let params = [];
    if (tipo) {
      query += ' WHERE tipo = $1';
      params.push(tipo);
    }
    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
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
    res.status(500).json({ error: 'Erro ao salvar agendamento.' });
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
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
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

// CRM HISTÓRICO
app.get('/api/clientes/:id/historico', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM historico_contatos WHERE cliente_id = $1 ORDER BY id DESC', [id]);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/clientes/:id/historico', async (req, res) => {
  const { id } = req.params;
  const { usuario_nome, observacao } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO historico_contatos (cliente_id, usuario_nome, observacao) VALUES ($1, $2, $3) RETURNING *',
      [id, usuario_nome || 'OPERADOR', observacao]
    );
    res.json({ sucesso: true, historico: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar histórico.' });
  }
});

// SCRIPTS
app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scripts ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/scripts', async (req, res) => {
  const { titulo, categoria, conteudo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO scripts (titulo, categoria, conteudo) VALUES ($1, $2, $3) RETURNING *',
      [titulo, categoria || '30', conteudo]
    );
    res.json({ sucesso: true, script: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar script.' });
  }
});

app.delete('/api/scripts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM scripts WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir script.' });
  }
});

// CLIENTES (FUNIL KANBAN)
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

app.post('/api/clientes/manual', async (req, res) => {
  const { codigo, nome, telefone, total_vencido, opcao_atraso } = req.body;
  let diasAtraso = 30;
  let statusConexao = 'Ativo';

  if (opcao_atraso === '30') diasAtraso = 30;
  else if (opcao_atraso === '60') diasAtraso = 60;
  else if (opcao_atraso === '90') diasAtraso = 90;
  else if (opcao_atraso === 'CANCELADOS') {
    diasAtraso = 120;
    statusConexao = 'Cancelado';
  }

  try {
    const cod = codigo && String(codigo).trim() !== '' ? String(codigo).trim() : `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    const val = formatarValorExcel(total_vencido);

    const result = await pool.query(
      `INSERT INTO clientes (codigo, nome, telefone, total_vencido, dias_atraso, status_conexao, estagio_id, atualizado_em) 
       VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP) RETURNING *`,
      [cod, String(nome).trim(), telefone || '', val, diasAtraso, statusConexao]
    );

    res.json({ sucesso: true, mensagem: 'Cliente cadastrado com sucesso!', cliente: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
});

app.put('/api/clientes/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id, usuario_nome, usuario_id, valor_acordo, parcelas_acordo } = req.body;
  try {
    let uId = usuario_id ? parseInt(usuario_id, 10) : null;
    const vAcordo = valor_acordo !== undefined ? formatarValorExcel(valor_acordo) : null;
    const pAcordo = parcelas_acordo !== undefined ? parseInt(parcelas_acordo, 10) : null;

    const result = await pool.query(
      `UPDATE clientes 
       SET estagio_id = $1, 
           usuario_responsavel_id = COALESCE($2, usuario_responsavel_id), 
           valor_acordo = COALESCE($3, valor_acordo),
           parcelas_acordo = COALESCE($4, parcelas_acordo),
           atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
      [estagio_id, uId, vAcordo, pAcordo, id]
    );
    res.json({ sucesso: true, mensagem: `Cliente movido por ${usuario_nome}`, cliente: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar estágio.' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM agenda WHERE cliente_id = $1', [id]);
    await pool.query('DELETE FROM historico_contatos WHERE cliente_id = $1', [id]);
    await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cliente.' });
  }
});

app.post('/api/clientes/excluir-massa', async (req, res) => {
  const { ids } = req.body;
  try {
    await pool.query('DELETE FROM agenda WHERE cliente_id = ANY($1::int[])', [ids]);
    await pool.query('DELETE FROM historico_contatos WHERE cliente_id = ANY($1::int[])', [ids]);
    await pool.query('DELETE FROM clientes WHERE id = ANY($1::int[])', [ids]);
    res.json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir clientes em massa.' });
  }
});

// IMPORTAÇÃO EXCEL
app.post('/api/clientes/previa', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const dadosExcel = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    const listaPrevia = dadosExcel.map((item, index) => {
      const keys = Object.keys(item);
      const chaveId = keys.find(k => k.trim().toUpperCase() === 'ID' || k.trim().toUpperCase() === 'CODIGO') || keys[0];
      const chaveNome = keys.find(k => k.trim().toUpperCase() === 'NOME' || k.trim().toUpperCase() === 'CLIENTE') || keys[1];
      const chaveValor = keys.find(k => k.trim().toUpperCase().includes('VALOR') || k.trim().toUpperCase().includes('DEVEDOR')) || keys[2];
      const chaveTel = keys.find(k => k.trim().toUpperCase().includes('TEL') || k.trim().toUpperCase().includes('CEL')) || '';

      const valorLimpo = formatarValorExcel(item[chaveValor]);

      return {
        tempId: index + 1,
        codigo: String(item[chaveId] || `CLI-${index + 1}`).trim(),
        nome: String(item[chaveNome] || 'Cliente sem Nome').trim(),
        telefone: chaveTel ? String(item[chaveTel]).trim() : '',
        total_vencido: valorLimpo,
        opcao_atraso: '30',
        selecionado: true
      };
    });

    res.json({ sucesso: true, total: listaPrevia.length, dados: listaPrevia });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar prévia.' });
  }
});

app.post('/api/clientes/confirmar-importacao', async (req, res) => {
  const { clientes } = req.body;
  try {
    let inseridos = 0;
    for (const cli of clientes) {
      const cod = String(cli.codigo || `CLI-${Math.floor(1000 + Math.random() * 9000)}`);
      const val = formatarValorExcel(cli.total_vencido);
      const nom = String(cli.nome || 'Cliente sem nome');
      const tel = String(cli.telefone || '');

      let diasAtraso = 30;
      let statusConexao = 'Ativo';

      if (cli.opcao_atraso === '30') diasAtraso = 30;
      else if (cli.opcao_atraso === '60') diasAtraso = 60;
      else if (cli.opcao_atraso === '90') diasAtraso = 90;
      else if (cli.opcao_atraso === 'CANCELADOS') {
        diasAtraso = 120;
        statusConexao = 'Cancelado';
      }

      await pool.query(
        `INSERT INTO clientes (codigo, nome, telefone, total_vencido, dias_atraso, status_conexao, estagio_id, atualizado_em) 
         VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP)`,
        [cod, nom, tel, val, diasAtraso, statusConexao]
      );
      inseridos++;
    }

    res.json({ sucesso: true, mensagem: `${inseridos} clientes importados para o Funil com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar no banco.' });
  }
});

// SERVIR ARQUIVOS DO CLIENT REACT
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
