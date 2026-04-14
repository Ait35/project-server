import { Router ,Request, Response} from 'express'; 
import { get_log } from '../method/pole_log_contral/get_pole_log/get_log';
import { post_log } from '../method/pole_log_contral/post_pole_log/post_log';

const router = Router();

router.get('/get_log' , get_log);
router.post('/post_log/newLog' , post_log);

export default router;