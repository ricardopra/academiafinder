const supabase = require('../config/supabase');

const criarAgendamento = async (req, res) => {
  try {
    const { usuario_id, academia_id, data, tipo } = req.body;

    if (!usuario_id || !academia_id || !data) {
      return res.status(400).json({
        erro: 'usuario_id, academia_id e data são obrigatórios.'
      });
    }

    const payload = { usuario_id, academia_id, data };
    if (tipo) {
      payload.tipo = tipo;
    }

    let { data: resultado, error } = await supabase
      .from('agendamentos')
      .insert([payload])
      .select();

    if (error && tipo) {
      const msg = String(error.message || '').toLowerCase();
      const colunaTipoInvalida = msg.includes('tipo') && (msg.includes('column') || msg.includes('schema'));

      if (colunaTipoInvalida) {
        ({ data: resultado, error } = await supabase
          .from('agendamentos')
          .insert([{ usuario_id, academia_id, data }])
          .select());
      }
    }

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao criar agendamento.' });
  }
};

const listarAgendamentos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: true });

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao listar agendamentos.' });
  }
};

const buscarAgendamentoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao buscar agendamento.' });
  }
};

const deletarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(200).json({ mensagem: 'Agendamento cancelado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno ao cancelar agendamento.' });
  }
};

module.exports = {
  criarAgendamento,
  listarAgendamentos,
  buscarAgendamentoPorId,
  deletarAgendamento
};
