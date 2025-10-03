import express from 'express';
import { seleccionarGanador } from '../controllers/licitacionController.js';
import {procesarOferta, listarOfertas, subirOferta } from '../controllers/ofertasController.js';
import upload from '../middleware/multerConfig.js';

const router = express.Router();

router.post('/licitacion', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'firma', maxCount: 1 },
  { name: 'certificado', maxCount: 1 }
]), guardarLicitacion);

  router.post('/ganador', seleccionarGanador);
  router.get('/listar', listarOfertas);
  router.post('/subir',upload.single('paquete_dat'), subirOferta);
  router.post('/procesar/:id', procesarOferta);

export default router;
