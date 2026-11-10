const express = require('express')
const crypto = require('crypto')
const db = require('../banco')

const rotas = express.Router()

function statusDoLote(lote) {
  if (lote.finalizado) return 'Finalizado'
  if (lote.recebimento_concluido) return 'Em processamento'
  return 'Recebendo'
}

function montarLote(lote) {
  const resumo = db.prepare(`
    SELECT COUNT(*) AS quantidade, COALESCE(SUM(peso), 0) AS peso_chegada
    FROM quartos WHERE lote_id = ?
  `).get(lote.id)

  let pesoFinal = null
  let percentualPerda = null
  if (lote.peso_perda !== null && resumo.peso_chegada > 0) {
    pesoFinal = resumo.peso_chegada - lote.peso_perda
    percentualPerda = (lote.peso_perda / resumo.peso_chegada) * 100
  }

  return {
    id: lote.id,
    chegada: lote.chegada,
    status: statusDoLote(lote),
    quantidadeQuartos: resumo.quantidade,
    pesoChegada: resumo.peso_chegada,
    pesoPerda: lote.peso_perda,
    pesoFinal: pesoFinal,
    percentualPerda: percentualPerda
  }
}

function buscarLote(id) {
  return db.prepare('SELECT * FROM lotes WHERE id = ?').get(id)
}

rotas.get('/lotes', (req, res) => {
  const lotes = db.prepare('SELECT * FROM lotes ORDER BY chegada DESC').all()
  res.json(lotes.map(montarLote))
})

rotas.post('/lotes', (req, res) => {
  const chegada = new Date().toISOString()
  const resultado = db.prepare('INSERT INTO lotes (chegada) VALUES (?)').run(chegada)
  const lote = buscarLote(resultado.lastInsertRowid)
  res.status(201).json(montarLote(lote))
})

rotas.get('/lotes/:id', (req, res) => {
  const lote = buscarLote(req.params.id)
  if (!lote) {
    return res.status(404).json({ erro: 'Lote não encontrado' })
  }

  const quartos = db.prepare(`
    SELECT * FROM quartos WHERE lote_id = ? ORDER BY criado_em DESC
  `).all(lote.id)

  const producao = db.prepare(`
    SELECT producao.*, produtos.nome AS produto
    FROM producao
    JOIN produtos ON produtos.id = producao.produto_id
    WHERE producao.lote_id = ?
    ORDER BY producao.id DESC
  `).all(lote.id)

  const dados = montarLote(lote)
  dados.quartos = quartos
  dados.producao = producao
  res.json(dados)
})

rotas.post('/lotes/:id/quartos', (req, res) => {
  const lote = buscarLote(req.params.id)
  if (!lote) {
    return res.status(404).json({ erro: 'Lote não encontrado' })
  }
  if (lote.finalizado) {
    return res.status(400).json({ erro: 'Lote finalizado não aceita quartos' })
  }

  const tipo = req.body.tipo
  const peso = Number(req.body.peso)
  if (tipo !== 'Dianteiro' && tipo !== 'Traseiro') {
    return res.status(400).json({ erro: 'Tipo deve ser Dianteiro ou Traseiro' })
  }
  if (!peso || peso <= 0 || peso >= 1000) {
    return res.status(400).json({ erro: 'Peso inválido' })
  }

  const id = req.body.id || crypto.randomUUID()
  const existente = db.prepare('SELECT * FROM quartos WHERE id = ?').get(id)
  if (existente) {
    return res.json(existente)
  }

  db.prepare(`
    INSERT INTO quartos (id, lote_id, tipo, peso, criado_em) VALUES (?, ?, ?, ?, ?)
  `).run(id, lote.id, tipo, peso, new Date().toISOString())

  const quarto = db.prepare('SELECT * FROM quartos WHERE id = ?').get(id)
  res.status(201).json(quarto)
})

rotas.delete('/quartos/:id', (req, res) => {
  const quarto = db.prepare('SELECT * FROM quartos WHERE id = ?').get(req.params.id)
  if (!quarto) {
    return res.status(404).json({ erro: 'Quarto não encontrado' })
  }
  const lote = buscarLote(quarto.lote_id)
  if (lote.finalizado) {
    return res.status(400).json({ erro: 'Lote finalizado não pode ser alterado' })
  }
  db.prepare('DELETE FROM quartos WHERE id = ?').run(quarto.id)
  res.status(204).end()
})

rotas.post('/lotes/:id/concluir', (req, res) => {
  const lote = buscarLote(req.params.id)
  if (!lote) {
    return res.status(404).json({ erro: 'Lote não encontrado' })
  }
  if (lote.recebimento_concluido) {
    return res.status(400).json({ erro: 'Recebimento já foi concluído' })
  }
  const total = db.prepare('SELECT COUNT(*) AS n FROM quartos WHERE lote_id = ?').get(lote.id).n
  if (total === 0) {
    return res.status(400).json({ erro: 'Lance ao menos um quarto antes de concluir' })
  }
  db.prepare('UPDATE lotes SET recebimento_concluido = 1 WHERE id = ?').run(lote.id)
  res.json(montarLote(buscarLote(lote.id)))
})

rotas.put('/lotes/:id/perda', (req, res) => {
  const lote = buscarLote(req.params.id)
  if (!lote) {
    return res.status(404).json({ erro: 'Lote não encontrado' })
  }
  if (!lote.recebimento_concluido) {
    return res.status(400).json({ erro: 'Conclua o recebimento antes' })
  }
  if (lote.finalizado) {
    return res.status(400).json({ erro: 'Lote finalizado não pode ser alterado' })
  }
  const pesoPerda = Number(req.body.pesoPerda)
  if (isNaN(pesoPerda) || pesoPerda < 0) {
    return res.status(400).json({ erro: 'Peso da perda inválido' })
  }
  db.prepare('UPDATE lotes SET peso_perda = ? WHERE id = ?').run(pesoPerda, lote.id)
  res.json(montarLote(buscarLote(lote.id)))
})

rotas.post('/lotes/:id/finalizar', (req, res) => {
  const lote = buscarLote(req.params.id)
  if (!lote) {
    return res.status(404).json({ erro: 'Lote não encontrado' })
  }
  if (!lote.recebimento_concluido) {
    return res.status(400).json({ erro: 'Conclua o recebimento antes' })
  }
  if (lote.finalizado) {
    return res.status(400).json({ erro: 'Lote já está finalizado' })
  }
  if (lote.peso_perda === null) {
    return res.status(400).json({ erro: 'Informe a perda antes de finalizar' })
  }
  db.prepare('UPDATE lotes SET finalizado = 1 WHERE id = ?').run(lote.id)
  res.json(montarLote(buscarLote(lote.id)))
})

rotas.post('/lotes/:id/reabrir', (req, res) => {
  const lote = buscarLote(req.params.id)
  if (!lote) {
    return res.status(404).json({ erro: 'Lote não encontrado' })
  }
  if (!lote.finalizado) {
    return res.status(400).json({ erro: 'Lote não está finalizado' })
  }
  db.prepare('UPDATE lotes SET finalizado = 0 WHERE id = ?').run(lote.id)
  res.json(montarLote(buscarLote(lote.id)))
})

module.exports = rotas
