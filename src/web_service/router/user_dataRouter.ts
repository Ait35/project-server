import { Router } from 'express'; 
import { get_user } from '../method/user_contral/get_user/get_user';
import { All_OneData_user } from '../method/user_contral/get_user/All_OneData_user';
import { All_data_user } from '../method/user_contral/get_user/All_data_user';
import { patch_user } from '../method/user_contral/patch_user/path_user';
import { delete_user } from '../method/user_contral/delete_user/delete_user';

const router = Router();

router.get('/get_user/:attribute/:attribute_find/:data', get_user);
router.get('/get_user/:attribute/:data', All_OneData_user);
router.get('/get_user/Ao-jing/GenZ/Boon-koon-Paw-Mae/Kha-Yai-Bang-Bua/Boon-koon-Paw-Mae/Kha-Yai-Bang-Bua/:token', All_data_user);

router.patch('/patch_user/', patch_user);

router.delete('/delete_user/:id', delete_user); //id คนที่ต้องการลบ

export default router;//Boon-koon-Paw-Mae/Kha-Yai-Bang-Bua/
