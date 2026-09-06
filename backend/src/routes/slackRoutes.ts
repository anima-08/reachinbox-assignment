import { Router } from 'express';
import { slackAuth, slackCallback, updateLimit } from '../controllers/slackController';

const router = Router();

router.get('/auth', slackAuth);
router.get('/callback', slackCallback);
router.post('/limit', updateLimit);

export default router;
