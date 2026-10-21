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
        cargo VARCHAR(50) DEFAULT 'COBRADOR',
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
      CREATE TABLE IF NOT EXISTS pos_venda_clientes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50),
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(50),
        plano VARCHAR(100),
        data_instalacao DATE DEFAULT CURRENT_DATE,
        estagio_id INT DEFAULT 1,
        satisfacao INT DEFAULT 5,
        vendedor_id INT,
        observacoes TEXT,
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_grupos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_mensagens (
        id SERIAL PRIMARY KEY,
        remetente_id INT,
        remetente_nome VARCHAR(255) NOT NULL,
        destinatario_id INT,
        grupo_id INT,
        mensagem TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ BD MetroCob pronto!');
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
    const cargo = (emailLimpo.includes('admin') || emailLimpo.includes('pinhaisnet')) ? 'ADMINISTRADOR' : 'COBRADOR';
    
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
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { nome, email, cargo, senha } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo',
      [nome, email, senha || '123456', cargo || 'COBRADOR']
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

// RANKINGS E DASHBOARD
app.get('/api/dashboard/ranking-cobranca', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.nome as operador, COUNT(c.id) as total_acordos, COALESCE(SUM(c.valor_acordo), 0) as valor_total
      FROM clientes c
      JOIN usuarios u ON c.usuario_responsavel_id = u.id
      WHERE c.estagio_id = 6
      GROUP BY u.nome
      ORDER BY valor_total DESC
    `);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/dashboard/ranking-vendedores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.nome as vendedor, COUNT(p.id) as total_pos_vendas, AVG(p.satisfacao) as media_satisfacao
      FROM pos_venda_clientes p
      JOIN usuarios u ON p.vendedor_id = u.id
      GROUP BY u.nome
      ORDER BY total_pos_vendas DESC
    `);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

// PÓS-VENDA (ROTA CORRIGIDA)
app.get('/api/pos-venda', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nome as vendedor_nome 
      FROM pos_venda_clientes p 
      LEFT JOIN usuarios u ON p.vendedor_id = u.id 
      ORDER BY p.id DESC
    `);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/pos-venda', async (req, res) => {
  const { codigo, nome, telefone, plano, satisfacao, vendedor_id, observacoes } = req.body;
  
  try {
    const cod = codigo && String(codigo).trim() !== '' ? String(codigo).trim() : `PV-${Math.floor(1000 + Math.random() * 9000)}`;
    const vId = vendedor_id && !isNaN(parseInt(vendedor_id, 10)) ? parseInt(vendedor_id, 10) : null;
    const nota = satisfacao ? parseInt(satisfacao, 10) : 5;

    const result = await pool.query(
      `INSERT INTO pos_venda_clientes (codigo, nome, telefone, plano, satisfacao, vendedor_id, observacoes, estagio_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING *`,
      [cod, String(nome).trim(), telefone || '', plano || 'Fibra 500MB', nota, vId, observacoes || '']
    );

    res.json({ sucesso: true, mensagem: 'Cliente salvo no pós-venda com sucesso!', cliente: result.rows[0] });
  } catch (err) {
    console.error('Erro ao cadastrar Pós-Venda:', err.message);
    res.status(500).json({ error: 'Erro ao cadastrar cliente no pós-venda.' });
  }
});

app.put('/api/pos-venda/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE pos_venda_clientes SET estagio_id = $1 WHERE id = $2 RETURNING *',
      [estagio_id, id]
    );
    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar estágio do pós-venda.' });
  }
});

app.delete('/api/pos-venda/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM pos_venda_clientes WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir pós-venda.' });
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
  const { cliente_nome, data_retorno, observacao, usuario_id, usuario_nome, tipo } = req.body;
  
  if (!cliente_nome || !data_retorno) {
    return res.status(400).json({ error: 'Cliente e Data são obrigatórios.' });
  }

  try {
    const dataStr = String(data_retorno).replace('T', ' ');

    const result = await pool.query(
      'INSERT INTO agenda (cliente_nome, usuario_id, usuario_nome, data_retorno, observacao, tipo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [String(cliente_nome), usuario_id || null, String(usuario_nome || 'Operador'), dataStr, String(observacao || ''), tipo || 'cobranca']
    );
    res.json({ sucesso: true, agendamento: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar agendamento.' });
  }
});

// CHAT
app.get('/api/chat/grupos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chat_grupos ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/chat/mensagens', async (req, res) => {
  const { destinatario_id, grupo_id } = req.query;
  try {
    let query = 'SELECT * FROM chat_mensagens WHERE 1=1';
    let params = [];

    if (grupo_id) {
      query += ' AND grupo_id = $1';
      params.push(grupo_id);
    } else if (destinatario_id) {
      query += ' AND (destinatario_id = $1 OR remetente_id = $1)';
      params.push(destinatario_id);
    }

    query += ' ORDER BY id ASC LIMIT 100';
    const result = await pool.query(query, params);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/chat/mensagens', async (req, res) => {
  const { remetente_id, remetente_nome, destinatario_id, grupo_id, mensagem } = req.body;
  if (!mensagem || !mensagem.trim()) return res.status(400).json({ error: 'Mensagem vazia.' });

  try {
    const result = await pool.query(
      `INSERT INTO chat_mensagens (remetente_id, remetente_nome, destinatario_id, grupo_id, mensagem) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [remetente_id, remetente_nome, destinatario_id || null, grupo_id || null, mensagem.trim()]
    );
    res.json({ sucesso: true, mensagem: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});

// CLIENTES COBRANÇA
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
  const { codigo, nome, total_vencido, dias_atraso } = req.body;
  let atrasoVal = parseInt(dias_atraso, 10) || 30;
  let statusConexao = atrasoVal >= 120 ? 'Cancelado' : 'Ativo';

  try {
    const cod = codigo && String(codigo).trim() !== '' ? String(codigo).trim() : `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    const val = formatarValorExcel(total_vencido);

    const result = await pool.query(
      `INSERT INTO clientes (codigo, nome, total_vencido, dias_atraso, status_conexao, estagio_id, atualizado_em) 
       VALUES ($1, $2, $3, $4, $5, 1, CURRENT_TIMESTAMP) RETURNING *`,
      [cod, String(nome).trim(), val, atrasoVal, statusConexao]
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
    await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cliente.' });
  }
});

// EXCEL IMPORTAÇÃO
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

      const valorLimpo = formatarValorExcel(item[chaveValor]);

      return {
        tempId: index + 1,
        codigo: String(item[chaveId] || `CLI-${index + 1}`).trim(),
        nome: String(item[chaveNome] || 'Cliente sem Nome').trim(),
        total_vencido: valorLimpo,
        dias_atraso: 30
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

      await pool.query(
        `INSERT INTO clientes (codigo, nome, total_vencido, dias_atraso, status_conexao, estagio_id, atualizado_em) 
         VALUES ($1, $2, $3, 30, 'Ativo', 1, CURRENT_TIMESTAMP)`,
        [cod, nom, val]
      );
      inseridos++;
    }

    res.json({ sucesso: true, mensagem: `${inseridos} clientes importados com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar no banco.' });
  }
});

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
