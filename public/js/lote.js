const loteId = Number(new URLSearchParams(location.search).get('id'))
const CHAVE_PENDENTES = 'quartosPendentes'

let lote = null
let produtos = []

function lerPendentes() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_PENDENTES))
    return Array.isArray(lista) ? lista : []
  } catch (erro) {
    return []
  }
}

function salvarPendentes(lista) {
  localStorage.setItem(CHAVE_PENDENTES, JSON.stringify(lista))
}

function pendentesDesteLote() {
  return lerPendentes().filter((quarto) => quarto.loteId === loteId)
}

function guardarPendente(quarto) {
  const lista = lerPendentes()
  lista.push(quarto)
  salvarPendentes(lista)
}

function removerPendente(id) {
  salvarPendentes(lerPendentes().filter((quarto) => quarto.id !== id))
}

async function enviarPendentes() {
  if (!navigator.onLine) return
  const lista = lerPendentes()
  if (lista.length === 0) return
  let enviouAlgum = false
  for (const quarto of lista) {
    try {
      await api('POST', '/lotes/' + quarto.loteId + '/quartos', quarto)
      removerPendente(quarto.id)
      enviouAlgum = true
    } catch (erro) {
      if (semConexao(erro)) {
        break
      }
      removerPendente(quarto.id)
      alert('Quarto de ' + quarto.peso + ' kg foi recusado: ' + erro.message)
    }
  }
  if (enviouAlgum) {
    await carregarLote()
  }
}

function mostrarResumo() {
  const pendentes = pendentesDesteLote()
  const pesoPendente = pendentes.reduce((soma, quarto) => soma + quarto.peso, 0)
  document.getElementById('titulo').textContent = 'Lote ' + lote.id + ' - ' + formatarData(lote.chegada)
  document.getElementById('status').innerHTML = badgeStatus(lote.status)
  document.getElementById('resumo-quartos').textContent = lote.quantidadeQuartos + pendentes.length
  document.getElementById('resumo-chegada').textContent = formatarPeso(lote.pesoChegada + pesoPendente)
  document.getElementById('resumo-perda').textContent = formatarPeso(lote.pesoPerda)
  document.getElementById('resumo-percentual').textContent = formatarPercentual(lote.percentualPerda)
  document.getElementById('resumo-final').textContent = formatarPeso(lote.pesoFinal)
}

function mostrarQuartos() {
  const lista = document.getElementById('lista-quartos')
  const pendentes = pendentesDesteLote()
  const aviso = document.getElementById('aviso-pendentes')
  aviso.hidden = pendentes.length === 0
  aviso.textContent = pendentes.length + ' quarto(s) aguardando conexão para enviar.'

  lista.innerHTML = ''
  const podeExcluir = lote.status !== 'Finalizado'

  for (const quarto of pendentes.slice().reverse()) {
    const linha = document.createElement('tr')
    linha.innerHTML =
      '<td>' + quarto.tipo + ' <span class="badge pendente">pendente</span></td>' +
      '<td class="numero">' + formatarPeso(quarto.peso) + '</td>' +
      '<td class="numero"><button class="secundario pequeno">Excluir</button></td>'
    linha.querySelector('button').addEventListener('click', () => {
      removerPendente(quarto.id)
      mostrarResumo()
      mostrarQuartos()
    })
    lista.appendChild(linha)
  }

  for (const quarto of lote.quartos) {
    const linha = document.createElement('tr')
    linha.innerHTML =
      '<td>' + quarto.tipo + '</td>' +
      '<td class="numero">' + formatarPeso(quarto.peso) + '</td>' +
      '<td class="numero">' + (podeExcluir ? '<button class="secundario pequeno">Excluir</button>' : '') + '</td>'
    if (podeExcluir) {
      linha.querySelector('button').addEventListener('click', async () => {
        if (!confirm('Excluir este quarto?')) return
        try {
          await api('DELETE', '/quartos/' + quarto.id)
          await carregarLote()
        } catch (erro) {
          mostrarErro('erro', semConexao(erro) ? 'Sem conexão: não foi possível excluir.' : erro.message)
        }
      })
    }
    lista.appendChild(linha)
  }

  if (lista.children.length === 0) {
    lista.innerHTML = '<tr><td colspan="3" class="vazio">Nenhum quarto lançado.</td></tr>'
  }
}

function mostrarProducao() {
  const lista = document.getElementById('lista-producao')
  lista.innerHTML = ''
  const podeExcluir = lote.status === 'Em processamento'

  for (const registro of lote.producao) {
    const linha = document.createElement('tr')
    linha.innerHTML =
      '<td>' + formatarData(registro.data) + '</td>' +
      '<td>' + escapar(registro.produto) + '</td>' +
      '<td class="numero">' + registro.embalagens + '</td>' +
      '<td class="numero">' + formatarPeso(registro.peso) + '</td>' +
      '<td class="numero">' + (podeExcluir ? '<button class="secundario pequeno">Excluir</button>' : '') + '</td>'
    if (podeExcluir) {
      linha.querySelector('button').addEventListener('click', async () => {
        if (!confirm('Excluir esta produção?')) return
        try {
          await api('DELETE', '/producao/' + registro.id)
          await carregarLote()
        } catch (erro) {
          mostrarErro('erro', semConexao(erro) ? 'Sem conexão: não foi possível excluir.' : erro.message)
        }
      })
    }
    lista.appendChild(linha)
  }

  if (lote.producao.length === 0) {
    lista.innerHTML = '<tr><td colspan="5" class="vazio">Nenhuma produção lançada.</td></tr>'
  }
}

function mostrarBotoes() {
  const recebendo = lote.status === 'Recebendo'
  const processando = lote.status === 'Em processamento'
  const finalizado = lote.status === 'Finalizado'

  document.getElementById('form-quarto').hidden = finalizado
  document.getElementById('botao-concluir').hidden = !recebendo
  document.getElementById('secao-perda').hidden = !processando
  document.getElementById('form-producao').hidden = !processando
  document.getElementById('botao-finalizar').hidden = !processando
  document.getElementById('botao-reabrir').hidden = !finalizado

  if (lote.pesoPerda !== null) {
    document.getElementById('peso-perda').value = lote.pesoPerda
  }
}

function montarOpcoesProdutos() {
  const select = document.getElementById('produto')
  select.innerHTML = '<option value="">Selecione...</option>'
  for (const produto of produtos) {
    if (!produto.ativo) continue
    const opcao = document.createElement('option')
    opcao.value = produto.id
    opcao.textContent = produto.nome
    select.appendChild(opcao)
  }
}

async function carregarLote() {
  try {
    lote = await api('GET', '/lotes/' + loteId)
    mostrarErro('erro', '')
    mostrarResumo()
    mostrarQuartos()
    mostrarProducao()
    mostrarBotoes()
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão e este lote ainda não foi aberto neste aparelho.' : erro.message)
  }
}

async function carregarProdutos() {
  try {
    produtos = await api('GET', '/produtos')
    montarOpcoesProdutos()
  } catch (erro) {
    produtos = []
  }
}

document.getElementById('form-quarto').addEventListener('submit', async (evento) => {
  evento.preventDefault()
  mostrarErro('erro-quarto', '')
  const campoPeso = document.getElementById('peso')
  const quarto = {
    id: crypto.randomUUID(),
    loteId: loteId,
    tipo: document.getElementById('tipo').value,
    peso: Number(campoPeso.value)
  }
  if (!quarto.peso || quarto.peso <= 0) {
    mostrarErro('erro-quarto', 'Informe o peso.')
    return
  }

  if (!navigator.onLine) {
    guardarPendente(quarto)
    campoPeso.value = ''
    campoPeso.focus()
    mostrarResumo()
    mostrarQuartos()
    return
  }

  try {
    await api('POST', '/lotes/' + loteId + '/quartos', quarto)
    campoPeso.value = ''
    campoPeso.focus()
    await carregarLote()
  } catch (erro) {
    if (semConexao(erro)) {
      guardarPendente(quarto)
      campoPeso.value = ''
      campoPeso.focus()
      mostrarResumo()
      mostrarQuartos()
    } else {
      mostrarErro('erro-quarto', erro.message)
    }
  }
})

document.getElementById('botao-concluir').addEventListener('click', async () => {
  if (pendentesDesteLote().length > 0) {
    mostrarErro('erro', 'Aguarde o envio dos quartos pendentes antes de concluir.')
    return
  }
  if (!confirm('Concluir o recebimento? Depois disso o lote vai para processamento.')) return
  try {
    await api('POST', '/lotes/' + loteId + '/concluir')
    await carregarLote()
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão: tente de novo quando a rede voltar.' : erro.message)
  }
})

document.getElementById('form-perda').addEventListener('submit', async (evento) => {
  evento.preventDefault()
  mostrarErro('erro-perda', '')
  try {
    await api('PUT', '/lotes/' + loteId + '/perda', {
      pesoPerda: Number(document.getElementById('peso-perda').value)
    })
    await carregarLote()
  } catch (erro) {
    mostrarErro('erro-perda', semConexao(erro) ? 'Sem conexão: tente de novo quando a rede voltar.' : erro.message)
  }
})

document.getElementById('form-producao').addEventListener('submit', async (evento) => {
  evento.preventDefault()
  mostrarErro('erro-producao', '')
  try {
    await api('POST', '/producao', {
      loteId: loteId,
      produtoId: Number(document.getElementById('produto').value),
      embalagens: Number(document.getElementById('embalagens').value),
      peso: Number(document.getElementById('peso-producao').value)
    })
    document.getElementById('embalagens').value = ''
    document.getElementById('peso-producao').value = ''
    await carregarLote()
  } catch (erro) {
    mostrarErro('erro-producao', semConexao(erro) ? 'Sem conexão: tente de novo quando a rede voltar.' : erro.message)
  }
})

document.getElementById('botao-finalizar').addEventListener('click', async () => {
  if (!confirm('Finalizar o lote? Depois disso nada mais pode ser alterado.')) return
  try {
    await api('POST', '/lotes/' + loteId + '/finalizar')
    await carregarLote()
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão: tente de novo quando a rede voltar.' : erro.message)
  }
})

document.getElementById('botao-reabrir').addEventListener('click', async () => {
  if (!confirm('Reabrir o lote?')) return
  try {
    await api('POST', '/lotes/' + loteId + '/reabrir')
    await carregarLote()
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão: tente de novo quando a rede voltar.' : erro.message)
  }
})

window.addEventListener('online', enviarPendentes)

carregarProdutos()
carregarLote().then(enviarPendentes)
