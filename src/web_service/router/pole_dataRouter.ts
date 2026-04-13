import { Router ,Request, Response} from 'express'; 
import { get_pole } from '../method/pole_contral/get_pole/get_pole';
import { post_pole } from '../method/pole_contral/pose_pole/pose_pole';

const router = Router();
//ใช้ query เช่น http://localhost:3000/get_pole?id=1&token=token
//http://localhost:3000/get_pole?token=token อันนี้คือดึงหมด
router.get('/get_pole', get_pole);

router.post('/post_pole/newPole', post_pole);

export default router;