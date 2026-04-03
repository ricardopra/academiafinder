const supabase = require('../config/supabase')
const cloudinary = require('../config/cloudinary')

function normalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function buscarFotosCloudinary() {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('[cloudinary] CLOUDINARY_CLOUD_NAME nao configurado.')
      return []
    }

    const candidatos = [
      process.env.CLOUDINARY_ASSET_FOLDER,
      'Assets',
      'assets',
      'academias',
    ].filter(Boolean)

    const vistos = new Set()
    const pastas = candidatos.filter((pasta) => {
      const chave = String(pasta).trim()
      if (!chave || vistos.has(chave)) return false
      vistos.add(chave)
      return true
    })

    for (const pasta of pastas) {
      let resultado = null

      if (typeof cloudinary.api.resources_by_asset_folder === 'function') {
        resultado = await cloudinary.api.resources_by_asset_folder(pasta, { max_results: 200 })
      } else {
        // Fallback for SDK versions without resources_by_asset_folder helper.
        resultado = await cloudinary.api.resources({
          type: 'upload',
          prefix: `${pasta}/`,
          max_results: 200,
        })
      }

      const recursos = Array.isArray(resultado?.resources) ? resultado.resources : []
      if (recursos.length > 0) {
        return recursos
      }
    }

    // Last fallback: any upload resource in the account.
    const respostaGlobal = await cloudinary.api.resources({
      type: 'upload',
      max_results: 200,
    })
    const globais = Array.isArray(respostaGlobal?.resources) ? respostaGlobal.resources : []
    if (globais.length === 0) {
      console.warn('[cloudinary] Nenhuma imagem encontrada nas pastas configuradas ou no fallback global.')
    }
    return globais
  } catch (error) {
    console.error('[cloudinary] Falha ao buscar imagens:', error.message)
    return []
  }
}

const criarAcademia = async (req, res) => {
  try {
    const { nome, endereco, preco } = req.body

    if (!nome || !endereco || preco === undefined) {
      return res.status(400).json({ erro: 'Nome, endereco e preco sao obrigatorios.' })
    }

    const { data, error } = await supabase
      .from('academias')
      .insert([{ nome, endereco, preco }])
      .select()

    if (error) {
      return res.status(400).json({ erro: error.message })
    }

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao criar academia.' })
  }
}

const listarAcademias = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('academias')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      return res.status(400).json({ erro: error.message })
    }

    const fotosCloudinary = await buscarFotosCloudinary()
    const fotosPorSlug = new Map()

    fotosCloudinary.forEach((foto) => {
      const partes = String(foto.public_id || '').split('/')
      const ultimo = partes[partes.length - 1] || ''
      fotosPorSlug.set(normalizarTexto(ultimo), foto.secure_url)
    })

    const academiasComFoto = (data || []).map((academia, indice) => {
      const slugNome = normalizarTexto(academia.nome)
      const fotoSlug = fotosPorSlug.get(slugNome)
      const fotoFallback = fotosCloudinary[indice % (fotosCloudinary.length || 1)]?.secure_url || null

      return {
        ...academia,
        foto_url: fotoSlug || fotoFallback,
      }
    })

    res.status(200).json(academiasComFoto)
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao listar academias.' })
  }
}

const buscarAcademiaPorId = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('academias')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ erro: 'Academia nao encontrada.' })
    }

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao buscar academia.' })
  }
}

const atualizarAcademia = async (req, res) => {
  try {
    const { id } = req.params
    const { nome, endereco, preco } = req.body

    if (!nome || !endereco || preco === undefined) {
      return res.status(400).json({ erro: 'Nome, endereco e preco sao obrigatorios.' })
    }

    const { data, error } = await supabase
      .from('academias')
      .update({ nome, endereco, preco })
      .eq('id', id)
      .select()

    if (error) {
      return res.status(400).json({ erro: error.message })
    }

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao atualizar academia.' })
  }
}

const deletarAcademia = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('academias')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(400).json({ erro: error.message })
    }

    res.status(200).json({ mensagem: 'Academia deletada com sucesso.' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao deletar academia.' })
  }
}

module.exports = {
  criarAcademia,
  listarAcademias,
  buscarAcademiaPorId,
  atualizarAcademia,
  deletarAcademia,
}
