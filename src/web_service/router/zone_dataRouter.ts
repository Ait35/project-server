import { Router ,Request, Response} from 'express'; 
import { post_zone} from '../method/zone_contral/post_zone/post_zone';
import { get_zone } from '../method/zone_contral/get_zone/get_zone';
import { patch_zone } from '../method/zone_contral/patch_zone/patch_zone';

const router = Router();

router.post('/post_zone/newZone', post_zone);

router.get('/get_zone', get_zone);

router.patch('/patch_zone/:token/:id', patch_zone);//id_acc

export default router;