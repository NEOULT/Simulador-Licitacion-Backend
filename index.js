
import express from 'express';
import licitacionRoutes from './routes/licitacionRoutes.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', licitacionRoutes);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
