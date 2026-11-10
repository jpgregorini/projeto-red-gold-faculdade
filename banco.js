const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const db = new DatabaseSync(path.join(__dirname, 'dados.db'))

db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS lotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chegada TEXT NOT NULL,
    recebimento_concluido INTEGER NOT NULL DEFAULT 0,
    peso_perda REAL,
    finalizado INTEGER NOT NULL DEFAULT 0
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS quartos (
    id TEXT PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    peso REAL NOT NULL,
    criado_em TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    ativo INTEGER NOT NULL DEFAULT 1
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS producao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER NOT NULL REFERENCES lotes(id),
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    embalagens INTEGER NOT NULL,
    peso REAL NOT NULL,
    data TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS saidas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    embalagens INTEGER NOT NULL,
    peso REAL NOT NULL,
    data TEXT NOT NULL
  )
`)

const produtosIniciais = [
  'Picanha',
  'Alcatra',
  'Contrafilé',
  'Filé mignon',
  'Maminha',
  'Fraldinha',
  'Coxão mole',
  'Coxão duro',
  'Patinho',
  'Lagarto',
  'Acém',
  'Músculo',
  'Costela',
  'Cupim',
  'Carne moída'
]

const total = db.prepare('SELECT COUNT(*) AS n FROM produtos').get().n
if (total === 0) {
  const inserir = db.prepare('INSERT INTO produtos (nome) VALUES (?)')
  for (const nome of produtosIniciais) {
    inserir.run(nome)
  }
}

module.exports = db
