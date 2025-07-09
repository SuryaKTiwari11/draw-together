import express from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.post('/signup', signup);
router.post('/login', login);

export default router;