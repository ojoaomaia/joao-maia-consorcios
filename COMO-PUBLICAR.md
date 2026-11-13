# João Maia Consórcios: como colocar no ar e publicar artigos

O site é feito em Astro e fica hospedado na Netlify. Os artigos do blog são arquivos de texto guardados no seu GitHub. Quando um artigo novo entra no GitHub, a Netlify atualiza o site sozinha em cerca de 1 minuto.

Existem dois jeitos de publicar:

1. **Pelo painel** em `seusite.com.br/admin/`, entrando com a sua conta do GitHub.
2. **Pelo Claude**, que escreve o artigo e envia direto para o GitHub.

Só quem tem permissão de escrita no seu repositório consegue entrar no painel ou publicar. Não existe senha guardada no site, então não há senha para vazar.

---

## Parte 1. Colocar o site no ar (uma vez só, uns 20 minutos)

Estes passos usam o seu login, então precisam ser feitos por você.

### 1. GitHub

1. Entre em github.com com a conta **ojoaomaia**.
2. Ative a verificação em duas etapas: foto de perfil > Settings > Password and authentication > Enable two-factor authentication. Ela protege o painel, porque o login do painel é o login do GitHub.
3. Crie um repositório novo: botão **New**, nome `joao-maia-consorcios`, marque **Private** e clique em **Create repository**. Não marque nenhuma outra opção.
4. Envie os arquivos do projeto. O jeito mais simples é pedir ao Claude: depois de ligar o GitHub nas configurações do Claude, diga "envie o projeto para ojoaomaia/joao-maia-consorcios".

### 2. Netlify

1. Entre em app.netlify.com usando **Sign up with GitHub**.
2. Clique em **Add new site > Import an existing project > GitHub** e escolha `joao-maia-consorcios`.
3. A Netlify lê o arquivo `netlify.toml` e já sabe o que fazer. Só clique em **Deploy**.
4. Em 1 ou 2 minutos o site fica no ar em um endereço como `nome-aleatorio.netlify.app`.

### 3. Ligar o login do painel

1. No GitHub: foto de perfil > Settings > Developer settings > OAuth Apps > **New OAuth App**.
   - Application name: `Painel João Maia Consórcios`
   - Homepage URL: o endereço do site na Netlify (depois troque pelo domínio)
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. Clique em **Register application**, depois em **Generate a new client secret**. Copie o Client ID e o Client secret. Não mande esses códigos para ninguém, nem no chat.
3. Na Netlify: o seu site > **Site configuration > Access & security > OAuth > Install provider**. Escolha **GitHub** e cole o Client ID e o Client secret.
4. Teste: abra `seusite/admin/` e clique em **Entrar com GitHub**.

### 4. Domínio próprio

1. Na Netlify: **Domain management > Add a domain** e digite o domínio (exemplo: joaomaiaconsorcios.com.br).
2. A Netlify mostra onde apontar o domínio. No registro.br, troque os servidores DNS pelos que a Netlify indicar.
3. O certificado de segurança (cadeado HTTPS) é criado sozinho.
4. O login do painel continua funcionando no domínio próprio. Só atualize a Homepage URL do OAuth App no GitHub para o domínio novo.

### 5. Preencher os dados que faltam

Os campos estão no começo do arquivo `public/assets/site.js`:

- `WA_NUMBER`: o seu WhatsApp com DDI e DDD, só números (exemplo 5516999999999)
- `GA_ID`: o código do Google Analytics (opcional)
- `IG_URL`: o link do seu Instagram

Mande esses dados para o Claude que ele atualiza e publica.

---

## Parte 2. Publicar artigos

### Pelo painel

1. Abra `seusite/admin/` e entre com o GitHub.
2. Clique em **Novo Artigo**, preencha os campos e escreva o texto.
3. Para publicar, desmarque **Rascunho** e clique em **Publicar**. Em cerca de 1 minuto o artigo aparece no site.

### Pelo Claude

Depois que o GitHub estiver ligado ao Claude, basta pedir, por exemplo: "escreva e publique um artigo sobre consórcio de carro usado". O Claude:

1. Escreve o artigo seguindo as regras de SEO (mínimo de 1.000 palavras, palavra-chave de 5 a 7 vezes, descrição até 150 caracteres).
2. Cria o arquivo em `src/content/blog/nome-do-artigo.md`.
3. Envia para o GitHub. A Netlify publica sozinha.

Se preferir revisar antes, peça "deixe como rascunho". O artigo vai com `draft: true` e só aparece no site quando você desmarcar Rascunho no painel.

### Links entre matérias (para aumentar as páginas vistas)

O site coloca sozinho, em toda matéria:

- **2 blocos "Leia também"** no meio do texto, com capa e botão "Ler agora". Eles mostram matérias da mesma categoria primeiro e nunca repetem uma matéria que já está linkada no texto.
- **Botão vermelho "Próxima matéria"** no fim, antes do autor.
- **Grade "Leia também"** com mais 4 matérias no final.

Para colocar um link de destaque num ponto específico do texto, escreva o link **sozinho num parágrafo**, assim:

```markdown
[Consórcio de carro vale a pena? Parcela, custo e quando compensa](/blog/consorcio-de-carro/)
```

Ele vira um botão com borda vermelha e o rótulo "Leia também". Links dentro de uma frase continuam como link normal.

**Regra para o Claude ao escrever matérias:** inclua de 2 a 3 links para outras matérias do blog. Pelo menos 1 deve ser um link sozinho num parágrafo, logo depois do trecho que fala do mesmo assunto. Os cliques aparecem no Google Analytics como o evento `link_interno`.

### Formato do arquivo de artigo

```markdown
---
title: "Título do artigo (10 a 110 caracteres)"
seo_title: "Título para o Google, até 70 caracteres (opcional)"
summary: "Resumo que aparece no Google, de 40 a 160 caracteres."
date: 2026-11-11
category: imovel        # imovel, veiculo, lance ou comparativo
keyword: "palavra-chave principal"
draft: false
faq:
  - q: "Pergunta?"
    a: "Resposta."
---

Texto do artigo em Markdown. Use ## para subtítulos e - para listas.
```

Se algum campo estiver fora da regra, a Netlify não publica e o site antigo continua no ar. Nada quebra.

---

## Segurança aplicada

- Login do painel pelo GitHub, com verificação em duas etapas. Só quem tem acesso ao repositório publica.
- Nenhuma senha ou chave guardada no site.
- Proteção contra código malicioso (CSP): o site só roda scripts dele mesmo, da biblioteca da animação e do Google Analytics.
- A biblioteca da animação é conferida por assinatura (SRI). Se alguém alterar o arquivo na origem, o navegador recusa.
- O site e o painel não abrem dentro de outro site (proteção contra clique falso).
- O painel não aparece no Google e não fica guardado em cache.
- Rascunhos não são publicados.
- O teste do consórcio só envia dados com o consentimento marcado (LGPD), e o Google Analytics só liga depois do aceite de cookies.
- Testes automáticos em `dev/testes-seguranca.cjs` (30 verificações).
