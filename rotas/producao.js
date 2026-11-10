const express = require('express')
const db = require('../banco')
const { saldoDoProduto } = require('./saldo')

const rotas = express.Router()

function listarProducao(filtro, valor) {
  let sql = `
    SELECT producao.*, produtos.nome AS produto
    FROM producao
    JOIN produtos ON produtos.id = producao.produto_id
  `
  if (filtro) {
    sql += ' WHERE producao.' + filtro + ' = ?'
    return db.prepare(sql + ' ORDER BY producao.id DESC').all(valor)
  }
  return db.prepare(sql + ' ORDER BY producao.id DESC').all()
}

rotas.get('/producao', (req, res) => {
  res.json(listarProducao())
})

rotas.post('/producao', (req, res) => {
  const loteId = Number(req.body.loteId)
  const produtoId = Number(req.body.produtoId)
  const embalagens = Number(req.body.embalagens)
  const peso = Number(req.body.peso)

  const lote = db.prepare('SELECT * FROM lotes WHERE id = ?').get(loteId)
  if (!lote) {
    return res.status(404).json({ erro: 'Lote não encontrado' })
  }
  if (!lote.recebimento_concluido) {
    return res.status(400).json({ erro: 'Conclua o recebimento antes de lançar produção' })
  }
  if (lote.finalizado) {
    return res.status(400).json({ erro: 'Lote finalizado não aceita produção' })
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produtoId)
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }
  if (!produto.ativo) {
    return res.status(400).json({ erro: 'Produto inativo' })
  }
  if (!Number.isInteger(embalagens) || embalagens <= 0) {
    return res.status(400).json({ erro: 'Informe a quantidade de embalagens' })
  }
  if (!peso || peso <= 0) {
    return res.status(400).json({ erro: 'Informe o peso' })
  }

  const resultado = db.prepare(`
    INSERT INTO producao (lote_id, produto_id, embalagens, peso, data) VALUES (?, ?, ?, ?, ?)
  `).run(loteId, produtoId, embalagens, peso, new Date().toISOString())

  const registro = listarProducao('id', resultado.lastInsertRowid)[0]
  res.status(201).json(registro)
})

rotas.delete('/producao/:id', (req, res) => {
  const registro = db.prepare('SELECT * FROM producao WHERE id = ?').get(req.params.id)
  if (!registro) {
    return res.status(404).json({ erro: 'Produção não encontrada' })
  }
  const lote = db.prepare('SELECT * FROM lotes WHERE id = ?').get(registro.lote_id)
  if (lote.finalizado) {
    return res.status(400).json({ erro: 'Lote finalizado não pode ser alterado' })
  }

  const saldo = saldoDoProduto(registro.produto_id)
  if (saldo.embalagens - registro.embalagens < 0 || saldo.peso - registro.peso < 0) {
    return res.status(400).json({ erro: 'Essa produção já foi vendida e não pode ser excluída' })
  }

  db.prepare('DELETE FROM producao WHERE id = ?').run(registro.id)
  res.status(204).end()
})

module.exports = rotas
