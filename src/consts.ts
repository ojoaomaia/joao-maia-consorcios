/* Textos e listas usados em várias páginas */
export const SITE_NOME = 'João Maia Consórcios';
export const ENDERECO = 'Rua Adolfo Serra, 1145, Alto da Boa Vista, Ribeirão Preto, SP, 14025-520';
export const MAPS = 'https://www.google.com/maps/search/?api=1&query=Rua+Adolfo+Serra%2C+1145%2C+Alto+da+Boa+Vista%2C+Ribeir%C3%A3o+Preto+SP';

export const CATS: Record<string, string> = {
  imovel: 'Consórcio de imóvel',
  veiculo: 'Consórcio de veículo',
  lance: 'Lance e contemplação',
  comparativo: 'Consórcio x financiamento'
};

/* Ícones das capas do blog, no mesmo traço neon da animação */
export const ICONS: Record<string, string> = {
  imovel: '<svg class="ic" viewBox="0 0 120 100" aria-hidden="true"><path d="M14 52 60 14l46 38"/><path d="M24 44v46h72V44"/><path d="M50 90V64h20v26"/><path d="M76 56h12v12H76z"/><path d="M80 24v-8h10v16"/><path d="M6 90h108"/></svg>',
  veiculo: '<svg class="ic" viewBox="0 0 120 100" aria-hidden="true"><path d="M8 64v-12l10-4 18-14h40l20 14 14 4v12"/><path d="M8 64h12M44 64h32M100 64h12"/><circle cx="32" cy="66" r="10"/><circle cx="88" cy="66" r="10"/><path d="M42 36h30l14 12H36z"/><path d="M112 54h-6"/><path d="M4 82h112"/></svg>',
  lance: '<svg class="ic" viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="44" cy="70" rx="26" ry="8"/><path d="M18 70v-10M70 70v-10"/><ellipse cx="44" cy="60" rx="26" ry="8"/><ellipse cx="44" cy="46" rx="26" ry="8"/><path d="M18 46v6M70 46v6"/><path d="M84 66V24"/><path d="M72 36l12-12 12 12"/><path d="M100 66V44M108 66V52"/></svg>',
  comparativo: '<svg class="ic" viewBox="0 0 120 100" aria-hidden="true"><path d="M60 12v78"/><path d="M30 90h60"/><path d="M14 30h92"/><path d="M24 30 10 62h28z"/><path d="M96 30 82 62h28z"/><path d="M10 62a14 8 0 0 0 28 0M82 62a14 8 0 0 0 28 0"/><circle cx="60" cy="12" r="4"/></svg>'
};

/* Chamada no fim de cada artigo, ligada ao tema: [título, apoio, mensagem do WhatsApp]. {t} = título do artigo.
   Vale primeiro o nome do arquivo do artigo (slug); se não houver, vale a categoria. */
export const CTA_TXT: Record<string, [string, string, string, string?]> = {
  'como-funciona-o-lance-no-consorcio': ['Quer este guia resumido em 1 página?', 'Os três tipos de lance, como chegar ao valor e os erros mais comuns, num PDF para salvar no celular. Eu te mando no WhatsApp.', 'Olá João! Li o artigo sobre lance e quero receber o guia do lance em 1 página.', 'Receber o guia'],
  'consorcio-ou-financiamento': ['Quer comparar com os seus números?', 'Me diga o valor do bem e eu mostro lado a lado consórcio e financiamento.', 'Olá João! Li o artigo "{t}" e quero comparar consórcio e financiamento no meu caso.'],
  'fgts-no-consorcio-de-imovel': ['Quer saber se o seu FGTS entra no plano?', 'Eu confiro as regras com você e mostro onde o saldo pode ajudar: no lance ou na compra.', 'Olá João! Li o artigo sobre FGTS e quero saber se posso usar o meu no consórcio.'],
  'parcela-atrasada-no-consorcio': ['Está com parcela em atraso?', 'Me chama que eu te ajudo a ver o caminho para regularizar e voltar às assembleias.', 'Olá João! Li o artigo sobre parcela atrasada e preciso de ajuda com o meu consórcio.'],
  'consorcio-de-carro': ['Quer trocar de carro sem pagar juros?', 'Eu simulo a parcela do carro que você quer e mostro a estratégia de lance para antecipar.', 'Olá João! Li o artigo sobre consórcio de carro e quero uma simulação.'],
  'consorcio-com-nome-sujo': ['Está com o nome negativado e quer um consórcio?', 'Eu te explico como funciona a análise e monto um plano para a carta sair sem travar.', 'Olá João! Li o artigo sobre consórcio com nome sujo e quero entender o meu caso.'],
  'quanto-tempo-demora-para-ser-contemplado': ['Quer uma previsão realista da sua contemplação?', 'Eu olho os números do grupo com você e mostro a estratégia de lance que faz sentido.', 'Olá João! Li o artigo sobre quanto tempo demora para ser contemplado e quero planejar o meu caso.'],
  '13-salario-para-dar-lance-no-consorcio': ['Quer usar o seu 13º no lance?', 'Eu olho o histórico do grupo com você e mostro quanto faz sentido ofertar.', 'Olá João! Li o artigo sobre usar o 13º salário no lance e quero montar uma estratégia.'],
  'consorcio-e-furada': ['Quer saber se o consórcio combina com você?', 'Eu te digo com honestidade, inclusive se não for o melhor caminho agora.', 'Olá João! Li o artigo "Consórcio é furada?" e quero saber se o consórcio faz sentido para mim.'],
  'consorcio-de-200-mil-parcela': ['Quer ver a sua carta de 200 mil na prática?', 'Eu simulo parcela, prazo e estratégia de lance com os seus números, sem compromisso.', 'Olá João! Li o artigo sobre consórcio de 200 mil e quero uma simulação para o meu caso.'],
  'cat-imovel': ['Quer ver o consórcio de imóvel no seu caso?', 'Eu monto a simulação com você, sem compromisso.', 'Olá João! Li o artigo "{t}" e quero uma simulação de consórcio de imóvel.'],
  'cat-veiculo': ['Quer ver o consórcio de veículo no seu caso?', 'Eu monto a simulação com você, sem compromisso.', 'Olá João! Li o artigo "{t}" e quero uma simulação de consórcio de veículo.'],
  'cat-lance': ['Quer montar a sua estratégia de lance?', 'Eu olho o histórico do grupo com você.', 'Olá João! Li o artigo "{t}" e quero montar uma estratégia de lance.'],
  'cat-comparativo': ['Quer comparar com os seus números?', 'Eu mostro lado a lado, sem compromisso.', 'Olá João! Li o artigo "{t}" e quero comparar no meu caso.'],
  padrao: ['Quer ver isso no seu caso?', 'Eu monto a simulação com estratégia de lance, sem compromisso.', 'Olá João! Li o artigo "{t}" e quero uma simulação.']
};

export const fmtData = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

/* Anúncios do Google AdSense. Deixe false até o Google aprovar o site.
   Quando aprovar, troque para true e os espaços de anúncio voltam a aparecer no blog. */
export const ANUNCIOS = false;

/* Códigos de verificação dos buscadores (Google Search Console e Bing Webmaster Tools). */
export const VERIFICACAO_GOOGLE = 'H7vUXMtqsp4WKw0JyHaYBpAfqLsPRKsk3mrheP2SrjI';
export const VERIFICACAO_BING = '394B8CBC20635EA4E1ACE01EE54808F2';
/* Chave do IndexNow: avisa Bing e outros buscadores sempre que o site é publicado. */
export const INDEXNOW_KEY = 'ee037d59377a2c14fc5dda96bf675d1e';
