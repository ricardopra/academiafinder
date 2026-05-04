const express = require('express')
const cors = require('cors')
require('dotenv').config()
const supabase = require('./src/config/supabase')

const usuariosRoutes = require('./src/routes/usuariosRoutes')
const academiasRoutes = require('./src/routes/academiasRoutes')
const agendamentosRoutes = require('./src/routes/agendamentosRoutes')
const avaliacoesRoutes = require('./src/routes/avaliacoesRoutes')

const app = express()

const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((v) => v.trim()) }))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend funcionando')
})

const EMAIL_USUARIO_DEMO = 'teste@academiafinder.local'

function criarUsuarioDemoFallback() {
  return {
    id: 'demo-offline',
    nome: 'Teste',
    email: EMAIL_USUARIO_DEMO,
  }
}

function erroDeRedeSupabase(error) {
  const mensagem = String(error?.message || '').toLowerCase()
  return mensagem.includes('fetch failed') || mensagem.includes('network') || mensagem.includes('socket')
}

async function seedAcademiasFicticias() {
  const academiasSeed = [
    { nome: 'Iron Forge', endereco: 'Rua Funchal, 418 - Itaim Bibi, Sao Paulo - SP', preco: 120 },
    { nome: 'Zen Studio', endereco: 'Av. Santo Amaro, 800 - Vila Olimpia, Sao Paulo - SP', preco: 89 },
    { nome: 'Pulse Gym', endereco: 'Rua dos Pinheiros, 225 - Pinheiros, Sao Paulo - SP', preco: 105 },
    { nome: 'Urban Fit', endereco: 'Av. Reboucas, 1011 - Jardins, Sao Paulo - SP', preco: 150 },
  ]

  const nomes = academiasSeed.map((item) => item.nome)
  const { data: existentes, error: erroBusca } = await supabase
    .from('academias')
    .select('nome')
    .in('nome', nomes)

  if (erroBusca) {
    console.error('Erro ao verificar seed de academias:', erroBusca.message)
    return
  }

  const nomesExistentes = new Set((existentes || []).map((item) => item.nome))
  const faltantes = academiasSeed.filter((item) => !nomesExistentes.has(item.nome))

  if (faltantes.length > 0) {
    const { error: erroInsert } = await supabase.from('academias').insert(faltantes)
    if (erroInsert) {
      console.error('Erro ao inserir academias ficticias:', erroInsert.message)
    }
  }
}

app.post('/auth/login', async (req, res) => {
  try {
    const { login, senha } = req.body

    if (login !== 'teste' || senha !== 'teste') {
      return res.status(401).json({ erro: 'Login ou senha invalidos.' })
    }

    const { data: usuarioExistente, error: erroBusca } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', EMAIL_USUARIO_DEMO)
      .maybeSingle()

    if (erroBusca) {
      if (erroDeRedeSupabase(erroBusca)) {
        console.warn('Supabase indisponivel no login; usando usuario demo offline.', erroBusca.message)
        return res.status(200).json({
          token: 'teste-session-token',
          usuario: criarUsuarioDemoFallback(),
          modo_offline: true,
        })
      }
      return res.status(500).json({ erro: erroBusca.message })
    }

    let usuario = usuarioExistente

    if (!usuario) {
      const { data: criado, error: erroCriacao } = await supabase
        .from('usuarios')
        .insert([{ nome: 'Teste', email: EMAIL_USUARIO_DEMO }])
        .select()
        .single()

      if (erroCriacao) {
        if (erroDeRedeSupabase(erroCriacao)) {
          console.warn('Supabase indisponivel ao criar usuario demo; usando fallback offline.', erroCriacao.message)
          return res.status(200).json({
            token: 'teste-session-token',
            usuario: criarUsuarioDemoFallback(),
            modo_offline: true,
          })
        }
        return res.status(500).json({ erro: erroCriacao.message })
      }

      usuario = criado
    }

    return res.status(200).json({ token: 'teste-session-token', usuario })
  } catch (error) {
    if (erroDeRedeSupabase(error)) {
      console.warn('Falha de rede inesperada no login; usando usuario demo offline.', error.message)
      return res.status(200).json({
        token: 'teste-session-token',
        usuario: criarUsuarioDemoFallback(),
        modo_offline: true,
      })
    }

    console.error('Erro interno ao autenticar usuario:', error)
    return res.status(500).json({ erro: 'Erro interno ao autenticar usuario.' })
  }
})

app.use('/usuarios', usuariosRoutes)
app.use('/academias', academiasRoutes)
app.use('/agendamentos', agendamentosRoutes)
app.use('/avaliacoes', avaliacoesRoutes)

module.exports = app

if (process.env.VERCEL !== '1') {
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000')
    seedAcademiasFicticias().catch((erro) => {
      console.error('Falha inesperada no seed:', erro.message)
    })
  })
}
