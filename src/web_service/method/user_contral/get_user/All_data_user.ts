import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../../db_connect/db_sql';

//route get_user/:type
export const All_data_user = async (req: Request, res: Response) => {
    try{
        const {token} = req.params;
        const canfind = ['id_acc', 'username', 'email', 'name', 'last', 'birthdate', 'Role', 'available'];
        if(!token)
        {
            console.log(`Error in All_data_user token is missing`);
            return res.status(400).send('Bad Request');
        }
        //ตรวจสอบ token ว่าถูกต้องและไม่หมดอายุ
        try{
            jwt.verify(token as string, process.env.JWT_SECRET!);
        }catch (error) {
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const selectFields = canfind.map(field => `u.${field}`).join(', ');
        const sql = `
            SELECT 
                ${selectFields}, 
                GROUP_CONCAT(p.phone SEPARATOR ', ') AS phone -- มัดรวมหลายเบอร์เข้าด้วยกัน
            FROM user_data u
            LEFT JOIN user_phone p ON u.id_acc = p.id_acc
            GROUP BY u.id_acc -- ยุบรวมตาม ID ของ User
        `;
        const [row] = await db.execute<any[]>(sql);
        //ถ้าเขียนเป็น Obj หรือใช้ {} กับ ...array จะสร้าง Key จาก Index ของ Array ซึ่งทั้งคู่ Index  คือ 0 มันจะทำให้ key ทับกัน ข้อมูลหาย
        // const row = [ 
        //     ...(rowuser as any[]), 
        //     ...(rowphone as any[])
        // ]; รวม array 2 ก้อน

        if((row as any[]).length === 0) {
            console.log(`User not found with data is empty`);
            return res.status(400).json({ error: 'User not found' });
        }
        res.status(200).json({
            message: 'Get user successful',
            data:row
        });
    }catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};