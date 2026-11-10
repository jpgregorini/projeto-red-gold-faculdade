# Red Gold - Controle de Estoque (PWA)

Sistema web para controlar o estoque da Red Gold Food Brasil, uma empresa que recebe
carne bovina em quartos, processa em cortes e vende o produto embalado.

O sistema funciona como um PWA (Progressive Web App): pode ser instalado no celular
ou no computador e continua abrindo mesmo sem internet.

## Como rodar

Precisa do Node.js 22 ou mais novo.

```
npm install
npm start
```

Depois abra http://localhost:3000 no navegador.

O banco de dados é um arquivo SQLite (`dados.db`) criado sozinho na primeira vez que
o servidor roda. Os produtos iniciais também são cadastrados nessa hora.

## O que o sistema faz

**Lotes:** cada descarga de caminhão é um lote. O lote passa por três etapas:

1. **Recebendo:** o funcionário lança cada quarto (dianteiro ou traseiro) com o peso da
   balança. Essa tela funciona sem internet: os quartos ficam guardados no aparelho e são
   enviados quando a conexão volta.
2. **Em processamento:** depois de concluir o recebimento, o lote recebe os lançamentos
   de produção (produto, embalagens e peso) e o peso da perda (ossos e sebo).
3. **Finalizado:** com a perda informada o lote pode ser finalizado e não aceita mais
   alterações. Ele pode ser reaberto se precisar corrigir algo.

Para cada lote o sistema calcula o peso de chegada, o percentual de perda e o peso final.

**Produtos:** cadastro dos cortes que a empresa produz. Produto inativo não aparece para
lançar produção.

**Produção:** lista de tudo que foi produzido, com filtro por produto.

**Saídas:** registro das vendas. Não deixa vender mais do que tem em estoque.

**Saldo:** quanto tem de cada produto, em embalagens e em quilos
(produção menos saídas).

## PWA

- `public/manifest.json` descreve o app (nome, ícones, cor) para o navegador oferecer a
  instalação.
- `public/sw.js` é o service worker. Ele guarda as páginas, o CSS e o JS em cache na
  instalação e responde com o cache quando a rede falha. As respostas da API também ficam
  em cache, então as telas abrem com os últimos dados vistos.
- O botão "Instalar app" aparece no topo quando o navegador permite a instalação.
- A faixa amarela avisa quando o aparelho está sem conexão.

## Tecnologias

- Node.js com Express na API
- SQLite (módulo `node:sqlite`, que já vem no Node)
- HTML, CSS e JavaScript puro no front

## Estrutura

```
server.js          inicia o servidor e registra as rotas
banco.js           abre o banco e cria as tabelas
rotas/             uma rota da API por assunto
public/            arquivos do front
  css/estilo.css
  js/comum.js      funções usadas em todas as páginas
  js/*.js          um arquivo por página
  manifest.json
  sw.js
  icones/
```
