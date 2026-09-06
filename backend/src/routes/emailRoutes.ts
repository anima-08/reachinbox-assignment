import { Router } from 'express';
import { scheduleEmail, getEmails, searchEmails } from '../controllers/emailController';

const router = Router();

router.post('/schedule', scheduleEmail);
router.get('/search', searchEmails);
router.get('/', getEmails);

export default router;
