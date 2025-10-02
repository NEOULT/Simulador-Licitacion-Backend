
import fs from 'fs';
import path from 'path';
import {procesarPaqueteHibrido} from '../services/cryptoService.js'; 
import forge from 'node-forge';

const DIR_CIFRADAS = process.env.DIR_OFERTAS_CIFRADAS;
const DIR_DESENCRIPTADAS = process.env.DIR_OFERTAS_DESENCRIPTADAS;

function getOrganizationFromCert(certPem) {
  const cert = forge.pki.certificateFromPem(certPem);
  const orgAttr = cert.subject.getField('O');
  return orgAttr ? orgAttr.value : 'Desconocido';
}

export const subirOferta = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', mensaje: 'No se recibió el archivo paquete_dat.' });
    }
    console.log(`\n📦 OFERTA RECIBIDA: ${req.file.filename}`);
    res.status(201).json({ 
        status: 'success', 
        mensaje: 'Paquete cifrado guardado correctamente.',
        nombre_archivo: req.file.filename 
    });
};

export const listarOfertas = (req, res) => {
    try {
        const archivos = fs.readdirSync(DIR_CIFRADAS)
        .filter(f => f.endsWith('.dat'))
        .map((filename, index) => ({
            id: index + 1,
            nombre_archivo: filename,
            tamano_bytes: fs.statSync(path.join(DIR_CIFRADAS, filename)).size,
        }));

        res.status(200).json({
            status: 'success',
            total_ofertas_cifradas: archivos.length,
            ofertas: archivos
        });
    } catch (error) {
        console.error("Error al listar archivos:", error);
        res.status(500).json({ status: 'error', mensaje: 'Error al acceder al directorio de ofertas.' });
    }
};

export const procesarOferta = (req, res) => {
    const filename = req.params.nombre_archivo;
    const rutaCifrada = path.join(DIR_CIFRADAS, filename);;
    
    if (!fs.existsSync(rutaCifrada)) {
        return res.status(404).json({ status: 'error', mensaje: `Archivo ${filename} no encontrado.` });
    }

    try {
        const archivoCifradoBuffer = fs.readFileSync(rutaCifrada);
        // Llama al servicio para ejecutar la lógica de negocio
        const resultado = procesarPaqueteHibrido(archivoCifradoBuffer);
        
        if (resultado.status === 'error') {
            console.error(`❌ Procesamiento fallido para ${filename}: ${resultado.detalle}`);
            return res.status(406).json({ status: 'error', mensaje: 'Fallo el descifrado o la verificación.', detalle: resultado.detalle });
        }

        // --- Almacenamiento y Respuesta de Éxito ---
        const { firma_valida, metadata, documento_buffer, certificado } = resultado;
        const estadoFinal = firma_valida ? 'VERIFICADA Y VÁLIDA' : 'INVÁLIDA';

        const organizacion = getOrganizationFromCert(certificado);

        // 2. Crear carpeta por organización si no existe
        const carpetaOrg = path.join(DIR_DESENCRIPTADAS, organizacion);
        if (!fs.existsSync(carpetaOrg)) {
            fs.mkdirSync(carpetaOrg, { recursive: true });
        }

         // 3. Guardar el PDF y el certificado en la carpeta de la organización
        const rutaDesencriptada = path.join(carpetaOrg, `desenc_${filename}.pdf`);
        fs.writeFileSync(rutaDesencriptada, documento_buffer);

        const rutaCertificado = path.join(carpetaOrg, `cert_${filename}.pem`);
        fs.writeFileSync(rutaCertificado, certificado);

        res.status(200).json({
            status: 'success',
            mensaje: 'Paquete descifrado y verificación completada.',
            nombre_archivo_original: filename,
            firma_digital: estadoFinal,
            metadata: metadata,
            ruta_documento_guardado: rutaDesencriptada,
        });

    } catch (error) {
        console.error("Error inesperado en el procesamiento:", error);
        res.status(500).json({ status: 'fatal_error', mensaje: 'Error interno del servidor.' });
    }
};