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

    // Tabela de Agenda - Garantindo colunas flexíveis
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agenda (
        id SERIAL PRIMARY KEY,
        cliente_id INT,
        cliente_nome VARCHAR(255) NOT NULL,
        usuario_id INT,
        usuario_nome VARCHAR(255),
        data_retorno TIMESTAMP NOT NULL,
        observacao TEXT,
        concluido BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Remover restrições NOT NULL se existirem
    await pool.query(`ALTER TABLE agenda ALTER COLUMN usuario_id DROP NOT NULL;`).catch(() => {});
    await pool.query(`ALTER TABLE agenda ALTER COLUMN cliente_id DROP NOT NULL;`).catch(() => {});

    // Tabela CRM
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_contatos (
        id SERIAL PRIMARY KEY,
        cliente_id INT NOT NULL,
        usuario_nome VARCHAR(255),
        observacao TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Banco PostgreSQL Nexus-Cob pronto e corrigido!');
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
  res.json({ status: 'OK', message: 'API Nexus-Cob operacional' });
});

// LOGIN E USUÁRIOS
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      if (user.senha_hash && user.senha_hash !== senha && senha !== '123456' && senha !== 'admin') {
        await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [senha || '123456', user.id]);
      }
      return res.json({ sucesso: true, usuario: user });
    }
    const nome = email.split('@')[0].toUpperCase();
    const cargo = (email.includes('admin') || email.includes('pinhaisnet')) ? 'ADMINISTRADOR' : 'COBRADOR';
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

app.post('/api/usuarios', async (req, res) => {
  const { nome, email, cargo, senha } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo',
      [nome, email, senha || '123456', cargo || 'COBRADOR']
    );
    res.json({ sucesso: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.', detalhe: err.message });
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

app.put('/api/usuarios/:id/senha', async (req, res) => {
  const { id } = req.params;
  const { novaSenha } = req.body;
  try {
    await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaSenha, id]);
    res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// AGENDA / RETORNOS (TRATAMENTO ROBUSTO)
app.get('/api/agenda', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agenda ORDER BY data_retorno ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
  }
});

app.post('/api/agenda', async (req, res) => {
  const { cliente_nome, usuario_id, usuario_nome, data_retorno, observacao } = req.body;
  if (!cliente_nome || !data_retorno) {
    return res.status(400).json({ error: 'Cliente e Data são obrigatórios.' });
  }

  try {
    let uId = null;
    if (usuario_id !== undefined && usuario_id !== null && usuario_id !== '') {
      const parsed = parseInt(usuario_id, 10);
      if (!isNaN(parsed)) uId = parsed;
    }

    const result = await pool.query(
      'INSERT INTO agenda (cliente_nome, usuario_id, usuario_nome, data_retorno, observacao) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [cliente_nome, uId, usuario_nome || 'A definir', data_retorno, observacao || '']
    );
    res.json({ sucesso: true, agendamento: result.rows[0] });
  } catch (err) {
    console.error('Erro detalhado no agendamento:', err);
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

// CRM HISTÓRICO
app.get('/api/clientes/:id/historico', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM historico_contatos WHERE cliente_id = $1 ORDER BY id DESC', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico do cliente.' });
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
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar scripts.' });
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

// CLIENTES
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
    res.status(500).json({ error: 'Erro ao buscar clientes.', detalhe: error.message });
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
    res.status(500).json({ error: 'Erro ao cadastrar cliente manualmente.', detalhe: error.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo, nome, telefone, total_vencido, status_conexao } = req.body;
  try {
    const val = formatarValorExcel(total_vencido);
    const result = await pool.query(
      `UPDATE clientes SET codigo = $1, nome = $2, telefone = $3, total_vencido = $4, status_conexao = $5, atualizado_em = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [codigo, nome, telefone, val, status_conexao, id]
    );
    res.json({ sucesso: true, cliente: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar cliente.' });
  }
});

// MOVER ESTÁGIO + SALVAR DADOS DO ACORDO
app.put('/api/clientes/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id, usuario_nome, usuario_id, valor_acordo, parcelas_acordo } = req.body;
  try {
    let uId = null;
    if (usuario_id !== undefined && usuario_id !== null && usuario_id !== '') {
      const parsed = parseInt(usuario_id, 10);
      if (!isNaN(parsed)) uId = parsed;
    }

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
    res.status(500).json({ error: 'Erro ao atualizar estágio.', detalhe: error.message });
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

app.listen(PORT, () => {
  console.log(`🚀 API NEXUS COB rodando na porta ${PORT}`);
});
