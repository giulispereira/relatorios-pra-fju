const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log('✅ Conectado ao banco PostgreSQL com sucesso!'))
  .catch(err => console.error('❌ Erro de conexão com o banco:', err));

// --- ROTAS DE JOVENS ---
app.get('/jovens', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jovens ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/jovens', async (req, res) => {
  const { nome, telefone, categoria, notas } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO jovens (nome, telefone, categoria, notas) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, telefone, categoria, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE RELATÓRIOS E HISTÓRICO ---
app.post('/relatorios', async (req, res) => {
  const { data, tipo_dia, presencas, texto_gerado } = req.body; 
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    
    let relatorioRes;
    try {
      relatorioRes = await client.query(
        'INSERT INTO relatorios (dados, tipo_dia, detalhes_extras) VALUES ($1, $2, $3) RETURNING "eu ia" AS id',
        [data, tipo_dia, texto_gerado]
      );
    } catch (e) {
      
      relatorioRes = await client.query(
        'INSERT INTO relatorios (dados, tipo_dia) VALUES ($1, $2) RETURNING "eu ia" AS id',
        [data, tipo_dia]
      );
    }

    const relatorioId = relatorioRes.rows[0].id;

    
    if (presencas && presencas.length > 0) {
      for (let p of presencas) {
        try {
          await client.query(
            'INSERT INTO presencas (relatorio_id, jovem_id, status_no_dia) VALUES ($1, $2, $3)',
            [relatorioId, p.jovem_id, `${p.status}_${p.horario_tipo || 'PRINCIPAL'}`]
          );
        } catch (presErr) {
          console.log("Aviso: tabela presencas pode não estar configurada, ignorando erro individual de presença.");
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Relatório salvo com sucesso!', relatorioId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("ERRO DETALHADO NO POST /relatorios:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/relatorios/historico', async (req, res) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        "eu ia" AS id, 
        dados AS data, 
        tipo_dia, 
        COALESCE(detalhes_extras, 'Relatório salvo sem texto detalhado.') AS detalhes_extras 
      FROM relatorios 
      ORDER BY "eu ia" DESC
    `);
    res.json(result.rows);
  } catch (err) {
    
    try {
      const resultFallback = await pool.query(`
        SELECT 
          "eu ia" AS id, 
          dados AS data, 
          tipo_dia, 
          'Relatório salvo' AS detalhes_extras 
        FROM relatorios 
        ORDER BY "eu ia" DESC
      `);
      res.json(resultFallback.rows);
    } catch (err2) {
      console.error("ERRO DETALHADO NO GET /relatorios/historico:", err2);
      res.status(500).json({ error: err2.message });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});