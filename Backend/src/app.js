const express = require('express');
const cors = require('cors');

const usuariosRoutes = require('./routes/usuariosRoutes');
const academiasRoutes = require('./routes/academiasRoutes');
const agendamentosRoutes = require('./routes/agendamentosRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API AcademiaFinder rodando com sucesso.');
});

app.use('/usuarios', usuariosRoutes);
app.use('/academias', academiasRoutes);
app.use('/agendamentos', agendamentosRoutes);

module.exports = app;