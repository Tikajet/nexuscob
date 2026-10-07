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
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_vencido NUMERIC(10,2) DEFAULT 0.00;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dias_atraso INT DEFAULT 30;`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status_conexao VARCHAR(50) DEFAULT 'Ativo';`);
    await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estagio_id INT DEFAULT 1;`);

    console.log('✅ Banco PostgreSQL Nexus-Cob pronto!');
  } catch (error) {
    console.error('❌ Erro na inicializacao do BD:', error.message);
  }
}
initDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Nexus-Cob operacional' });
});

// LOGIN E USUÁRIOS
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      return res.json({ sucesso: true, usuario: userRes.rows[0] });
    }
    const nome = email.split('@')[0].toUpperCase();
    const cargo = email.includes('admin') ? 'ADMINISTRADOR' : 'COBRADOR';
    const newRes = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, email, '123456', cargo]
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
  const { nome, email, cargo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo',
      [nome, email, '123456', cargo || 'COBRADOR']
    );
    res.json({ sucesso: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.', detalhe: err.message });
  }
});

// LISTAR CLIENTES
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

// CADASTRO MANUAL
app.post('/api/clientes/manual', async (req, res) => {
  const { codigo, nome, total_vencido, opcao_atraso } = req.body;
  if (!nome || !total_vencido) {
    return res.status(400).json({ error: 'Nome e Valor Devedor são obrigatórios.' });
  }

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
    let valStr = String(total_vencido).replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const val = parseFloat(valStr) || 0.00;

    const result = await pool.query(
      `INSERT INTO clientes (codigo, nome, total_vencido, dias_atraso, status_conexao, estagio_id) 
       VALUES ($1, $2, $3, $4, $5, 1) RETURNING *`,
      [cod, String(nome).trim(), val, diasAtraso, statusConexao]
    );

    res.json({ sucesso: true, mensagem: 'Cliente cadastrado com sucesso!', cliente: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar cliente manualmente.', detalhe: error.message });
  }
});

// MOVER ESTÁGIO
app.put('/api/clientes/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id, usuario_nome, usuario_id } = req.body;
  try {
    await pool.query(
      'UPDATE clientes SET estagio_id = $1, usuario_responsavel_id = COALESCE($2, usuario_responsavel_id) WHERE id = $3',
      [estagio_id, usuario_id || null, id]
    );
    res.json({ sucesso: true, mensagem: `Cliente movido por ${usuario_nome}` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar estágio.', detalhe: error.message });
  }
});

// EXCLUIR CLIENTE
app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM agenda WHERE cliente_id = $1', [id]);
    await pool.query('DELETE FROM historico_contatos WHERE cliente_id = $1', [id]);
    await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    res.json({ sucesso: true, mensagem: 'Cliente excluído com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cliente.', detalhe: error.message });
  }
});

// EXCLUSÃO EM MASSA
app.post('/api/clientes/excluir-massa', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Nenhum ID selecionado para exclusão.' });
  }
  try {
    await pool.query('DELETE FROM agenda WHERE cliente_id = ANY($1::int[])', [ids]);
    await pool.query('DELETE FROM historico_contatos WHERE cliente_id = ANY($1::int[])', [ids]);
    await pool.query('DELETE FROM clientes WHERE id = ANY($1::int[])', [ids]);
    res.json({ sucesso: true, mensagem: `${ids.length} clientes excluídos com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir clientes em massa.', detalhe: error.message });
  }
});

// GERAR PRÉVIA DA PLANILHA EXCEL
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

      let valorStr = String(item[chaveValor] || '0');
      let valorLimpo = parseFloat(valorStr.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0.00;

      return {
        tempId: index + 1,
        codigo: String(item[chaveId] || `CLI-${index + 1}`).trim(),
        nome: String(item[chaveNome] || 'Cliente sem Nome').trim(),
        total_vencido: valorLimpo,
        opcao_atraso: '30', // Padrão Inicial: 30 dias
        selecionado: true
      };
    });

    res.json({ sucesso: true, total: listaPrevia.length, dados: listaPrevia });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar prévia.', detalhe: error.message });
  }
});

// CONFIRMAR IMPORTAÇÃO DA PRÉVIA COM A CATEGORIA/FAIXA SELECIONADA
app.post('/api/clientes/confirmar-importacao', async (req, res) => {
  const { clientes } = req.body;
  if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
    return res.status(400).json({ error: 'Nenhum cliente selecionado.' });
  }

  try {
    let inseridos = 0;
    for (const cli of clientes) {
      const cod = String(cli.codigo || `CLI-${Math.floor(1000 + Math.random() * 9000)}`);
      const val = parseFloat(cli.total_vencido) || 0.00;
      const nom = String(cli.nome || 'Cliente sem nome');

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
        `INSERT INTO clientes (codigo, nome, total_vencido, dias_atraso, status_conexao, estagio_id) 
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [cod, nom, val, diasAtraso, statusConexao]
      );
      inseridos++;
    }

    res.json({ sucesso: true, mensagem: `${inseridos} clientes importados para o Funil com sucesso!` });
  } catch (error) {
    console.error('Erro na gravação do PostgreSQL:', error);
    res.status(500).json({ error: 'Erro ao salvar no banco.', detalhe: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API NEXUS COB rodando na porta ${PORT}`);
});
