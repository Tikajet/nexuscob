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
      console.log('✅ Banco PostgreSQL Nexus-Cob pronto!');
    }
  } catch (error) {
    console.error('❌ Erro no schema:', error.message);
  }
}
initDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Nexus-Cob operacional' });
});

// AUTENTICAÇÃO E CADASTRO DE USUÁRIOS
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

// CLIENTES E KANBAN
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

// AGENDA
app.get('/api/agenda', async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, c.nome as cliente_nome FROM agenda a LEFT JOIN clientes c ON a.cliente_id = c.id ORDER BY a.data_agendamento ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agenda.' });
  }
});

app.post('/api/agenda', async (req, res) => {
  const { cliente_id, usuario_id, titulo, descricao, data_agendamento } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO agenda (cliente_id, usuario_id, titulo, descricao, data_agendamento) VALUES ($1, $2, $3, $4) RETURNING *',
      [cliente_id || null, usuario_id || null, titulo, descricao, data_agendamento]
    );
    res.json({ sucesso: true, item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar agendamento.' });
  }
});

// SCRIPTS DE COBRANÇA
app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scripts ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar scripts.' });
  }
});

app.post('/api/scripts', async (req, res) => {
  const { titulo, categoria, conteudo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO scripts (titulo, categoria, conteudo) VALUES ($1, $2, $3) RETURNING *',
      [titulo, categoria, conteudo]
    );
    res.json({ sucesso: true, script: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar script.' });
  }
});

// IMPORTAÇÃO INTELIGENTE DE EXCEL (Trata R$, virgulas, pontos e cabecalhos flexiveis)
app.post('/api/clientes/importar', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const dadosExcel = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    let inseridos = 0;
    for (const item of dadosExcel) {
      // Procura flexivel por qualquer nome de coluna para ID, Nome e Valor
      const chaveId = Object.keys(item).find(k => k.trim().toUpperCase() === 'ID' || k.trim().toUpperCase() === 'CODIGO') || Object.keys(item)[0];
      const chaveNome = Object.keys(item).find(k => k.trim().toUpperCase() === 'NOME' || k.trim().toUpperCase() === 'CLIENTE') || Object.keys(item)[1];
      const chaveValor = Object.keys(item).find(k => k.trim().toUpperCase().includes('VALOR') || k.trim().toUpperCase().includes('DEVEDOR')) || Object.keys(item)[2];

      const codigo = String(item[chaveId] || `CLI-${Math.floor(1000 + Math.random() * 9000)}`).trim();
      const nome = String(item[chaveNome] || 'Cliente sem Nome').trim();

      // Tratamento para limpar "R$", espaços, pontos e substituir virgula por ponto
      let valorBruto = String(item[chaveValor] || '0');
      let valorFormatado = valorBruto
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');

      const valorFinal = parseFloat(valorFormatado) || 0.00;

      await pool.query(
        `INSERT INTO clientes (codigo, nome, total_vencido, estagio_id) 
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (codigo) DO UPDATE SET 
            nome = EXCLUDED.nome,
            total_vencido = EXCLUDED.total_vencido`,
        [codigo, nome, valorFinal]
      );
      inseridos++;
    }

    res.json({ sucesso: true, mensagem: `${inseridos} clientes importados com sucesso!`, total: inseridos });
  } catch (error) {
    console.error('Erro ao importar Excel:', error);
    res.status(500).json({ error: 'Erro ao importar planilha.', detalhe: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API NEXUS COB rodando na porta ${PORT}`);
});
