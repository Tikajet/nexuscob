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
      CREATE TABLE IF NOT EXISTS contatos_ativos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendente',
        origem VARCHAR(50) DEFAULT 'Cobranca',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lista_upgrade (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50),
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(50),
        plano_atual VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pendente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id SERIAL PRIMARY KEY,
        cliente_codigo VARCHAR(50),
        cliente_nome VARCHAR(255) NOT NULL,
        problema TEXT,
        tipo_ocorrencia VARCHAR(100),
        estagio_id INT DEFAULT 1,
        nota_resolucao VARCHAR(50),
        feedback_cliente TEXT,
        tecnico_responsavel VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scripts (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'cobranca',
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_mensagens (
        id SERIAL PRIMARY KEY,
        remetente_id INT,
        remetente_nome VARCHAR(255) NOT NULL,
        destinatario_id INT,
        grupo_id INT,
        mensagem TEXT NOT NULL,
        setor VARCHAR(50) DEFAULT 'cobranca',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Banco de dados MetroCob 100% Sincronizado!');
  } catch (error) {
    console.error('❌ Erro no banco:', error.message);
  }
}
initDB();

function formatarValor(val) {
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
  const { nome, email, cargo, senha } = req.body;
  try {
    let query = 'UPDATE usuarios SET nome = $1, email = $2, cargo = $3';
    let params = [nome, email, cargo];

    if (senha && senha.trim() !== '') {
      query += ', senha_hash = $4 WHERE id = $5 RETURNING id, nome, email, cargo';
      params.push(senha.trim(), id);
    } else {
      query += ' WHERE id = $4 RETURNING id, nome, email, cargo';
      params.push(id);
    }

    const result = await pool.query(query, params);
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
  const { codigo, nome, telefone, total_vencido, dias_atraso } = req.body;
  let atrasoVal = parseInt(dias_atraso, 10) || 30;
  let statusConexao = atrasoVal >= 120 ? 'Cancelado' : 'Ativo';

  try {
    const cod = codigo && String(codigo).trim() !== '' ? String(codigo).trim() : `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    const val = formatarValor(total_vencido);

    const result = await pool.query(
      `INSERT INTO clientes (codigo, nome, telefone, total_vencido, dias_atraso, status_conexao, estagio_id) 
       VALUES ($1, $2, $3, $4, $5, $6, 1) RETURNING *`,
      [cod, String(nome).trim(), String(telefone || ''), val, atrasoVal, statusConexao]
    );

    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo, nome, telefone, total_vencido, dias_atraso } = req.body;
  try {
    const val = formatarValor(total_vencido);
    const result = await pool.query(
      `UPDATE clientes SET codigo = $1, nome = $2, telefone = $3, total_vencido = $4, dias_atraso = $5 WHERE id = $6 RETURNING *`,
      [codigo, nome, telefone, val, parseInt(dias_atraso, 10) || 30, id]
    );
    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar cliente.' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cliente.' });
  }
});

app.put('/api/clientes/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id, usuario_nome, usuario_id, valor_acordo, parcelas_acordo } = req.body;
  try {
    let uId = usuario_id ? parseInt(usuario_id, 10) : null;
    const vAcordo = valor_acordo !== undefined ? formatarValor(valor_acordo) : null;
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
    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar estágio.' });
  }
});

// PÓS-VENDA
app.get('/api/pos-venda', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COALESCE(u.nome, 'Vendedor Geral') as vendedor_nome 
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
    let vId = vendedor_id && !isNaN(parseInt(vendedor_id, 10)) ? parseInt(vendedor_id, 10) : null;

    const result = await pool.query(
      `INSERT INTO pos_venda_clientes (codigo, nome, telefone, plano, satisfacao, vendedor_id, observacoes, estagio_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING *`,
      [cod, String(nome || 'Cliente Pós-Venda').trim(), String(telefone || ''), String(plano || 'Fibra 500MB'), parseInt(satisfacao, 10) || 5, vId, String(observacoes || '')]
    );

    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pos-venda/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id } = req.body;
  try {
    const result = await pool.query('UPDATE pos_venda_clientes SET estagio_id = $1 WHERE id = $2 RETURNING *', [estagio_id, id]);
    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar pós-venda.' });
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

// CONTATOS ATIVOS & UPGRADE
app.get('/api/vendas/contatos-ativos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contatos_ativos ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/vendas/contatos-ativos', async (req, res) => {
  const { nome, telefone, origem } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contatos_ativos (nome, telefone, origem) VALUES ($1, $2, $3) RETURNING *',
      [nome, telefone, origem || 'Geral']
    );
    res.json({ sucesso: true, contato: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar contato.' });
  }
});

app.put('/api/vendas/contatos-ativos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE contatos_ativos SET nome = $1, telefone = $2 WHERE id = $3 RETURNING *',
      [nome, telefone, id]
    );
    res.json({ sucesso: true, contato: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar contato.' });
  }
});

app.delete('/api/vendas/contatos-ativos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contatos_ativos WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir contato.' });
  }
});

app.get('/api/vendas/upgrade', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lista_upgrade ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

// ORDENS DE SERVIÇO (QUALIDADE O.S.)
app.get('/api/os', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ordens_servico ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/os', async (req, res) => {
  const { cliente_codigo, cliente_nome, problema, tipo_ocorrencia, tecnico_responsavel } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO ordens_servico (cliente_codigo, cliente_nome, problema, tipo_ocorrencia, tecnico_responsavel, estagio_id)
       VALUES ($1, $2, $3, $4, $5, 1) RETURNING *`,
      [cliente_codigo || '', cliente_nome, problema, tipo_ocorrencia || 'Suporte Técnico', tecnico_responsavel || 'Técnico Geral']
    );
    res.json({ sucesso: true, os: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar O.S.' });
  }
});

app.put('/api/os/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id } = req.body;
  try {
    const result = await pool.query('UPDATE ordens_servico SET estagio_id = $1 WHERE id = $2 RETURNING *', [estagio_id, id]);
    res.json({ sucesso: true, os: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar O.S.' });
  }
});

// AGENDA
app.get('/api/agenda', async (req, res) => {
  const { tipo } = req.query;
  try {
    let q = 'SELECT * FROM agenda';
    let p = [];
    if (tipo) {
      q += ' WHERE tipo = $1';
      p.push(tipo);
    }
    q += ' ORDER BY id DESC';
    const result = await pool.query(q, p);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/agenda', async (req, res) => {
  const { cliente_nome, data_retorno, observacao, usuario_id, usuario_nome, tipo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO agenda (cliente_nome, usuario_id, usuario_nome, data_retorno, observacao, tipo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [cliente_nome, usuario_id || null, usuario_nome || 'Operador', data_retorno, observacao || '', tipo || 'cobranca']
    );
    res.json({ sucesso: true, agendamento: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao agendar.' });
  }
});

// SCRIPTS
app.get('/api/scripts', async (req, res) => {
  const { tipo } = req.query;
  try {
    let q = 'SELECT * FROM scripts';
    let p = [];
    if (tipo) {
      q += ' WHERE tipo = $1';
      p.push(tipo);
    }
    q += ' ORDER BY id DESC';
    const result = await pool.query(q, p);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/scripts', async (req, res) => {
  const { titulo, tipo, conteudo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO scripts (titulo, tipo, conteudo) VALUES ($1, $2, $3) RETURNING *',
      [titulo, tipo || 'cobranca', conteudo]
    );
    res.json({ sucesso: true, script: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar script.' });
  }
});

// DASHBOARD
app.get('/api/dashboard/ranking-cobranca', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.nome as operador, COUNT(c.id) as total_acordos, COALESCE(SUM(c.valor_acordo), 0) as valor_total
      FROM clientes c
      JOIN usuarios u ON c.usuario_responsavel_id = u.id
      WHERE c.estagio_id IN (6, 7)
      GROUP BY u.nome
      ORDER BY valor_total DESC
    `);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

// IMPORTAÇÃO DE LISTAS E PRÉVIA
app.post('/api/admin/previa-planilha', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const dados = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    const previa = dados.map((item, index) => {
      const keys = Object.keys(item);
      const chaveId = keys.find(k => k.trim().toUpperCase() === 'ID' || k.trim().toUpperCase() === 'CODIGO') || keys[0];
      const chaveNome = keys.find(k => k.trim().toUpperCase() === 'NOME' || k.trim().toUpperCase() === 'CLIENTE') || keys[1];
      const chaveTel = keys.find(k => k.trim().toUpperCase().includes('TEL') || k.trim().toUpperCase().includes('FONE')) || keys[2];
      const chaveValor = keys.find(k => k.trim().toUpperCase().includes('VALOR') || k.trim().toUpperCase().includes('DEVEDOR'));
      const chavePlano = keys.find(k => k.trim().toUpperCase().includes('PLANO'));

      return {
        tempId: index + 1,
        codigo: String(item[chaveId] || `COD-${index + 1}`).trim(),
        nome: String(item[chaveNome] || 'Nome não informado').trim(),
        telefone: String(item[chaveTel] || '').trim(),
        total_vencido: chaveValor ? formatarValor(item[chaveValor]) : 0,
        plano_atual: chavePlano ? String(item[chavePlano]).trim() : 'Fibra 300MB'
      };
    });

    res.json({ sucesso: true, total: previa.length, dados: previa });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar planilha.' });
  }
});

app.post('/api/admin/confirmar-importacao', async (req, res) => {
  const { tipo, categoria_cobranca, lista } = req.body;
  try {
    let inseridos = 0;
    const diasAtraso = categoria_cobranca ? parseInt(categoria_cobranca, 10) : 30;
    const statusConexao = diasAtraso >= 120 ? 'Cancelado' : 'Ativo';

    for (const item of lista) {
      if (tipo === 'cobranca') {
        await pool.query(
          `INSERT INTO clientes (codigo, nome, telefone, total_vencido, dias_atraso, status_conexao, estagio_id) 
           VALUES ($1, $2, $3, $4, $5, $6, 1)`,
          [item.codigo, item.nome, item.telefone, formatarValor(item.total_vencido), diasAtraso, statusConexao]
        );
      } else if (tipo === 'vendas_ativas') {
        await pool.query(`INSERT INTO contatos_ativos (nome, telefone, origem) VALUES ($1, $2, $3)`, [item.nome, item.telefone, 'Importado Vendas']);
      } else if (tipo === 'upgrade') {
        await pool.query(`INSERT INTO lista_upgrade (codigo, nome, telefone, plano_atual) VALUES ($1, $2, $3, $4)`, [item.codigo, item.nome, item.telefone, item.plano_atual || 'Fibra 300MB']);
      }
      inseridos++;
    }

    res.json({ sucesso: true, mensagem: `${inseridos} registros importados!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar importação.' });
  }
});

// CHAT
app.get('/api/chat/mensagens', async (req, res) => {
  const { setor } = req.query;
  try {
    const result = await pool.query('SELECT * FROM chat_mensagens WHERE setor = $1 ORDER BY id ASC LIMIT 100', [setor || 'cobranca']);
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/chat/mensagens', async (req, res) => {
  const { remetente_id, remetente_nome, mensagem, setor } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO chat_mensagens (remetente_id, remetente_nome, mensagem, setor) VALUES ($1, $2, $3, $4) RETURNING *`,
      [remetente_id, remetente_nome, mensagem, setor || 'cobranca']
    );
    res.json({ sucesso: true, mensagem: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro no chat.' });
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
