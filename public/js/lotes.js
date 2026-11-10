async function carregarLotes() {
  const lista = document.getElementById('lista-lotes')
  try {
    const lotes = await api('GET', '/lotes')
    mostrarErro('erro', '')
    if (lotes.length === 0) {
      lista.innerHTML = '<tr><td colspan="8" class="vazio">Nenhum lote ainda. Clique em "Novo recebimento".</td></tr>'
      return
    }
    lista.innerHTML = ''
    for (const lote of lotes) {
      const linha = document.createElement('tr')
      linha.className = 'link'
      linha.innerHTML =
        '<td>Lote ' + lote.id + '</td>' +
        '<td>' + formatarData(lote.chegada) + '</td>' +
        '<td class="numero">' + lote.quantidadeQuartos + '</td>' +
        '<td class="numero">' + formatarPeso(lote.pesoChegada) + '</td>' +
        '<td class="numero">' + formatarPeso(lote.pesoPerda) + '</td>' +
        '<td class="numero">' + formatarPercentual(lote.percentualPerda) + '</td>' +
        '<td class="numero">' + formatarPeso(lote.pesoFinal) + '</td>' +
        '<td>' + badgeStatus(lote.status) + '</td>'
      linha.addEventListener('click', () => {
        location.href = '/lote.html?id=' + lote.id
      })
      lista.appendChild(linha)
    }
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão com o servidor.' : erro.message)
  }
}

document.getElementById('botao-novo-lote').addEventListener('click', async () => {
  try {
    const lote = await api('POST', '/lotes')
    location.href = '/lote.html?id=' + lote.id
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'É preciso estar conectado para abrir um recebimento.' : erro.message)
  }
})

carregarLotes()
