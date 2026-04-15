import {Request, Response} from 'express';
import { db } from '../../../db_connect/db_sql';

//route get_user/:type
export const get_user = async (req: Request, res: Response) => {
    try{
        let {attribute, attribute_find, data} = req.params;
        const canfind = ['id','id_acc', 'username', 'email', 'name', 'last', 'birthdate', 'Role', 'available', 'phone'];
        if(!attribute || !attribute_find || !data || attribute === 'password' || attribute === 'token' || !canfind.includes(attribute as string) || !canfind.includes(attribute_find as string))
        {
            console.log(`Error in get_user attribute : ${attribute} data : ${data}`);
            return res.status(400).send('Bad Request');
        }
        if (attribute_find === 'Role') {
            return res.status(400).json({ error: 'Cannot search by Role' });
        }

        if(attribute === 'id'){
            attribute = 'id_acc';
        }else if(attribute_find === 'id'){
            attribute_find = 'id_acc';
        }
        let [row]: any[] = [];
        if(attribute === 'phone' && attribute_find === 'id_acc') {
             [row] = await db.execute(`SELECT ${attribute} FROM user_phone WHERE ${attribute_find} = ?`, [data]);
        }else if(attribute === 'phone' && attribute_find !== 'id_acc') {
            let [row_acc] = await db.execute(`SELECT id_acc FROM user_data WHERE ${attribute_find} = ?`, [data]);

            const id_acc = (row_acc as any[])[0].id_acc;
            [row] = await db.execute(`SELECT ${attribute} FROM user_phone WHERE id_acc = ? AND is_deleted = FALSE`, [id_acc]);
        }else if(attribute_find === 'phone') {
            let [row_acc] = await db.execute(`SELECT id_acc FROM user_phone p user_data u WHERE p.phone = ? AND u.is_deleted = FALSE`, [data]);   
            const id_acc = (row_acc as any[])[0].id_acc;
            [row] = await db.execute(`SELECT ${attribute} FROM user_data WHERE id_acc = ? AND is_deleted = FALSE`, [id_acc]);
        }
        else{
            [row] = await db.execute(`SELECT ${attribute} FROM user_data WHERE ${attribute_find} = ? AND is_deleted = FALSE`, [data]);
        }
    
        if((row as any[]).length === 0) {
            console.log(`User not found with ${attribute_find} : ${data}`);
            return res.status(400).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            message: 'Get user successful',
            ... (row as any[])[0]
        });
    }catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};