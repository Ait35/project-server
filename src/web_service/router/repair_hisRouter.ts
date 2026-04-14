import { Router ,Request, Response} from 'express'; 
import { post_repair_his } from '../method/repair_his_contral/post_repair_his/post_repair';
import { get_repair_his } from '../method/repair_his_contral/get_repair_his/get_his';
import { patch_repair_his } from '../method/repair_his_contral/patch_repair_his/patch_repair_his';

const router = Router();

router.get('/get_his', get_repair_his);

router.post('/post_his/newHis', post_repair_his);

router.patch('/patch_his/:token/:id', patch_repair_his);//id_acc

export default router;