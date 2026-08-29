# 🎨 Chromatica

> Uma ferramenta interativa para explorar a teoria das cores, criar harmonias e montar paletas de forma visual.

🔗 **Demo online:** https://gustavoborgesz.github.io/roda-de-cores-repo/

## ✨ Sobre o projeto

O **Chromatica** é uma aplicação web desenvolvida para facilitar o estudo e a experimentação com cores. A ferramenta permite selecionar cores diretamente em uma roda cromática, ajustar seus valores e gerar diferentes tipos de harmonias automaticamente.

O projeto foi construído com **HTML, CSS e JavaScript puro**, sem frameworks ou bibliotecas externas.

## 🚀 Funcionalidades

### 🎨 Manipulação de cores

- Roda de cores interativa
- Seleção de cores com mouse ou toque
- Navegação básica pelo teclado
- Controle de saturação
- Controle de luminosidade
- Geração de cores aleatórias
- Inserção manual de códigos HEX
- Conversão automática entre:
  - HEX
  - RGB
  - HSL
- Identificação aproximada da cor selecionada

### 🌈 Harmonias de cores

O Chromatica gera automaticamente diferentes combinações:

- Complementar
- Análoga
- Triádica
- Complementar dividida
- Tetrádica
- Monocromática

### 🖼️ Extração de cores de imagens

É possível enviar uma imagem para a ferramenta e extrair cores dominantes.

Fluxo:

1. Envie ou arraste uma imagem.
2. A ferramenta analisa os pixels.
3. As cores predominantes são exibidas.
4. Clique em uma delas para utilizá-la como cor base.

### 📋 Paletas

- Geração automática de paletas
- Copiar cores individualmente
- Copiar a paleta completa
- Salvar paletas favoritas
- Excluir paletas salvas
- Armazenamento local utilizando `localStorage`

As paletas salvas permanecem disponíveis no navegador mesmo após atualizar a página.

### ↶ Histórico

A ferramenta possui:

- Desfazer alterações
- Refazer alterações
- Atalho `Ctrl + Z`
- Histórico de alterações de cores

### 🌙 Interface

- Tema escuro
- Tema claro
- Layout responsivo
- Suporte para desktop e dispositivos móveis
- Feedback visual através de notificações

## 🛠️ Tecnologias utilizadas

O projeto foi desenvolvido utilizando tecnologias web nativas:

- **HTML5** — estrutura da aplicação
- **CSS3** — interface, responsividade e temas
- **JavaScript (ES6+)** — interatividade e lógica

Nenhum framework externo é necessário.

## 📁 Estrutura do projeto

```text
roda-de-cores-repo/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

### Responsabilidade dos arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | Estrutura da interface |
| `style.css` | Estilos, layout e responsividade |
| `script.js` | Lógica da roda, harmonias e funcionalidades |
| `README.md` | Documentação do projeto |

## ▶️ Como executar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/GustavoBorgesz/roda-de-cores-repo.git
```

### 2. Entre na pasta

```bash
cd roda-de-cores-repo
```

### 3. Execute

Você pode abrir o arquivo:

```text
index.html
```

diretamente no navegador.

### Recomendado: Live Server

Para uma experiência melhor:

1. Abra o projeto no **Visual Studio Code**
2. Instale a extensão **Live Server**
3. Clique com o botão direito em `index.html`
4. Selecione **Open with Live Server**

O projeto será aberto em um endereço semelhante a:

```text
http://127.0.0.1:5500
```

## 🌐 Versão online

O projeto está hospedado utilizando **GitHub Pages**.

🔗 https://gustavoborgesz.github.io/roda-de-cores-repo/

Sempre que alterações são enviadas para a branch `main`, o GitHub Pages pode publicar automaticamente a nova versão.

## 🎯 Objetivo

Este projeto foi desenvolvido como uma ferramenta prática para estudar:

- Teoria das cores
- Harmonias cromáticas
- Design de interfaces
- Desenvolvimento Front-End
- Manipulação de cores com JavaScript
- Interações com DOM
- Armazenamento local
- Responsividade

Também pode ser utilizado como ferramenta auxiliar em projetos de:

- 🎨 Design gráfico
- 💻 Desenvolvimento web
- 📱 UI/UX
- 🎮 Desenvolvimento de jogos
- 🖌️ Ilustração
- 📢 Marketing e branding

## 🗺️ Possíveis melhorias futuras

Algumas ideias para próximas versões:

- [ ] Exportar paletas em PNG
- [ ] Exportar paletas em CSS
- [ ] Gerar gradientes automaticamente
- [ ] Análise de contraste WCAG
- [ ] Sugestões de cores para texto
- [ ] Compartilhamento de paletas por URL
- [ ] Sistema de favoritos sincronizado
- [ ] Histórico visual de paletas
- [ ] Gerador de paletas baseado em inteligência artificial
- [ ] Suporte a outros espaços de cor

## 📄 Licença

Projeto desenvolvido para fins de estudo e portfólio.

---

<div align="center">

**Chromatica 🎨**

Explore • Experimente • Crie

</div>