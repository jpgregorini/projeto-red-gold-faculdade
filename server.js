const express = require('express')
const path = require('path')
const rotasLotes = require('./rotas/lotes')
const rotasProdutos = require('./rotas/produtos')
const rotasProducao = require('./rotas/producao')
const rotasSaidas = require('./rotas/saidas')
const rotasSaldo = require('./rotas/saldo')

const app = express()
const porta = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api', rotasLotes)
app.use('/api', rotasProdutos)
app.use('/api', rotasProducao)
app.use('/api', rotasSaidas)
app.use('/api', rotasSaldo)

app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' })
})

app.listen(porta, () => {
  console.log('Servidor rodando em http://localhost:' + porta)
})
