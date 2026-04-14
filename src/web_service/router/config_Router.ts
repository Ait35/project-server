import { Router ,Request, Response} from 'express'; 
import { post_config } from '../method/config_contral/post_config/post_config';
import { get_config } from '../method/config_contral/get_config/get_config';
import {  patch_config } from '../method/config_contral/patch_config/patch_config';

const router = Router();

router.post('/post_config/newConfig', post_config);

router.get('/get_config', get_config);

router.patch('/patch_config/:token/:id', patch_config); //id_acc

export default router;