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

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Inicialização automática das tabelas no Banco de Dados
async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('✅ Banco PostgreSQL do Nexus-Cob pronto!');
    }
  } catch (error) {
    console.error('❌ Erro no schema:', error.message);
  }
}
initDB();

// 1. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Nexus-Cob operacional em nuvem' });
});

// 2. BUSCAR TODOS OS CLIENTES / PIPELINE
app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, e.nome as estagio_nome 
      FROM clientes c 
      LEFT JOIN estagios e ON c.estagio_id = e.id 
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes.', detalhe: error.message });
  }
});

// 3. MOVER CLIENTE NO PIPELINE / KANBAN
app.put('/api/clientes/:id/estagio', async (req, res) => {
  const { id } = req.params;
  const { estagio_id } = req.body;
  try {
    await pool.query('UPDATE clientes SET estagio_id = $1 WHERE id = $2', [estagio_id, id]);
    res.json({ sucesso: true, mensagem: 'Estágio do cliente atualizado!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar estágio.', detalhe: error.message });
  }
});

// 4. AGENDA / TAREFAS DOS OPERADORES
app.get('/api/agenda', async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, c.nome as cliente_nome FROM agenda a LEFT JOIN clientes c ON a.cliente_id = c.id ORDER BY a.data_agendamento ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agenda.', detalhe: error.message });
  }
});

app.post('/api/agenda', async (req, res) => {
  const { cliente_id, titulo, descricao, data_agendamento } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO agenda (cliente_id, titulo, descricao, data_agendamento) VALUES ($1, $2, $3, $4) RETURNING *',
      [cliente_id || null, titulo, descricao, data_agendamento]
    );
    res.json({ sucesso: true, item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar agendamento.', detalhe: error.message });
  }
});

// 5. REGISTRAR HISTÓRICO DE CONTATO (LIGAÇÃO / WHATSAPP / SMS)
app.post('/api/contatos', async (req, res) => {
  const { cliente_id, canal, resultado, observacao } = req.body;
  try {
    await pool.query(
      'INSERT INTO historico_contatos (cliente_id, canal, resultado, observacao) VALUES ($1, $2, $3, $4)',
      [cliente_id, canal, resultado, observacao]
    );
    res.json({ sucesso: true, mensagem: 'Histórico de atendimento salvo!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar histórico.', detalhe: error.message });
  }
});

// 6. SCRIPTS DE ABORDAGEM
app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scripts ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar scripts.', detalhe: error.message });
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
    res.status(500).json({ error: 'Erro ao cadastrar script.', detalhe: error.message });
  }
});

// 7. IMPORTAÇÃO DE PLANILHA EXCEL (.xlsx / .csv)
app.post('/api/clientes/importar', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const dadosExcel = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let inseridos = 0;
    for (const item of dadosExcel) {
      await pool.query(
        `INSERT INTO clientes (codigo, nome, documento, telefone, whatsapp, email, plano, valor_mensal, total_vencido, dias_atraso, estagio_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (codigo) DO UPDATE SET 
            total_vencido = EXCLUDED.total_vencido,
            dias_atraso = EXCLUDED.dias_atraso`,
        [
          item.Codigo || item.codigo || `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
          item.Cliente || item.nome || 'Cliente sem nome',
          item.CPF || item.documento || '',
          item.Telefone || item.telefone || '',
          item.WhatsApp || item.whatsapp || item.telefone || '',
          item.Email || item.email || '',
          item.Plano || item.plano || 'Fibra Óptica 500M',
          parseFloat(item.Valor || item.valor_mensal || 119.90),
          parseFloat(item.ValorVencido || item.total_vencido || 239.80),
          parseInt(item.DiasAtraso || item.dias_atraso || 15),
          1 // Estágio inicial: "NOVOS"
        ]
      );
      inseridos++;
    }

    res.json({
      sucesso: true,
      mensagem: `${inseridos} clientes importados/atualizados com sucesso!`,
      total: inseridos
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar planilha Excel.', detalhe: error.message });
  }
});

// Inicialização
app.listen(PORT, () => {
  console.log(`🚀 API NEXUS COB rodando na porta ${PORT}`);
});
