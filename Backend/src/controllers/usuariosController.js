const supabase = require('../config/supabase');

const criarUsuario = async (req, res) => {
  try {
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e email são obrigatórios.' });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nome, email }])
      .select();

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao criar usuário.' });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao listar usuários.' });
  }
};

const buscarUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao buscar usuário.' });
  }
};

const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e email são obrigatórios.' });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update({ nome, email })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao atualizar usuário.' });
  }
};

const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(200).json({ mensagem: 'Usuário deletado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao deletar usuário.' });
  }
};

module.exports = {
  criarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario
};