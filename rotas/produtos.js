const express = require('express')
const db = require('../banco')

const rotas = express.Router()

rotas.get('/produtos', (req, res) => {
  const produtos = db.prepare('SELECT * FROM produtos ORDER BY nome').all()
  res.json(produtos)
})

rotas.post('/produtos', (req, res) => {
  const nome = (req.body.nome || '').trim()
  if (nome === '') {
    return res.status(400).json({ erro: 'Informe o nome do produto' })
  }
  const repetido = db.prepare('SELECT id FROM produtos WHERE lower(nome) = lower(?)').get(nome)
  if (repetido) {
    return res.status(400).json({ erro: 'Já existe um produto com esse nome' })
  }
  const resultado = db.prepare('INSERT INTO produtos (nome) VALUES (?)').run(nome)
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(resultado.lastInsertRowid)
  res.status(201).json(produto)
})

rotas.put('/produtos/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id)
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }
  const ativo = req.body.ativo ? 1 : 0
  db.prepare('UPDATE produtos SET ativo = ? WHERE id = ?').run(ativo, produto.id)
  res.json(db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto.id))
})

module.exports = rotas
