const express = require('express')
const db = require('../banco')
const { saldoDoProduto } = require('./saldo')

const rotas = express.Router()

rotas.get('/saidas', (req, res) => {
  const saidas = db.prepare(`
    SELECT saidas.*, produtos.nome AS produto
    FROM saidas
    JOIN produtos ON produtos.id = saidas.produto_id
    ORDER BY saidas.id DESC
  `).all()
  res.json(saidas)
})

rotas.post('/saidas', (req, res) => {
  const produtoId = Number(req.body.produtoId)
  const embalagens = Number(req.body.embalagens)
  const peso = Number(req.body.peso)

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produtoId)
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }
  if (!Number.isInteger(embalagens) || embalagens <= 0) {
    return res.status(400).json({ erro: 'Informe a quantidade de embalagens' })
  }
  if (!peso || peso <= 0) {
    return res.status(400).json({ erro: 'Informe o peso' })
  }

  const saldo = saldoDoProduto(produtoId)
  if (embalagens > saldo.embalagens || peso > saldo.peso) {
    return res.status(400).json({
      erro: 'Saldo insuficiente. Disponível: ' + saldo.embalagens + ' embalagens e ' + saldo.peso.toFixed(2) + ' kg'
    })
  }

  const resultado = db.prepare(`
    INSERT INTO saidas (produto_id, embalagens, peso, data) VALUES (?, ?, ?, ?)
  `).run(produtoId, embalagens, peso, new Date().toISOString())

  const saida = db.prepare(`
    SELECT saidas.*, produtos.nome AS produto
    FROM saidas
    JOIN produtos ON produtos.id = saidas.produto_id
    WHERE saidas.id = ?
  `).get(resultado.lastInsertRowid)
  res.status(201).json(saida)
})

rotas.delete('/saidas/:id', (req, res) => {
  const saida = db.prepare('SELECT * FROM saidas WHERE id = ?').get(req.params.id)
  if (!saida) {
    return res.status(404).json({ erro: 'Saída não encontrada' })
  }
  db.prepare('DELETE FROM saidas WHERE id = ?').run(saida.id)
  res.status(204).end()
})

module.exports = rotas
