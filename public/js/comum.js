const paginas = [
  { arquivo: 'index.html', nome: 'Lotes' },
  { arquivo: 'produtos.html', nome: 'Produtos' },
  { arquivo: 'producao.html', nome: 'Produção' },
  { arquivo: 'saidas.html', nome: 'Saídas' },
  { arquivo: 'saldo.html', nome: 'Saldo' }
]

function montarMenu() {
  const menu = document.getElementById('menu')
  const atual = location.pathname.split('/').pop() || 'index.html'
  for (const pagina of paginas) {
    const link = document.createElement('a')
    link.href = '/' + pagina.arquivo
    link.textContent = pagina.nome
    if (pagina.arquivo === atual || (atual === 'lote.html' && pagina.arquivo === 'index.html')) {
      link.className = 'ativo'
    }
    menu.appendChild(link)
  }
}

async function api(metodo, caminho, dados) {
  const opcoes = { method: metodo, headers: {} }
  if (dados) {
    opcoes.headers['Content-Type'] = 'application/json'
    opcoes.body = JSON.stringify(dados)
  }
  const resposta = await fetch('/api' + caminho, opcoes)
  if (resposta.status === 204) {
    return null
  }
  const corpo = await resposta.json()
  if (!resposta.ok) {
    throw new Error(corpo.erro || 'Erro no servidor')
  }
  return corpo
}

function semConexao(erro) {
  return erro instanceof TypeError || !navigator.onLine
}

function formatarPeso(valor) {
  if (valor === null || valor === undefined) {
    return '-'
  }
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kg'
}

function formatarPercentual(valor) {
  if (valor === null || valor === undefined) {
    return '-'
  }
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}

function formatarData(iso) {
  const data = new Date(iso)
  return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function escapar(texto) {
  const div = document.createElement('div')
  div.textContent = texto
  return div.innerHTML
}

function badgeStatus(status) {
  let classe = 'recebendo'
  if (status === 'Em processamento') classe = 'processando'
  if (status === 'Finalizado') classe = 'finalizado'
  return '<span class="badge ' + classe + '">' + status + '</span>'
}

function mostrarErro(id, mensagem) {
  const elemento = document.getElementById(id)
  elemento.textContent = mensagem || ''
  elemento.hidden = !mensagem
}

function atualizarConexao() {
  document.getElementById('aviso-offline').hidden = navigator.onLine
}

let pedidoInstalacao = null

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault()
  pedidoInstalacao = evento
  document.getElementById('botao-instalar').hidden = false
})

window.addEventListener('appinstalled', () => {
  pedidoInstalacao = null
  document.getElementById('botao-instalar').hidden = true
})

document.addEventListener('DOMContentLoaded', () => {
  montarMenu()
  atualizarConexao()
  window.addEventListener('online', atualizarConexao)
  window.addEventListener('offline', atualizarConexao)

  document.getElementById('botao-instalar').addEventListener('click', async () => {
    if (!pedidoInstalacao) return
    await pedidoInstalacao.prompt()
    pedidoInstalacao = null
    document.getElementById('botao-instalar').hidden = true
  })

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
})
