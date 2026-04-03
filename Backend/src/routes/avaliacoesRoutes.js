const express = require('express')
const router = express.Router()

const {
  criarAvaliacao,
  listarAvaliacoes,
} = require('../controllers/avaliacoesController')

router.post('/', criarAvaliacao)
router.get('/', listarAvaliacoes)

module.exports = router
