import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../../db_connect/db_sql';

export const patch_user = async (req: Request, res: Response) => {
    try {
        interface user_req {
            token: string;
            id: number;
            Role: string;
            data: Record<string, string | number | boolean>; 
        }
        const { token, id, Role, data } = req.body as unknown as user_req;
        const canEdit: string[] = ['username','name', 'last', 'birthdate', 'available', 'phone'];
        const canEditAdmin: string[] = ['email','Role' ,...canEdit];

        try{
            jwt.verify(token as string, process.env.JWT_SECRET!);
        }catch (error) {
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!token || !id || !Role || !data || Object.keys(data).length === 0) {
            console.log(`Error in patch_user token : ${token} id : ${id} Role : ${Role} data : ${JSON.stringify(data)}`);
            return res.status(400).send('Bad Request');
        }
        const keys: string[] = Role === 'admin' || Role === 'dev' ? canEditAdmin : canEdit;
        // เช็คว่า data ที่ส่งมามี key ที่อยู่ใน keys หรือไม่ ถ้สไม่จะดป็นว่าง
        const keys_data = Object.keys(data).filter(key => keys.includes(key));

        if (keys_data.length === 0) {
            console.log(`Error in patch_user keys_data : ${keys_data}`);
            return res.status(400).send('Bad Request');
        }
        // ผลลัพธ์: [ 'id_acc', 'name', 'phone' ] 
        console.log(keys_data);  
        const userTableKeys = keys_data.filter((k) => k !== 'phone');
        // กันส่งแค่ phone เพราะจะโดน userTableKeys เอาออก แต่มันมีค่าไง
        if (userTableKeys.length > 0) {
            const selectFields = userTableKeys.map(key => `${key} = ?`).join(', ');
            const values = userTableKeys.map(key => data[key]);
            const sql: string =`UPDATE user_data SET ${selectFields} WHERE id_acc = ? AND token = ?`; //เพิ่ม token แก้บั๊กค่ือจตรงรี้
            await db.execute(sql, [...values, id, token] as any[]);
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