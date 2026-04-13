import { Router ,Request, Response} from 'express'; 
import { post_config } from '../method/config/post_config/post_config';
import { get_config } from '../method/config/get_config/get_config';

const router = Router();

router.post('/post_config/newConfig', post_config);

router.get('/get_config', get_config);

export default router;