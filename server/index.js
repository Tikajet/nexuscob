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
      console.log('✅ Banco de dados PostgreSQL sincronizado com sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas no banco:', error.message);
  }
}
initDB();

// Healthcheck API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Nexus-Cob rodando perfeitamente!' });
});

// Listar Clientes no Kanban
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

// Renderização Dinâmica de Scripts
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

// Importação de Planilhas Excel (.xlsx / .csv)
app.post('/api/clientes/importar', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const dadosExcel = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Insere os clientes importados da planilha no banco de dados
    for (const item of dadosExcel) {
      await pool.query(
        `INSERT INTO clientes (nome, documento, telefone, email, valor_devido, numero_contrato, estagio_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          item.Nome || item.nome || 'Cliente sem nome',
          item.CPF || item.CNPJ || item.documento || '',
          item.Telefone || item.telefone || '',
          item.Email || item.email || '',
          parseFloat(item.Valor || item.valor_devido || 0),
          item.Contrato || item.numero_contrato || 'CTR-0000',
          1 // Estágio inicial ("Preventivo" ou "Vencido")
        ]
      );
    }

    res.json({
      sucesso: true,
      mensagem: `${dadosExcel.length} clientes importados com sucesso!`,
      total_registros: dadosExcel.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar o arquivo Excel.', detalhe: error.message });
  }
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Nexus-Cob rodando na porta ${PORT}`);
});
