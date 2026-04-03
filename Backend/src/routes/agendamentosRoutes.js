const express = require('express');
const router = express.Router();

const {
  criarAgendamento,
  listarAgendamentos,
  buscarAgendamentoPorId,
  deletarAgendamento
} = require('../controllers/agendamentosController');

router.post('/', criarAgendamento);
router.get('/', listarAgendamentos);
router.get('/:id', buscarAgendamentoPorId);
router.delete('/:id', deletarAgendamento);

module.exports = router;