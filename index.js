// server.mjs
import express from 'express';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import loginRoutes from './routes/loginRoutes.js';
import licitacionRoutes from './routes/licitacionRoutes.js';


dotenv.config();

const app = express();
const port = process.env.PORT;
const DIR_CIFRADAS = process.env.DIR_OFERTAS_CIFRADAS;

if (!fs.existsSync(DIR_CIFRADAS)) fs.mkdirSync(DIR_CIFRADAS, { recursive: true });
if (!fs.existsSync(process.env.DIR_OFERTAS_DESENCRIPTADAS)) fs.mkdirSync(process.env.DIR_OFERTAS_DESENCRIPTADAS, { recursive: true });


app.use(express.json());
app.use(cors());
app.use('/licitacion', licitacionRoutes);
app.use('/auth', loginRoutes);

app.listen(port, () => {
  console.log(`Servidor de Licitación corriendo en http://localhost:${port}`);
  console.log(`Rutas de archivos: ${DIR_CIFRADAS} (Cifradas)`);
});