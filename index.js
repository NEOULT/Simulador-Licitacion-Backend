// server.mjs
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import loginRoutes from './routes/loginRoutes.js';
import { fileURLToPath } from 'url';
import {procesarOferta, listarOfertas, subirOferta } from './controllers/ofertasController.js';
import licitacionRoutes from './routes/licitacionRoutes.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const DIR_CIFRADAS = process.env.DIR_OFERTAS_CIFRADAS;

if (!fs.existsSync(DIR_CIFRADAS)) fs.mkdirSync(DIR_CIFRADAS, { recursive: true });
if (!fs.existsSync(process.env.DIR_OFERTAS_DESENCRIPTADAS)) fs.mkdirSync(process.env.DIR_OFERTAS_DESENCRIPTADAS, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR_CIFRADAS);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.dat';
    cb(null, `${Date.now()}_${file.fieldname}${ext}`);
  }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use('', licitacionRoutes); // Rutas de licitación
app.use('', loginRoutes); // Rutas de login

app.post('/oferta', upload.single('paquete_dat'), subirOferta);
app.get('/ofertas/lista', listarOfertas);
app.post('/ofertas/procesar/:nombre_archivo', procesarOferta);

app.listen(port, () => {
  console.log(`Servidor de Licitación corriendo en http://localhost:${port}`);
  console.log(`Rutas de archivos: ${DIR_CIFRADAS} (Cifradas)`);
});