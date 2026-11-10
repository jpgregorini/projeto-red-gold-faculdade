async function carregarProdutos() {
  const lista = document.getElementById('lista-produtos')
  try {
    const produtos = await api('GET', '/produtos')
    lista.innerHTML = ''
    for (const produto of produtos) {
      const linha = document.createElement('tr')
      const status = produto.ativo
        ? '<span class="badge finalizado">Ativo</span>'
        : '<span class="badge inativo">Inativo</span>'
      linha.innerHTML =
        '<td>' + escapar(produto.nome) + '</td>' +
        '<td>' + status + '</td>' +
        '<td class="numero"><button class="secundario pequeno">' + (produto.ativo ? 'Desativar' : 'Ativar') + '</button></td>'
      linha.querySelector('button').addEventListener('click', async () => {
        try {
          await api('PUT', '/produtos/' + produto.id, { ativo: !produto.ativo })
          await carregarProdutos()
        } catch (erro) {
          mostrarErro('erro', semConexao(erro) ? 'Sem conexão: conecte-se para alterar.' : erro.message)
        }
      })
      lista.appendChild(linha)
    }
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão com o servidor.' : erro.message)
  }
}

document.getElementById('form-produto').addEventListener('submit', async (evento) => {
  evento.preventDefault()
  mostrarErro('erro', '')
  const campo = document.getElementById('nome')
  try {
    await api('POST', '/produtos', { nome: campo.value })
    campo.value = ''
    await carregarProdutos()
  } catch (erro) {
    mostrarErro('erro', semConexao(erro) ? 'Sem conexão: conecte-se para salvar.' : erro.message)
  }
})

carregarProdutos()
