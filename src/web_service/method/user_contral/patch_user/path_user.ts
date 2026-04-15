import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../../../db_connect/db_sql';

export const patch_user = async (req: Request, res: Response) => {
    try {
        interface user_req {
            token: string; // token ที่คนจะแก้ส่งมา
            id: number; //id ทีต้องเขาการแก้
            data: Record<string, string | number | boolean>; 
        }
        const { token, id, data } = req.body as unknown as user_req;
        const canEdit: string[] = ['username','name', 'last', 'birthdate', 'available', 'phone'];
        const canEditAdmin: string[] = ['email',"password",'Role' ,...canEdit];

        try{
            jwt.verify(token as string, process.env.JWT_SECRET!);
        }catch (error) {
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!token || !id  || !data || Object.keys(data).length === 0) {
            console.log(`Error in patch_user token : ${token} id : ${id} data : ${JSON.stringify(data)}`);
            return res.status(400).send('Bad Request');
        }
        const [Role]: any = await db.execute(`SELECT Role, id_acc FROM user_data WHERE token = ? AND is_deleted = FALSE`,[token]);

        if (Role.length === 0) {
            console.log(`Error in patch_user Role : ${Role}`);
            return res.status(400).send('Bad Request');
        }

        if ((Role[0].Role === 'user' || Role[0].Role === 'technician') && Role[0].id_acc !== Number(id)) {
            return res.status(403).json({ error: 'Forbidden : You can only edit your own profile' });
        }
        const keys: string[] = Role[0].Role === 'admin' || Role[0].Role === 'dev' ? canEditAdmin : canEdit;
        // เช็คว่า data ที่ส่งมามี key ที่อยู่ใน keys หรือไม่ ถ้สไม่จะดป็นว่าง
        let keys_data = Object.keys(data).filter(key => keys.includes(key));

        if (keys_data.length === 0) {
            console.log(`Error in patch_user keys_data : ${keys_data}`);
            return res.status(400).send('Bad Request');
        }
        // ผลลัพธ์: [ 'id_acc', 'name', 'phone' ] 
        console.log(keys_data);  
        // ไม่มีทางเป็น User or ช่าง เพราะเขียนดักไว้แล้ว
        if(keys_data.includes('password')){
            data['password'] = await bcrypt.hash(data['password'] as string, 10);
        }

        const userTableKeys = keys_data.filter((k) => k !== 'phone');
        // กันส่งแค่ phone เพราะจะโดน userTableKeys เอาออก แต่มันมีค่าไง
        if (userTableKeys.length > 0) {
            const selectFields = userTableKeys.map(key => `${key} = ?`).join(', ');
            const values = userTableKeys.map(key => data[key]);
            const sql: string =`UPDATE user_data SET ${selectFields} WHERE id_acc = ?`; 
            await db.execute(sql, [...values, id] as any[]);
        }
             
        if(keys_data.includes('phone')){
            
            const sql_phone: string = `UPDATE user_phone SET phone = ? WHERE id_acc = ?`;
            (await db.execute(sql_phone, [data.phone, id]  as any[]));
        }
        
        res.status(200).json({ message: 'User updated successfully' });

    }catch(error : any){

        // รหัส 1062 หรือ ER_DUP_ENTRY คือรหัสของ "ข้อมูลซ้ำ" ในตารางที่มีการทำ UNIQUE ไว้
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            console.log('Duplicate data update attempted:', error.sqlMessage);
            
            // ใช้ Status 409 Conflict หรือ 400 Bad Request ก็ได้
            return res.status(409).json({ 
                error: 'ข้อมูลนี้มีคนใช้ไปแล้วครับ (เช่น Username, Email หรือเบอร์โทรซ้ำ)' 
            });
        }
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

}; 