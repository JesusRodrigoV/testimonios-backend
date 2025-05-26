import prisma from '../lib/prisma';
import { config } from '../deepgram/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
      }>;
    }>;
  };
  metadata: {
    duration: number;
    channels: number;
    format: string;
  };
}

interface DeepgramError {
  error: string;
  details?: string;
}

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export class TranscripcionService {
  private async descargarArchivo(url: string): Promise<string> {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
      });

      const extension = path.extname(url) || '.mp4';
      const tempFilePath = path.join('uploads', `${Date.now()}${extension}`);
      
      await writeFileAsync(tempFilePath, response.data);
      return tempFilePath;
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      throw new Error('Error al descargar el archivo desde Cloudinary');
    }
  }

  private getMimeType(extension: string): string { // determinar el tipo MIME del archivo basado en su extensión
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg'
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  async transcribirArchivo( // transcribir un archivo desde una url
    urlArchivo: string,
    testimonioId: number,
    usuarioId: number
  ) {
    let tempFilePath: string | null = null;
    
    try {
      // descargamos el archivo
      tempFilePath = await this.descargarArchivo(urlArchivo);
      const extension = path.extname(urlArchivo);
      const mimeType = this.getMimeType(extension);

      // leemos el archivo
      const audioBuffer = fs.readFileSync(tempFilePath);

      // realizamos la transcripción 
      const response = await fetch('https://api.deepgram.com/v1/listen?language=es&model=nova-2&smart_format=true&punctuate=true&diarize=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${config.DEEPGRAM_API_KEY}`,
          'Content-Type': mimeType,
        },
        body: audioBuffer,
      });

      if (!response.ok) {
        const errorData = await response.json() as DeepgramError;
        console.error('Error de Deepgram:', errorData);
        throw new Error(`Error en la API de Deepgram: ${errorData.error || 'Error desconocido'}`);
      }

      const data = await response.json() as DeepgramResponse;

      if (!data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        console.error('Respuesta de Deepgram sin transcripción:', data);
        throw new Error('No se pudo obtener la transcripción del audio');
      }

      // guardamos la transcripción en la bd
      const transcripcion = await prisma.transcripciones.create({
        data: {
          contenido: data.results.channels[0].alternatives[0].transcript,
          idioma: 'es',
          testimonios: {
            connect: {
              id_testimonio: testimonioId
            }
          },
          usuarios: {
            connect: {
              id_usuario: usuarioId
            }
          }
        },
        include: {
          testimonios: true,
          usuarios: true
        }
      });

      return {
        success: true,
        data: transcripcion,
        metadata: {
          duracion: data.metadata?.duration ?? 0,
          canales: data.metadata?.channels ?? 1,
          formato: data.metadata?.format ?? 'unknown',
        },
      };
    } catch (error) {
      console.error('Error en la transcripción:', error);
      throw new Error('Error al procesar la transcripción');
    } finally {
      // limpiamos el archivo temporal
      if (tempFilePath) {
        try {
          await unlinkAsync(tempFilePath);
        } catch (error) {
          console.error('Error al eliminar el archivo temporal:', error);
        }
      }
    }
  }

  async obtenerTranscripcion(id: number) {
    try {
      const transcripcion = await prisma.transcripciones.findUnique({
        where: { id_transcripcion: id },
        include: {
          testimonios: true,
          usuarios: true,
        },
      });

      if (!transcripcion) {
        throw new Error('Transcripción no encontrada');
      }

      return {
        success: true,
        data: transcripcion,
      };
    } catch (error) {
      console.error('Error al obtener la transcripción:', error);
      throw error;
    }
  }

  async obtenerTranscripcionesPorTestimonio(testimonioId: number) {
    try {
      const transcripciones = await prisma.transcripciones.findMany({
        where: { id_testimonio: testimonioId },
        include: {
          usuarios: true,
        },
        orderBy: {
          fecha_creacion: 'desc',
        },
      });

      return {
        success: true,
        data: transcripciones,
      };
    } catch (error) {
      console.error('Error al obtener las transcripciones:', error);
      throw error;
    }
  }
}
