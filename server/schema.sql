-- TABELA DE USUÁRIOS E PERMISSÕES (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(20) NOT NULL DEFAULT 'cobrador', -- 'admin', 'supervisor', 'cobrador', 'financeiro'
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE ETAPAS DO PIPELINE
CREATE TABLE IF NOT EXISTS estagios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ordem INT NOT NULL,
    cor VARCHAR(20) DEFAULT '#0284c7',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE CLIENTES (PROVEDOR DE INTERNET)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(150) NOT NULL,
    documento VARCHAR(20), -- CPF/CNPJ
    telefone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(150),
    endereco TEXT,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    -- DADOS DO CONTRATO DE INTERNET
    plano VARCHAR(100),
    velocidade VARCHAR(50),
    valor_mensal DECIMAL(10,2) DEFAULT 0.00,
    dia_vencimento INT DEFAULT 10,
    status_conexao VARCHAR(30) DEFAULT 'Ativo', -- 'Ativo', 'Reduzido', 'Suspenso', 'Cancelado'
    data_instalacao DATE,
    equipamentos_comodato TEXT,
    -- DADOS FINANCEIROS
    total_vencido DECIMAL(10,2) DEFAULT 0.00,
    faturas_abertas INT DEFAULT 1,
    dias_atraso INT DEFAULT 0,
    prioridade VARCHAR(20) DEFAULT 'BAIXA', -- 'BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA'
    faixa_atraso VARCHAR(50) DEFAULT '1-5 dias (Lembrete)',
    estagio_id INT REFERENCES estagios(id) ON DELETE SET NULL,
    usuario_responsavel_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE HISTÓRICO DE CONTATOS
CREATE TABLE IF NOT EXISTS historico_contatos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id),
    canal VARCHAR(30), -- 'WhatsApp', 'Telefone', 'SMS', 'E-mail', 'Presencial'
    resultado VARCHAR(50), -- 'Contato Realizado', 'Não Atendeu', 'Promessa', 'Acordo', 'Contestação'
    observacao TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE PROMESSAS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS promessas (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id),
    valor DECIMAL(10,2) NOT NULL,
    data_promessa DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'cumprida', 'vencida', 'cancelada'
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE ACORDOS
CREATE TABLE IF NOT EXISTS acordos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id),
    divida_original DECIMAL(10,2) NOT NULL,
    valor_acordo DECIMAL(10,2) NOT NULL,
    entrada DECIMAL(10,2) DEFAULT 0.00,
    numero_parcelas INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'pago', 'quebrado'
    data_acordo DATE DEFAULT CURRENT_DATE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE SCRIPTS DE ABORDAGEM
CREATE TABLE IF NOT EXISTS scripts (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'Primeiro Contato', 'Promessa Vencida', 'Pedido de Desconto', etc.
    conteudo TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERIR ETAPAS PADRÃO DO PIPELINE
INSERT INTO estagios (nome, ordem, cor) VALUES
('NOVOS', 1, '#64748b'),
('PRIMEIRO CONTATO', 2, '#3b82f6'),
('CONTATO REALIZADO', 3, '#0284c7'),
('EM NEGOCIAÇÃO', 4, '#8b5cf6'),
('PROMESSA DE PAGAMENTO', 5, '#f59e0b'),
('AGUARDANDO PAGAMENTO', 6, '#ec4899'),
('PAGAMENTO CONFIRMADO', 7, '#10b981')
ON CONFLICT DO NOTHING;
