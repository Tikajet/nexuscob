const express = require('express');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Força a adequação da tabela de usuários com a coluna login
async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.error('ALERTA: A variável DATABASE_URL não está configurada!');
    return;
  }
  try {
    // Garante que a coluna login exista na tabela usuarios caso ela seja antiga
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        login VARCHAR(50) UNIQUE NOT NULL,
        senha VARCHAR(100) NOT NULL,
        cargo VARCHAR(30) NOT NULL
      );
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS login VARCHAR(50) UNIQUE;
    `);
    
    const checkUser = await pool.query('SELECT count(*) FROM usuarios');
    if (parseInt(checkUser.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO usuarios (nome, login, senha, cargo) 
        VALUES ('Administrador', 'admin', '123456', 'ADMIN');
      `);
      console.log('Usuário admin inicial criado com sucesso!');
    }
  } catch (err) {
    console.error('Erro ao inicializar base de dados:', err.message);
  }
}
initDB();

// Rota de Login
app.post('/api/login', async (req, res) => {
  const { login, senha } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(login) = LOWER($1) AND senha = $2', 
      [login, senha]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Login ou senha incorretos' });
    }
    const user = result.rows[0];
    res.json({ id: user.id, nome: user.nome, login: user.login, cargo: user.cargo });
  } catch (err) {
    console.error('Erro na consulta de login:', err.message);
    res.status(500).json({ error: `Erro no banco: ${err.message}` });
  }
});

// Listar Usuários
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, login, cargo FROM usuarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Criar Usuário
app.post('/api/usuarios', async (req, res) => {
  const { nome, login, senha, cargo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, login, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, login, cargo',
      [nome, login, senha, cargo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao cadastrar usuário ou login já existe' });
  }
});

// Excluir Usuário
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// Servir arquivos estáticos da build do React
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
