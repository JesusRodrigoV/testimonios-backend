import express from 'express';
import type { RequestHandler } from 'express';
import { ForoComentarioController } from '../controllers/forocomentario.controller';
import { authenticateToken } from '../middleware/authentication';

const router = express.Router();

// Obtener todos los comentarios
router.get('/', authenticateToken, ForoComentarioController.getAll as RequestHandler);

// Obtener comentarios por ID del tema
router.get('/tema/:temaId', authenticateToken, ForoComentarioController.getByTemaId as RequestHandler);

// Obtener un comentario específico
router.get('/:id', authenticateToken, ForoComentarioController.getById as RequestHandler);

// Crear un nuevo comentario
router.post('/', authenticateToken, ForoComentarioController.create as RequestHandler);

// Actualizar un comentario
router.put('/:id', authenticateToken, ForoComentarioController.update as RequestHandler);

// Eliminar un comentario
router.delete('/:id', authenticateToken, ForoComentarioController.delete as RequestHandler);

export default router;
