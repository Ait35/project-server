import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../../db_connect/db_sql';

export const patch_pole = async (req: Request, res: Response) => {
    try {
        const table = 'pole';
        const id_current = 'id_pole';
        interface user_req {
            id: number;
            data: Record<string, string | number | boolean>; 
        }
        const token : string = req.params.token as string;
        const id_acc : string = req.params.id as string;
        const { id, data } = req.body as unknown as user_req;
        const canEditAdmin: string[] = ['height' , 'status' , 'bulb_type' , 'max_watt' , 'bulb_size' , "latitude", "longitude"  , 'id_zone'];

        try{
            jwt.verify(token as string, process.env.JWT_SECRET!);
        }catch (error) {
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!token || !id || !data || Object.keys(data).length === 0) {
            console.log(`Error in patch_user token : ${token} id : ${id} data : ${JSON.stringify(data)}`);
            return res.status(400).send('Bad Request : Missing token or id or data');
        }
        const [getRole]: any = await db.execute(
            `SELECT Role FROM user_data WHERE id_acc = ? AND token = ? AND is_deleted = FALSE`,[id_acc , token])
        if(getRole.length === 0){
            console.log(`Error in patch_user getRole : ${getRole}`);
            return res.status(400).send('Bad Request : User not found : User not found or token invalid');
        }
        const Role: string = getRole[0].Role;

        if(Role !== 'admin' && Role !== 'dev'){
            return res.status(403).json({ error: 'Forbidden : does not have permission' });
        }
        // เช็คว่า data ที่ส่งมามี key ที่อยู่ใน canEdit (includes return true or false) หรือไม่ ถ้สไม่จะดป็นว่าง
        const keys = Object.keys(data).filter(key => canEditAdmin.includes(key));

        if (keys.length === 0) {
            console.log(`Error in patch_user keys_data : ${keys}`);
            return res.status(400).send('Bad Request');
        }
        console.log(keys);  

        // กันส่งแค่ phone เพราะจะโดน userTableKeys เอาออก แต่มันมีค่าไง
        const selectFields = keys.map(key => `${key} = ?`).join(', ');
        const values = keys.map(key => data[key]);
        const sql: string =`UPDATE ${table} SET ${selectFields} WHERE ${id_current} = ?`;
        await db.execute(sql, [...values, id] as any[]);
        const [row] = await db.execute<any[]>(`SELECT ${keys.join(', ')} FROM ${table} WHERE ${id_current} = ?`,[id]);
        
        res.status(200).json({ 
            message: `${table.at(0)?.toUpperCase()} updated successfully`,
            ... row[0]
        });

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