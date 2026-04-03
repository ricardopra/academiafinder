# Academia Finder

Aplicação web para descobrir academias, comparar opções e realizar agendamentos.

## Integrantes
- Alan Araújo Paiva — RA 10423944
- Felipe Amorim — RA 10441136
- Ricardo Pereira — RA 10442905

Universidade Presbiteriana Mackenzie  
Curso de Análise e Desenvolvimento de Sistemas

## Tecnologias empregadas
### Frontend
- React 19
- Vite 8
- CSS customizado (tema responsivo desktop/mobile)
- OpenLayers (mapa em tempo real)
- Lucide React (ícones)

### Backend
- Node.js + Express 5
- Supabase (PostgreSQL + API)
- Cloudinary (imagens das academias)
- CORS + dotenv

### Serviços auxiliares usados no app
- Nominatim (OpenStreetMap) para geocodificação de endereços e cálculo de distância

## Funcionalidades implementadas
- Login (credenciais de demonstração)
- Home com academias vindas do backend
- Mapa em tempo real com localização do usuário
- Detalhes da academia (preço, avaliação, distância, imagem)
- Comparação entre academias (até 4)
- Agendamento com calendário e horários
- Perfil com agendamentos e avaliações salvas
- Cadastro de avaliações/comentários no backend
- Leitura de fotos via Cloudinary (com fallback)
- Botão de sair global na aplicação

## Estrutura de pastas
```text
academiafinder/
  Backend/
    server.js
    src/
      config/
      controllers/
      routes/
    sql/
      create_avaliacoes.sql
  Frontend/
    src/
      Academia/
      components/
      services/
      styles/
```

## Pré-requisitos
- Node.js 20+
- npm 10+
- Projeto Supabase configurado com tabelas da aplicação
- Conta Cloudinary (opcional, mas recomendada para fotos)

## Configuração de ambiente
### Backend/.env
```env
CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
CLOUDINARY_API_KEY=SUA_API_KEY
CLOUDINARY_API_SECRET=SUA_API_SECRET
CLOUDINARY_ASSET_FOLDER=Assets
```

### Frontend/.env
```env
VITE_API_URL=http://localhost:3000
```

## Banco de dados (Supabase)
Garanta as tabelas principais:
- `usuarios`
- `academias`
- `agendamentos`
- `avaliacoes`

Para criar a tabela de avaliações, execute no SQL Editor do Supabase:
- Arquivo: `Backend/sql/create_avaliacoes.sql`

## Como rodar localmente
### 1) Backend
```bash
cd Backend
npm install
npm run dev
```
Servidor em `http://localhost:3000`

### 2) Frontend
```bash
cd Frontend
npm install
npm run dev
```
Aplicação em `http://localhost:5173`

## Credenciais de login (demonstração)
- Login: `teste`
- Senha: `teste`

## Scripts úteis
### Backend
- `npm run dev` — inicia backend
- `npm start` — inicia backend

### Frontend
- `npm run dev` — inicia frontend
- `npm run lint` — valida código
- `npm run build` — build de produção

## Endpoints principais do backend
- `POST /auth/login`
- `GET /academias`
- `POST /agendamentos`
- `GET /agendamentos`
- `POST /avaliacoes`
- `GET /avaliacoes`

## Publicação no GitHub
Após revisar alterações:
```bash
git add .
git commit -m "feat: atualiza documentação e versão funcional do Academia Finder"
git push origin main
```

Se sua branch padrão não for `main`, substitua pelo nome correto.
