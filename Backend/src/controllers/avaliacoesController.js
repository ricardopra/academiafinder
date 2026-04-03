const supabase = require('../config/supabase')

const TABELAS_AVALIACAO = ['avaliacoes', 'avaliacao']

async function resolverTabelaAvaliacao() {
  for (const tabela of TABELAS_AVALIACAO) {
    const { error } = await supabase.from(tabela).select('id').limit(1)
    if (!error) return tabela
  }
  return null
}

function mensagemTabelaAusente() {
  return 'Tabela de avaliacoes nao encontrada (public.avaliacoes). Crie a tabela no Supabase e tente novamente.'
}

const criarAvaliacao = async (req, res) => {
  try {
    const { usuario_id, academia_id, nota, comentario } = req.body

    if (!usuario_id || !academia_id || nota === undefined) {
      return res.status(400).json({ erro: 'usuario_id, academia_id e nota sao obrigatorios.' })
    }

    const notaNumero = Number(nota)
    if (!Number.isFinite(notaNumero) || notaNumero < 1 || notaNumero > 5) {
      return res.status(400).json({ erro: 'Nota deve ser um numero entre 1 e 5.' })
    }

    const tabela = await resolverTabelaAvaliacao()
    if (!tabela) {
      return res.status(400).json({ erro: mensagemTabelaAusente() })
    }

    let { data, error } = await supabase
      .from(tabela)
      .insert([{ usuario_id, academia_id, nota: notaNumero, comentario: comentario || '' }])
      .select()

    // Fallback when the table does not have "comentario" column.
    if (error) {
      const msg = String(error.message || '').toLowerCase()
      const colunaComentarioInvalida = msg.includes('comentario') && (msg.includes('column') || msg.includes('schema'))

      if (colunaComentarioInvalida) {
        ({ data, error } = await supabase
          .from(tabela)
          .insert([{ usuario_id, academia_id, nota: notaNumero }])
          .select())
      }
    }

    if (error) {
      return res.status(400).json({ erro: error.message })
    }

    return res.status(201).json(data)
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno ao criar avaliacao.' })
  }
}

const listarAvaliacoes = async (req, res) => {
  try {
    const { usuario_id } = req.query

    const tabela = await resolverTabelaAvaliacao()
    if (!tabela) {
      return res.status(200).json([])
    }

    let query = supabase.from(tabela).select('*').order('id', { ascending: false })

    if (usuario_id) {
      query = query.eq('usuario_id', usuario_id)
    }

    const { data, error } = await query

    if (error) {
      return res.status(400).json({ erro: error.message })
    }

    return res.status(200).json(data || [])
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno ao listar avaliacoes.' })
  }
}

module.exports = {
  criarAvaliacao,
  listarAvaliacoes,
}
