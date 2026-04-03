const express = require('express');
const router = express.Router();

const {
  criarAcademia,
  listarAcademias,
  buscarAcademiaPorId,
  atualizarAcademia,
  deletarAcademia
} = require('../controllers/academiasController');

router.post('/', criarAcademia);
router.get('/', listarAcademias);
router.get('/:id', buscarAcademiaPorId);
router.put('/:id', atualizarAcademia);
router.delete('/:id', deletarAcademia);

module.exports = router;