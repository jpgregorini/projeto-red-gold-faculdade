const express = require('express')
const db = require('../banco')

const rotas = express.Router()

function calcularSaldo() {
  return db.prepare(`
    SELECT
      produtos.id AS produtoId,
      produtos.nome AS produto,
      produtos.ativo AS ativo,
      COALESCE((SELECT SUM(embalagens) FROM producao WHERE produto_id = produtos.id), 0)
        - COALESCE((SELECT SUM(embalagens) FROM saidas WHERE produto_id = produtos.id), 0) AS embalagens,
      COALESCE((SELECT SUM(peso) FROM producao WHERE produto_id = produtos.id), 0)
        - COALESCE((SELECT SUM(peso) FROM saidas WHERE produto_id = produtos.id), 0) AS peso
    FROM produtos
    ORDER BY produtos.nome
  `).all()
}

function saldoDoProduto(produtoId) {
  return calcularSaldo().find((item) => item.produtoId === produtoId)
}

rotas.get('/saldo', (req, res) => {
  const saldo = calcularSaldo().filter((item) => item.embalagens !== 0 || item.peso !== 0)
  res.json(saldo)
})

module.exports = rotas
module.exports.saldoDoProduto = saldoDoProduto
