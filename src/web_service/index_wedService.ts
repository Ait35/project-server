import { Router } from 'express'; 
import userRouter from './router/user_dataRouter';
import login_signinRouter from './router/login_signinRouter';
import poleRouter from './router/pole_dataRouter';
import zoneRouter from './router/zone_dataRouter';
import configRouter from './router/config_Router';
import  logRouter  from './router/log_Router';
import repairRouter from './router/repair_hisRouter';
import assignRouter from './router/re_assign_Router';
import auto_increment from './router/auto_increment';


const router = Router();

router.use(login_signinRouter);
router.use(userRouter);
router.use(poleRouter);
router.use(zoneRouter);
router.use(configRouter);
router.use(logRouter);
router.use(repairRouter);
router.use(assignRouter);
router.use(auto_increment);

export default router;