async function carregarSaldo() {
  const lista = document.getElementById('lista-saldo')
  try {
    const saldo = await api('GET', '/saldo')
    if (saldo.length === 0) {
      lista.innerHTML = '<tr><td colspan="3" class="vazio">Nenhum produto em estoque.</td></tr>'
      return
    }
    let totalEmbalagens = 0
    let totalPeso = 0
    lista.innerHTML = ''
    for (const item of saldo) {
      totalEmbalagens += item.embalagens
      totalPeso += item.peso
      const linha = document.createElement('tr')
      const inativo = item.ativo ? '' : ' <span class="badge inativo">Inativo</span>'
      linha.innerHTML =
        '<td>' + escapar(item.produto) + inativo + '</td>' +
        '<td class="numero">' + item.embalagens + '</td>' +
        '<td class="numero">' + formatarPeso(item.peso) + '</td>'
      lista.appendChild(linha)
    }
    const total = document.createElement('tr')
    total.className = 'total'
    total.innerHTML =
      '<td>Total</td>' +
      '<td class="numero">' + totalEmbalagens + '</td>' +
      '<td class="numero">' + formatarPeso(totalPeso) + '</td>'
    lista.appendChild(total)
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão com o servidor.' : erro.message)
  }
}

carregarSaldo()
