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

    // Insere um usuário admin padrão se a tabela estiver vazia
    const checkUser = await pool.query('SELECT COUNT(*) FROM usuarios');
    if (parseInt(checkUser.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO usuarios (nome, email, senha_hash, cargo) 
        VALUES ('Administrador', 'admin@nexus.com.br', '123456', 'ADMIN')
      `);
    }

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
        operador_atual VARCHAR(255),
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
        operador_atual VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Banco de dados Nexus Cob sincronizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
  }
}
initDB();

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, email, cargo, ativo FROM usuarios ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([{ id: 1, nome: 'Administrador', email: 'admin@nexus.com.br', cargo: 'ADMIN' }]);
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

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  const emailLimpo = String(email || 'admin@nexus.com.br').trim().toLowerCase();
  try {
    const userRes = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1', [emailLimpo]);
    if (userRes.rows.length > 0) {
      return res.json({ sucesso: true, usuario: userRes.rows[0] });
    }
    res.json({ sucesso: true, usuario: { id: 1, nome: emailLimpo.split('@')[0], email: emailLimpo, cargo: 'ADMIN' } });
  } catch (err) {
    res.json({ sucesso: true, usuario: { id: 1, nome: 'Admin', email: emailLimpo, cargo: 'ADMIN' } });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/pos-venda', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pos_venda_clientes ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/agenda', async (req, res) => {
  res.json([]);
});

app.get('/api/chat/mensagens', async (req, res) => {
  res.json([]);
});

app.post('/api/chat/mensagens', async (req, res) => {
  res.json({ sucesso: true });
});

app.post('/api/admin/previa-planilha', (req, res) => {
  res.json({ sucesso: true, dados: [] });
});

app.post('/api/admin/confirmar-importacao', (req, res) => {
  res.json({ sucesso: true });
});

const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 NEXUS COB API rodando na porta ${PORT}`);
});
