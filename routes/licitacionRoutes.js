import express from 'express';
import upload from '../middleware/multerConfig.js';
import { guardarLicitacion, obtenerLicitacion } from '../controllers/licitacionController.js';

const router = express.Router();

router.post('/licitacion', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'firma', maxCount: 1 },
  { name: 'certificado', maxCount: 1 }
]), guardarLicitacion);

router.get('/licitacion/:id', obtenerLicitacion);

export default router;
