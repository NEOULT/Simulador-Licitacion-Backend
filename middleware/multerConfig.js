
import fs from 'fs';
import { randomUUID } from 'crypto';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config();

const DIR_CIFRADAS = process.env.DIR_OFERTAS_CIFRADAS;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!DIR_CIFRADAS) return cb(new Error('DIR_OFERTAS_CIFRADAS no está configurado'));
      if (!fs.existsSync(DIR_CIFRADAS)) fs.mkdirSync(DIR_CIFRADAS, { recursive: true });
      cb(null, DIR_CIFRADAS);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const id = randomUUID();
    req.fileId = id; 
    cb(null, `${id}.dat`);
  }
});

const upload = multer({ storage });

export default upload;
