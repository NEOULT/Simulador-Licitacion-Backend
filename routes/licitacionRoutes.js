import express from 'express';
import { seleccionarGanador } from '../controllers/licitacionController.js';

const router = express.Router();

// Seleccionar Ganador

  router.post('/licitacion/ganador', seleccionarGanador);

export default router;
