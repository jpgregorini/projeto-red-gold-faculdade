let registros = []

function mostrarRegistros() {
  const lista = document.getElementById('lista-producao')
  const filtro = document.getElementById('filtro-produto').value
  const filtrados = filtro ? registros.filter((r) => r.produto === filtro) : registros

  if (filtrados.length === 0) {
    lista.innerHTML = '<tr><td colspan="5" class="vazio">Nenhuma produção lançada.</td></tr>'
    return
  }

  let totalEmbalagens = 0
  let totalPeso = 0
  lista.innerHTML = ''
  for (const registro of filtrados) {
    totalEmbalagens += registro.embalagens
    totalPeso += registro.peso
    const linha = document.createElement('tr')
    linha.className = 'link'
    linha.innerHTML =
      '<td>' + formatarData(registro.data) + '</td>' +
      '<td>Lote ' + registro.lote_id + '</td>' +
      '<td>' + escapar(registro.produto) + '</td>' +
      '<td class="numero">' + registro.embalagens + '</td>' +
      '<td class="numero">' + formatarPeso(registro.peso) + '</td>'
    linha.addEventListener('click', () => {
      location.href = '/lote.html?id=' + registro.lote_id
    })
    lista.appendChild(linha)
  }

  const total = document.createElement('tr')
  total.className = 'total'
  total.innerHTML =
    '<td colspan="3">Total</td>' +
    '<td class="numero">' + totalEmbalagens + '</td>' +
    '<td class="numero">' + formatarPeso(totalPeso) + '</td>'
  lista.appendChild(total)
}

function montarFiltro() {
  const select = document.getElementById('filtro-produto')
  const nomes = [...new Set(registros.map((r) => r.produto))].sort()
  for (const nome of nomes) {
    const opcao = document.createElement('option')
    opcao.value = nome
    opcao.textContent = nome
    select.appendChild(opcao)
  }
}

async function carregarProducao() {
  try {
    registros = await api('GET', '/producao')
    montarFiltro()
    mostrarRegistros()
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão com o servidor.' : erro.message)
  }
}

document.getElementById('filtro-produto').addEventListener('change', mostrarRegistros)

carregarProducao()
