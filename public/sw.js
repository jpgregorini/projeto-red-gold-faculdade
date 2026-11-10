const NOME_CACHE = 'red-gold-estoque-v1'

const ARQUIVOS = [
  '/',
  '/index.html',
  '/lote.html',
  '/produtos.html',
  '/producao.html',
  '/saidas.html',
  '/saldo.html',
  '/css/estilo.css',
  '/js/comum.js',
  '/js/lotes.js',
  '/js/lote.js',
  '/js/produtos.js',
  '/js/producao.js',
  '/js/saidas.js',
  '/js/saldo.js',
  '/manifest.json',
  '/icones/icone-192.png',
  '/icones/icone-512.png'
]

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOME_CACHE).then((cache) => cache.addAll(ARQUIVOS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes.filter((nome) => nome !== NOME_CACHE).map((nome) => caches.delete(nome))
      )
    })
  )
  self.clients.claim()
})

async function buscarNaRedePrimeiro(requisicao) {
  const cache = await caches.open(NOME_CACHE)
  try {
    const resposta = await fetch(requisicao)
    if (resposta.ok) {
      cache.put(requisicao, resposta.clone())
    }
    return resposta
  } catch (erro) {
    const salva = await cache.match(requisicao)
    if (salva) {
      return salva
    }
    return new Response(JSON.stringify({ erro: 'Sem conexão' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function buscarNoCachePrimeiro(requisicao) {
  const salva = await caches.match(requisicao, { ignoreSearch: true })
  if (salva) {
    return salva
  }
  return fetch(requisicao)
}

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') {
    return
  }
  const url = new URL(evento.request.url)
  if (url.pathname.startsWith('/api/')) {
    evento.respondWith(buscarNaRedePrimeiro(evento.request))
  } else {
    evento.respondWith(buscarNoCachePrimeiro(evento.request))
  }
})
