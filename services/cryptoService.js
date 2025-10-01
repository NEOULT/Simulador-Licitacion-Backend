
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const RUTA_CLAVE = process.env.RUTA_CLAVE_PRIVADA_ENTIDAD;
const CLAVE_PRIVADA_ENTIDAD = fs.readFileSync(RUTA_CLAVE, 'utf8');

const IV_LENGTH = parseInt(process.env.IV_LENGTH);
const ENCRYPTED_KEY_LENGTH = parseInt(process.env.ENCRYPTED_KEY_LENGTH);


export function procesarPaqueteHibrido(archivoCifradoBuffer) {
    try {
        // --- 1. Desensamblar el Archivo Cifrado ---
        const iv = archivoCifradoBuffer.slice(0, IV_LENGTH);
        const claveSesionCifrada = archivoCifradoBuffer.slice(IV_LENGTH, IV_LENGTH + ENCRYPTED_KEY_LENGTH);
        const contenidoCifrado = archivoCifradoBuffer.slice(IV_LENGTH + ENCRYPTED_KEY_LENGTH);

        // --- 2. Descifrado Asimétrico (RSA) de la Clave de Sesión ---
        const claveSesion = crypto.privateDecrypt(
            { key: CLAVE_PRIVADA_ENTIDAD, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
            claveSesionCifrada
        );

        // --- 3. Descifrado Simétrico (AES) del Contenido ---
        const decipher = crypto.createDecipheriv('aes-256-cbc', claveSesion, iv);
        let paqueteBufferDescifrado = decipher.update(contenidoCifrado);
        paqueteBufferDescifrado = Buffer.concat([paqueteBufferDescifrado, decipher.final()]);

        const paqueteJSON = JSON.parse(paqueteBufferDescifrado.toString('utf8'));
        const { firma, certificado, documento, metadata } = paqueteJSON;

        // --- 4. Verificación de la Firma Digital ---
        const documentoBuffer = Buffer.from(documento, 'base64');
        const certificadoPEM = Buffer.from(certificado, 'base64').toString('utf8');
        const clavePublicaEmpresa = crypto.createPublicKey(certificadoPEM); 

        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(documentoBuffer);
        const firmaEsValida = verifier.verify(clavePublicaEmpresa, firma, 'base64');
        
        return {
            status: 'success',
            firma_valida: firmaEsValida,
            metadata: metadata,
            documento_buffer: documentoBuffer
        };

    } catch (error) {
        return {
            status: 'error',
            mensaje: 'Fallo el descifrado o la verificación.',
            detalle: error.message
        };
    }
}
