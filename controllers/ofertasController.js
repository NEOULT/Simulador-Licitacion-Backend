
import fs from 'fs';
import path from 'path';
import { procesarPaqueteHibrido } from '../services/cryptoService.js';
import forge from 'node-forge';

const DIR_CIFRADAS = process.env.DIR_OFERTAS_CIFRADAS;
const DIR_DESENCRIPTADAS = process.env.DIR_OFERTAS_DESENCRIPTADAS;

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

function getOrganizationFromCert(certPem) {
  const cert = forge.pki.certificateFromPem(certPem);
  const orgAttr = cert.subject.getField('O');
  return orgAttr ? orgAttr.value : 'Desconocido';
}

export const subirOferta = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', mensaje: 'No se recibió el archivo paquete_dat.' });
  }
  const id = req.fileId || path.parse(req.file.filename).name;
  console.log(`📦 OFERTA RECIBIDA: ${id}`);
  res.status(201).json({
    status: 'success',
    mensaje: 'Paquete cifrado guardado correctamente.',
    id
  });
};

export const listarOfertas = (req, res) => {
  try {
    const ids = fs.readdirSync(DIR_CIFRADAS)
      .filter(f => f.endsWith('.dat'))
      .map(f => path.basename(f, '.dat'));

    res.status(200).json({
      status: 'success',
      total: ids.length,
      ids
    });
  } catch (error) {
    console.error("Error al listar archivos:", error);
    res.status(500).json({ status: 'error', mensaje: 'Error al acceder al directorio de ofertas.' });
  }
};

export const procesarOferta = (req, res) => {
    const id = req.params.id;

    if (!isUUID(id)) {
        return res.status(400).json({ status: 'error', mensaje: 'ID inválido.' });
    }

    const filename = `${id}.dat`;
    const rutaCifrada = path.join(DIR_CIFRADAS, filename);

    if (!fs.existsSync(rutaCifrada)) {
        return res.status(404).json({ status: 'error', mensaje: `Archivo con ID ${id} no encontrado.` });
    }

    try {
    const archivoCifradoBuffer = fs.readFileSync(rutaCifrada);
    const resultado = procesarPaqueteHibrido(archivoCifradoBuffer);

    if (resultado.status === 'error') {
        console.error(`❌ Procesamiento fallido para ${id}: ${resultado.detalle}`);
        return res.status(406).json({ status: 'error', mensaje: 'Fallo el descifrado o la verificación.', detalle: resultado.detalle });
    }

    const { documento_buffer, certificado } = resultado;
    const organizacion = getOrganizationFromCert(certificado);

    const carpetaOrg = path.join(DIR_DESENCRIPTADAS, organizacion);
    if (!fs.existsSync(carpetaOrg)) fs.mkdirSync(carpetaOrg, { recursive: true });

    const rutaDesencriptada = path.join(carpetaOrg, `desenc_${id}.pdf`);
    fs.writeFileSync(rutaDesencriptada, documento_buffer);

    const rutaCertificado = path.join(carpetaOrg, `cert_${id}.pem`);
    fs.writeFileSync(rutaCertificado, certificado);

    // Detectar tipo
    const isPdf = documento_buffer.slice(0,5).toString('ascii') === '%PDF-';
    const isZip = documento_buffer[0]===0x50 && documento_buffer[1]===0x4B && documento_buffer[2]===0x03 && documento_buffer[3]===0x04;

    let mime = 'application/octet-stream';
    let ext = 'bin';
    let disposition = 'inline';
    if (isPdf) { mime = 'application/pdf'; ext = 'pdf'; disposition = 'inline'; }
    else if (isZip) { mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; ext = 'docx'; disposition = 'attachment'; }

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `${disposition}; filename="desenc_${id}.${ext}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(documento_buffer);

    } catch (error) {
        console.error("Error inesperado en el procesamiento:", error);
        res.status(500).json({ status: 'fatal_error', mensaje: 'Error interno del servidor.' });
    }
};
