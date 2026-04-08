<img width="106" height="106" alt="mackenzie" src="https://github.com/user-attachments/assets/aff37f26-35da-4179-bb67-44abd67710b0" />

# UNIVERSIDADE PRESBITERIANA MACKENZIE

## Curso de Analise e Desenvolvimento de Sistemas

### Academia Finder: guia do usuario e documentacao tecnico-funcional

Alan Araujo Paiva - RA 10423944  
Felipe Amorim - RA 10441136  
Ricardo Pereira - RA 10442905

Sao Paulo  
2026

## Sumario

1. [Apresentacao](#1-apresentacao)
2. [Objetivos do sistema](#2-objetivos-do-sistema)
3. [Visao geral da solucao](#3-visao-geral-da-solucao)
4. [Publico-alvo](#4-publico-alvo)
5. [Requisitos para utilizacao](#5-requisitos-para-utilizacao)
6. [Instalacao e execucao](#6-instalacao-e-execucao)
7. [Guia de uso do aplicativo](#7-guia-de-uso-do-aplicativo)
8. [Detalhes tecnicos da implementacao](#8-detalhes-tecnicos-da-implementacao)
9. [Estrutura do projeto](#9-estrutura-do-projeto)
10. [API e integracoes](#10-api-e-integracoes)
11. [Banco de dados](#11-banco-de-dados)
12. [Limitacoes conhecidas](#12-limitacoes-conhecidas)
13. [Boas praticas de operacao](#13-boas-praticas-de-operacao)
14. [Solucao de problemas](#14-solucao-de-problemas)
15. [Conclusao](#15-conclusao)
16. [Referencias](#16-referencias)

## 1. Apresentacao

O Academia Finder e uma aplicacao web desenvolvida com a finalidade de permitir a descoberta de academias, comparacao entre opcoes disponiveis, consulta visual em mapa, registro de agendamentos e envio de avaliacoes. O sistema foi construido com interface em React e servicos de backend em Node.js com Express, utilizando Supabase como camada de persistencia de dados e Cloudinary para fornecimento de imagens.

Este documento foi elaborado no formato de manual do usuario com apoio tecnico, reunindo informacoes nao tecnicas, instrucoes operacionais e descricao da arquitetura realmente implementada no repositorio.

## Diagrama de Implantacao

<img width="1800" height="1050" alt="academiafinder_diagrama_implantacao_bonito" src="https://github.com/user-attachments/assets/305b9550-b750-4bd5-8b97-4df7acef2b82" />

## 2. Objetivos do sistema

O sistema possui os seguintes objetivos principais:

- permitir que o usuario encontre academias proximas;
- oferecer consulta rapida de preco, endereco, distancia estimada e avaliacao;
- disponibilizar comparacao entre academias selecionadas;
- registrar agendamentos de visitas, aulas experimentais e atendimentos;
- armazenar avaliacoes e comentarios do usuario;
- apresentar uma experiencia responsiva voltada principalmente para uso em interface mobile.

## 3. Visao geral da solucao

O Academia Finder funciona em dois blocos principais:

- `Frontend`: interface do usuario desenvolvida em React com Vite;
- `Backend`: API REST em Node.js e Express integrada ao Supabase.

O fluxo operacional padrao ocorre da seguinte maneira:

1. o usuario realiza login com credenciais demonstrativas;
2. o frontend consulta a API para obter academias, agendamentos e avaliacoes;
3. a interface organiza os dados em telas de inicio, detalhes, comparacao, agenda e perfil;
4. o usuario pode registrar novos agendamentos e avaliacoes;
5. o backend persiste os dados no Supabase e devolve o resultado para atualizacao da interface.

## 4. Publico-alvo

Este aplicativo foi projetado para:

- usuarios finais que desejam localizar academias e comparar alternativas;
- avaliadores academicos e docentes que precisem demonstrar as funcionalidades do projeto;
- desenvolvedores e mantenedores responsaveis pela evolucao da aplicacao.

## 5. Requisitos para utilizacao

### 5.1 Requisitos de software

- Node.js 20 ou superior;
- npm 10 ou superior;
- navegador web atualizado, preferencialmente Google Chrome, Microsoft Edge ou Firefox;
- acesso a internet para consumo de mapas, geolocalizacao e servicos externos.

### 5.2 Requisitos de servicos externos

- projeto Supabase com as tabelas `usuarios`, `academias`, `agendamentos` e `avaliacoes`;
- conta Cloudinary, recomendada para fornecimento das imagens das academias;
- acesso ao servico Nominatim, utilizado para geocodificacao de enderecos.

### 5.3 Requisitos de hardware e uso

- computador com acesso local ao repositorio para execucao em ambiente de desenvolvimento;
- permissao do navegador para geolocalizacao, caso o usuario queira visualizar distancias e mapa com foco em sua posicao.

## 6. Instalacao e execucao

### 6.1 Configuracao do backend

No diretorio `Backend`, instalar dependencias e iniciar o servidor:

```bash
cd Backend
npm install
npm run dev
```

Por padrao, o backend e iniciado em `http://localhost:3000`.

### 6.2 Configuracao do frontend

No diretorio `Frontend`, instalar dependencias e iniciar a interface:

```bash
cd Frontend
npm install
npm run dev
```

Por padrao, o frontend e iniciado em `http://localhost:5173`.

### 6.3 Variaveis de ambiente

O frontend pode utilizar o arquivo `.env` com a variavel:

```env
VITE_API_URL=http://localhost:3000
```

O backend aceita configuracoes por variaveis de ambiente, especialmente para deploy:

```env
SUPABASE_URL=https://aedkngafdsexqblzfuhv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=SUA_ANON_KEY
CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
CLOUDINARY_API_KEY=SUA_API_KEY
CLOUDINARY_API_SECRET=SUA_API_SECRET
CLOUDINARY_ASSET_FOLDER=Assets
CORS_ORIGIN=http://localhost:5173
```

Observacao tecnica: para uso real em producao, recomenda-se manter todas as credenciais em variaveis de ambiente, revogar chaves expostas anteriormente e usar `SUPABASE_SERVICE_ROLE_KEY` apenas no backend. A chave `SUPABASE_ANON_KEY` deve ser tratada como publica e nao substitui a protecao por Row Level Security.

### 6.4 Credenciais de demonstracao

Para acesso de demonstracao, utilizar:

- login: `teste`
- senha: `teste`

### 6.5 Publicacao na Vercel

Ambiente publicado:

- `https://academiafinder-web.vercel.app/`

## 7. Guia de uso do aplicativo

### 7.1 Tela de login

Ao abrir a aplicacao, o usuario encontra a tela de autenticacao. Nela, devem ser informados o login e a senha de demonstracao. Em caso de dados incorretos, a interface exibe mensagem de erro. Em caso de sucesso, o sistema cria ou recupera um usuario de teste no banco de dados e libera o acesso ao aplicativo.

### 7.2 Tela inicial

A tela inicial apresenta:

- mensagem de boas-vindas;
- campo de busca por bairro, cidade ou endereco;
- chips de filtragem por categoria ou modalidade;
- quantidade de academias encontradas;
- mapa em tempo real com foco na cidade de Sao Paulo e tentativa de localizacao do usuario;
- lista de academias em formato de cartoes.

Cada cartao de academia informa:

- nome;
- nota de avaliacao;
- endereco;
- modalidades principais;
- preco mensal;
- botoes de `Detalhes` e `Agendar`.

### 7.3 Busca e filtros

O campo de busca compara o texto digitado com nome, endereco, bairro e cidade. O filtro por categoria considera as modalidades cadastradas em cada academia. O comportamento e cumulativo, ou seja, o sistema aplica busca textual e categoria ao mesmo tempo.

### 7.4 Mapa em tempo real

O mapa utiliza OpenLayers e OpenStreetMap. Quando a permissao de geolocalizacao e concedida pelo navegador, a aplicacao acompanha a posicao do usuario e atualiza a visualizacao. As academias sao convertidas em pontos com base na geocodificacao de seus enderecos.

Caso a geolocalizacao nao esteja disponivel, o mapa permanece com foco padrao em Sao Paulo.

### 7.5 Tela de detalhes

Ao selecionar `Detalhes`, o usuario visualiza uma tela dedicada a academia escolhida, contendo:

- imagem principal;
- nome da academia;
- endereco;
- avaliacao;
- distancia estimada;
- preco mensal.

Nessa tela tambem existe a acao `Agendar nesta academia`, que direciona o usuario para o fluxo de agendamento.

### 7.6 Tela de comparacao

Na aba `Comparar`, o aplicativo permite manter ate quatro academias para analise lado a lado. O usuario pode:

- remover academias ja selecionadas;
- adicionar novas academias disponiveis;
- consultar comparacao por preco, avaliacao, distancia e endereco;
- identificar automaticamente o melhor custo-beneficio calculado pela aplicacao.

O calculo do melhor custo-beneficio considera uma relacao simples entre nota e preco, sendo uma heuristica de apoio, nao uma recomendacao definitiva.

### 7.7 Tela de agenda

Na aba `Agenda`, o sistema disponibiliza:

- selecao da academia desejada;
- calendario mensal;
- tipos de atendimento, como aula experimental, visita guiada, avaliacao fisica e treino funcional;
- horarios disponiveis com indicacao de vagas;
- resumo do agendamento antes da confirmacao.

Ao confirmar, o sistema envia para a API os campos de usuario, academia, data, horario e tipo. Em caso de sucesso, a interface exibe mensagem de confirmacao.

### 7.8 Tela de perfil

Na aba `Perfil`, o usuario encontra:

- identificacao visual e dados basicos;
- resumo de quantidade de agendamentos, avaliacoes e academias;
- listagem de seus agendamentos;
- formulario de envio de avaliacao;
- historico de avaliacoes registradas;
- secoes de privacidade, LGPD, ajuda e suporte.

Para avaliar uma academia, o usuario seleciona a academia, define uma nota de 1 a 5 e informa um comentario opcional.

### 7.9 Encerramento da sessao

O botao `Sair`, exibido na barra superior da aplicacao, limpa os estados locais da sessao e retorna o usuario para a tela de login.

## 8. Detalhes tecnicos da implementacao

### 8.1 Frontend

O frontend foi desenvolvido com:

- React 19;
- Vite 8;
- CSS customizado;
- OpenLayers para mapa;
- Lucide React para iconografia.

A principal logica da interface encontra-se em [`Frontend/src/App.jsx`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Frontend/src/App.jsx), arquivo responsavel por:

- autenticar o usuario;
- carregar academias, agendamentos e avaliacoes;
- calcular medias de avaliacao;
- calcular distancias com base em geolocalizacao e geocodificacao;
- controlar a navegacao entre telas;
- enviar novos agendamentos e avaliacoes.

O consumo da API esta centralizado em [`Frontend/src/services/api.js`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Frontend/src/services/api.js).

### 8.2 Backend

O backend foi desenvolvido com:

- Node.js;
- Express 5;
- Supabase JavaScript SDK;
- Cloudinary SDK;
- CORS e dotenv.

O ponto de entrada efetivamente utilizado na execucao local e em scripts npm e [`Backend/server.js`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Backend/server.js). Esse arquivo:

- configura CORS;
- define a rota raiz `/`;
- implementa `POST /auth/login`;
- registra as rotas de usuarios, academias, agendamentos e avaliacoes;
- executa um seed inicial de academias ficticias quando necessario.

Existe tambem o arquivo [`Backend/src/app.js`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Backend/src/app.js), porem ele representa uma versao reduzida e desatualizada da configuracao principal, nao sendo o ponto de entrada padrao do projeto no estado atual do repositorio.

### 8.3 Geolocalizacao e distancia

O sistema utiliza duas abordagens:

- geolocalizacao do navegador para identificar a posicao do usuario;
- servico Nominatim para converter enderecos em coordenadas geograficas.

Quando a geocodificacao falha, a aplicacao adota coordenadas de fallback e, em ultimo caso, uma distancia estimada calculada a partir do nome da academia. Esse comportamento garante resiliencia visual, embora possa reduzir a precisao dos dados.

### 8.4 Imagens

O backend tenta localizar imagens na conta Cloudinary e relaciona os arquivos aos nomes das academias por meio de normalizacao textual. Quando nao ha correspondencia direta, o sistema aplica uma imagem alternativa. O frontend ainda possui imagens locais para reforco visual da interface.

## 9. Estrutura do projeto

```text
academiafinder/
|-- Backend/
|   |-- server.js
|   |-- package.json
|   |-- sql/
|   |   `-- create_avaliacoes.sql
|   |   `-- enable_rls.sql
|   `-- src/
|       |-- app.js
|       |-- config/
|       |   |-- cloudinary.js
|       |   `-- supabase.js
|       |-- controllers/
|       |-- routes/
|       `-- ...
|-- Frontend/
|   |-- package.json
|   |-- index.html
|   `-- src/
|       |-- App.jsx
|       |-- services/
|       |-- styles/
|       |-- components/
|       `-- Academia/
|-- docs/
|   `-- guia_usuario_abnt.html
`-- README.md
```

## 10. API e integracoes

### 10.1 Endpoints em uso pelo frontend

Os principais endpoints consumidos pela interface sao:

- `POST /auth/login`
- `GET /academias`
- `GET /agendamentos`
- `POST /agendamentos`
- `GET /avaliacoes`
- `POST /avaliacoes`

### 10.2 Endpoints adicionais disponiveis no backend

O backend tambem disponibiliza operacoes CRUD adicionais:

- `GET /usuarios`
- `POST /usuarios`
- `GET /usuarios/:id`
- `PUT /usuarios/:id`
- `DELETE /usuarios/:id`
- `POST /academias`
- `GET /academias/:id`
- `PUT /academias/:id`
- `DELETE /academias/:id`
- `GET /agendamentos/:id`
- `DELETE /agendamentos/:id`

### 10.3 Integracoes externas

- Supabase: persistencia de dados;
- Cloudinary: armazenamento e entrega de imagens;
- Nominatim/OpenStreetMap: geocodificacao de enderecos;
- OpenStreetMap via OpenLayers: renderizacao cartografica do mapa.

## 11. Banco de dados

### 11.1 Tabelas esperadas

O sistema pressupoe a existencia das seguintes tabelas:

- `usuarios`
- `academias`
- `agendamentos`
- `avaliacoes`

### 11.2 Script de avaliacoes

O arquivo [`Backend/sql/create_avaliacoes.sql`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Backend/sql/create_avaliacoes.sql) cria a tabela de avaliacoes com os campos:

- `id`
- `usuario_id`
- `academia_id`
- `nota`
- `comentario`
- `created_at`

### 11.3 Script de seguranca RLS

O arquivo [`Backend/sql/enable_rls.sql`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Backend/sql/enable_rls.sql) habilita Row Level Security nas tabelas publicas utilizadas pelo projeto. Esse script deve ser executado no SQL Editor do Supabase antes de considerar o alerta resolvido.

### 11.4 Observacoes de modelagem

- o backend aceita a ausencia da coluna `tipo` na tabela `agendamentos`, fazendo fallback para insercao sem esse campo;
- o backend tambem aceita cenarios em que a tabela de avaliacoes esteja nomeada como `avaliacao`, embora o padrao recomendado seja `avaliacoes`;
- o login demonstrativo utiliza o email fixo `teste@academiafinder.local`.

## 12. Limitacoes conhecidas

No estado atual do repositorio, devem ser observadas as seguintes limitacoes:

- o arquivo [`Backend/src/app.js`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Backend/src/app.js) nao reflete a configuracao completa usada por [`Backend/server.js`](/c:/Users/ricar/Desktop/GIT/A3_DSII/academiafinder/Backend/server.js);
- existem credenciais e chaves definidas diretamente em arquivos do backend, o que nao e adequado para ambiente produtivo;
- a autenticacao e demonstrativa, sem JWT real, criptografia de senha ou controle de sessao robusto;
- o calculo de distancia pode usar estimativas quando o endereco nao e geocodificado com sucesso;
- a agenda exibida no frontend utiliza disponibilidades ficticias para simulacao de horarios;
- o projeto nao apresenta, neste momento, uma bateria formal de testes automatizados.

## 13. Boas praticas de operacao

Para melhor utilizacao e manutencao do sistema, recomenda-se:

- manter o backend ativo antes de iniciar o frontend;
- revisar permissao de geolocalizacao no navegador;
- garantir que as tabelas do Supabase estejam corretamente criadas;
- armazenar credenciais exclusivamente em variaveis de ambiente;
- usar a API publicada em HTTPS em cenarios de demonstracao externa;
- validar manualmente os fluxos de login, listagem, comparacao, agendamento e avaliacao apos alteracoes.

## 14. Solucao de problemas

### 14.1 O frontend nao carrega dados

Possiveis causas:

- backend nao iniciado;
- `VITE_API_URL` configurado incorretamente;
- CORS nao liberado no backend;
- falha de acesso ao Supabase.

### 14.2 O mapa nao mostra minha localizacao

Possiveis causas:

- permissao de geolocalizacao negada no navegador;
- dispositivo sem acesso a localizacao;
- falha temporaria do navegador ou indisponibilidade do servico.

### 14.3 As imagens das academias nao aparecem

Possiveis causas:

- Cloudinary nao configurado;
- pasta de assets vazia;
- nomes das imagens sem correspondencia com os nomes das academias;
- uso de fallback local sem imagem equivalente.

### 14.4 O login falha

Verificar se as credenciais usadas sao exatamente:

- login: `teste`
- senha: `teste`

Se ainda assim houver falha, confirmar se a tabela `usuarios` existe e se o backend consegue acessar o projeto Supabase.

## 15. Conclusao

O Academia Finder atende ao objetivo academico de demonstrar uma aplicacao web integrada, com interface moderna, consumo de API, persistencia de dados e recursos de geolocalizacao. Sob a perspectiva do usuario, o sistema oferece fluxo simples e organizado para busca, comparacao, agendamento e avaliacao de academias. Sob a perspectiva tecnica, o projeto demonstra integracao coerente entre frontend e backend, embora ainda existam pontos de maturidade a evoluir, especialmente em seguranca, padronizacao de configuracao e testes.

## 16. Referencias

OPENJS FOUNDATION. Node.js. Disponivel em: <https://nodejs.org/>. Acesso em: 5 abr. 2026.

REACT TEAM. React. Disponivel em: <https://react.dev/>. Acesso em: 5 abr. 2026.

VITE TEAM. Vite. Disponivel em: <https://vite.dev/>. Acesso em: 5 abr. 2026.

EXPRESS. Express - Node.js web application framework. Disponivel em: <https://expressjs.com/>. Acesso em: 5 abr. 2026.

SUPABASE. Supabase Documentation. Disponivel em: <https://supabase.com/docs>. Acesso em: 5 abr. 2026.

CLOUDINARY. Cloudinary Documentation. Disponivel em: <https://cloudinary.com/documentation>. Acesso em: 5 abr. 2026.

OPENSTREETMAP FOUNDATION. OpenStreetMap. Disponivel em: <https://www.openstreetmap.org/>. Acesso em: 5 abr. 2026.

OPENLAYERS. OpenLayers Documentation. Disponivel em: <https://openlayers.org/>. Acesso em: 5 abr. 2026.
