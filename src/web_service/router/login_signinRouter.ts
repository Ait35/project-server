import { Router ,Request, Response} from 'express'; 
import { login, signin } from '../method/login_signin';

const router = Router();

router.post('/login', login);
router.post('/signin', signin);

router.get('/', (res:Response) => {
  res.status(404).send('404 Not Found'); //ส่งข้อความว่าไม่ 404 เมื่อเข้าถึง root ของ router นี้
});

export default router;
