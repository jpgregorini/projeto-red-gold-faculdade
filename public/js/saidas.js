async function carregarProdutos() {
  const select = document.getElementById('produto')
  try {
    const saldo = await api('GET', '/saldo')
    select.innerHTML = '<option value="">Selecione...</option>'
    for (const item of saldo) {
      if (item.embalagens <= 0 && item.peso <= 0) continue
      const opcao = document.createElement('option')
      opcao.value = item.produtoId
      opcao.textContent = item.produto + ' (' + item.embalagens + ' emb. / ' + formatarPeso(item.peso) + ')'
      select.appendChild(opcao)
    }
  } catch (erro) {
    select.innerHTML = '<option value="">Sem conexão</option>'
  }
}

async function carregarSaidas() {
  const lista = document.getElementById('lista-saidas')
  try {
    const saidas = await api('GET', '/saidas')
    if (saidas.length === 0) {
      lista.innerHTML = '<tr><td colspan="5" class="vazio">Nenhuma saída registrada.</td></tr>'
      return
    }
    lista.innerHTML = ''
    for (const saida of saidas) {
      const linha = document.createElement('tr')
      linha.innerHTML =
        '<td>' + formatarData(saida.data) + '</td>' +
        '<td>' + escapar(saida.produto) + '</td>' +
        '<td class="numero">' + saida.embalagens + '</td>' +
        '<td class="numero">' + formatarPeso(saida.peso) + '</td>' +
        '<td class="numero"><button class="secundario pequeno">Excluir</button></td>'
      linha.querySelector('button').addEventListener('click', async () => {
        if (!confirm('Excluir esta saída? O produto volta para o saldo.')) return
        try {
          await api('DELETE', '/saidas/' + saida.id)
          await carregarTudo()
        } catch (erro) {
          mostrarErro('erro', semConexao(erro) ? 'Sem conexão: conecte-se para excluir.' : erro.message)
        }
      })
      lista.appendChild(linha)
    }
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão com o servidor.' : erro.message)
  }
}

async function carregarTudo() {
  await carregarProdutos()
  await carregarSaidas()
}

document.getElementById('form-saida').addEventListener('submit', async (evento) => {
  evento.preventDefault()
  mostrarErro('erro', '')
  try {
    await api('POST', '/saidas', {
      produtoId: Number(document.getElementById('produto').value),
      embalagens: Number(document.getElementById('embalagens').value),
      peso: Number(document.getElementById('peso').value)
    })
    document.getElementById('embalagens').value = ''
    document.getElementById('peso').value = ''
    await carregarTudo()
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão: conecte-se para salvar.' : erro.message)
  }
})

carregarTudo()
