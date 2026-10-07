-- TABELA DE USUÁRIOS E PERMISSÕES (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(20) NOT NULL DEFAULT 'operador', -- 'admin', 'supervisor', 'operador'
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE ESTÁGIOS DO PIPELINE (KANBAN)
CREATE TABLE IF NOT EXISTS estagios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ordem INT NOT NULL,
    cor VARCHAR(20) DEFAULT '#3b82f6',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE TAGS
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor VARCHAR(20) DEFAULT '#6b7280'
);

-- TABELA DE CLIENTES / DEVEDORES
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    documento VARCHAR(20), -- CPF ou CNPJ
    telefone VARCHAR(30),
    email VARCHAR(150),
    valor_devido DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    data_vencimento DATE,
    numero_contrato VARCHAR(50),
    estagio_id INT REFERENCES estagios(id) ON DELETE SET NULL,
    usuario_responsavel_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RELAÇÃO CLIENTE <-> TAGS
CREATE TABLE IF NOT EXISTS cliente_tags (
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, tag_id)
);

-- TABELA DE SCRIPTS DE ABORDAGEM (CRIADOS PELO ADMIN)
CREATE TABLE IF NOT EXISTS scripts (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    conteudo TEXT NOT NULL, -- Ex: "Olá {NOME_CLIENTE}, seu contrato {NUMERO_CONTRATO} de R$ {VALOR_DEVIDO} venceu em {DATA_VENCIMENTO}."
    estagio_id INT REFERENCES estagios(id) ON DELETE SET NULL,
    categoria VARCHAR(50) DEFAULT 'Geral', -- 'WhatsApp', 'Ligação', 'Email'
    criado_por INT REFERENCES usuarios(id),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE AGENDA PARTICULAR DOS USUÁRIOS
CREATE TABLE IF NOT EXISTS agenda (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    data_agendamento TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'concluido', 'cancelado'
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE ACORDOS E RECUPERAÇÃO
CREATE TABLE IF NOT EXISTS acordos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    valor_original DECIMAL(10,2) NOT NULL,
    valor_acordo DECIMAL(10,2) NOT NULL,
    numero_parcelas INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'em_andamento', -- 'em_andamento', 'pago', 'quebrado'
    data_acordo DATE DEFAULT CURRENT_DATE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERIR ESTÁGIOS PADRÃO DO PIPELINE
INSERT INTO estagios (nome, ordem, cor) VALUES
('Preventivo', 1, '#10b981'),
('Vencido (1-15 dias)', 2, '#f59e0b'),
('Contato Realizado', 3, '#3b82f6'),
('Acordo em Negociação', 4, '#8b5cf6'),
('Acordo Gerado', 5, '#ec4899'),
('Recuperado / Quitado', 6, '#059669')
ON CONFLICT DO NOTHING;
