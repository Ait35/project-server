import { Router ,Request, Response} from 'express'; 
import { post_zone} from '../method/zone_contral/post_zone/post_zone';
import { get_zone } from '../method/zone_contral/get_zone/get_zone';

const router = Router();

router.post('/post_zone/newZone', post_zone);

router.get('/get_zone', get_zone);

export default router;