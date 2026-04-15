import { Router ,Request, Response} from 'express'; 
import { post_assign } from '../method/repair_assign/pose_re_assign/pose_assign';
import { get_assign } from '../method/repair_assign/get_re_assign/get_assign';
import { delete_assign } from '../method/repair_assign/delete_re_assign/delete_assign';

const router = Router();

router.post('/post_assign/newAssign', post_assign);

router.get('/get_assign', get_assign);

router.delete('/delete_assign', delete_assign);//id_acc

export default router;
