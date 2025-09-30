import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const guardarLicitacion = (req, res) => {
  const id = uuidv4();
  const files = req.files;

  if (!files.pdf || !files.firma || !files.certificado) {
    return res.status(400).json({ error: 'Faltan archivos requeridos.', pdf: files.pdf ? files.pdf[0].filename : 'PDF', firma: files.firma ? files.firma[0].filename : 'Firma', certificado: files.certificado ? files.certificado[0].filename : 'Certificado' });
  }

  const metadata = {
    id,
    pdf: files.pdf[0].filename,
    firma: files.firma[0].filename,
    certificado: files.certificado[0].filename
  };
  fs.writeFileSync(`licitaciones/${id}.json`, JSON.stringify(metadata));

  res.json(metadata);
};

export const obtenerLicitacion = (req, res) => {
  const { id } = req.params;
  const metaPath = `licitaciones/${id}.json`;

  if (!fs.existsSync(metaPath)) {
    return res.status(404).json({ error: 'Licitación no encontrada.' });
  }

  const metadata = JSON.parse(fs.readFileSync(metaPath));
  const pdf = fs.readFileSync(`licitaciones/${metadata.pdf}`);
  const firma = fs.readFileSync(`licitaciones/${metadata.firma}`);
  const certificado = fs.readFileSync(`licitaciones/${metadata.certificado}`);

  res.json({
    id: metadata.id,
    pdf: pdf.toString('base64'),
    firma: firma.toString('base64'),
    certificado: certificado.toString('base64')
  });
};
