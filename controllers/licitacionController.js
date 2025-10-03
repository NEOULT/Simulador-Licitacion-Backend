import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import forge from 'node-forge';

export const seleccionarGanador = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID de la oferta es requerido' });

    // Buscar el archivo en todas las subcarpetas de ofertas_desencriptadas
    const baseDir = path.join('ofertas_desencriptadas');
    let ofertaPath = null;
    let orgFolder = null;

    const orgs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const org of orgs) {
      const files = fs.readdirSync(path.join(baseDir, org));
      const match = files.find(f => f.includes(id) && f.endsWith('.pdf'));
      if (match) {
        ofertaPath = path.join(baseDir, org, match);
        orgFolder = org;
        break;
      }
    }

    if (!ofertaPath) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    const files = fs.readdirSync(path.join(baseDir, orgFolder));
    const certFile = files.find(f => f.includes(id) && f.endsWith('.pem'));
    if (!certFile) {
      return res.status(400).json({ error: 'Certificado digital no encontrado' });
    }

    // 2. Revisar el certificado digital del ganador usando node-forge
    const certPath = path.join(baseDir, orgFolder, certFile);
    if (!fs.existsSync(certPath)) {
      return res.status(400).json({ error: 'Certificado digital no encontrado' });
    }
    const certData = fs.readFileSync(certPath, 'utf8');
    const cert = forge.pki.certificateFromPem(certData);

    // Extraer fechas de validez
    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;
    const now = new Date();
    if (now < notBefore || now > notAfter) {
      return res.status(400).json({ error: 'Certificado digital expirado o no válido aún' });
    }

    // Extraer email del certificado (si existe)
    let emailGanador = null;
    const emailAttr = cert.subject.getField('E');
    if (emailAttr) {
      emailGanador = emailAttr.value;
    }

    if (!emailGanador) {
      return res.status(400).json({ error: 'No se encontró el correo del ganador en el certificado' });
    }

    // Configura tu transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailGanador,
      subject: '¡Felicidades, eres el ganador!',
      text: 'Has sido seleccionado como ganador de la licitación.',
    });

    res.json({ mensaje: 'Correo enviado al ganador', email: emailGanador });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};