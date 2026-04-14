import {Request, Response} from 'express';
import {db} from '../../../db_connect/db_sql';
import jwt from 'jsonwebtoken';
import { ResultSetHeader } from 'mysql2';

export const post_repair_his = async(req: Request, res: Response) => {
    const table = 'repair_history';
    try{
        interface pose_req{
            token : string;
            username : string;
            data : Record<string, string | number >; //obj
            }
        const data_req : pose_req = req.body ;
        if (!data_req || !data_req.token || !data_req.username || !data_req.data) {
            return res.status(400).send('Bad Request : Missing Token, Username, or Data');
        }
        const data = data_req.data;
        const canpost : string[] = ["status", "time_breaks", "time_repair_start","time_repair_end", "id_pole" , "name_part"];
        //ถ้า array มีจำนวนมากกว่า “ที่คาดไว้” แต่ทุกตัวยังตรงกับเงื่อนไขทั้งหมด every ก็จะได้ true
        if(!canpost.every(k => Object.keys(data).includes(k))){
            return res.status(400).send('Bad Request : Missing Data');
        }

        const keys = canpost;
        try{
            jwt.verify(data_req.token as string, process.env.JWT_SECRET!);
        }catch(error){
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        //execute ดีกว่า query เพราะใช้ prepared statement เราสามารถใช้ ? แทนค่าได้ แถมเร็วกว่า query
        const [rowuser]: any = await db.execute(
            `SELECT Role FROM user_data WHERE username = ? AND token = ? AND is_deleted = FALSE`, [data_req.username , data_req.token]);

        if ( rowuser.length === 0) {
            return res.status(403).json({ error: 'Forbidden : missing username or token' });
        } 
        const userPermission = rowuser[0];
        if (userPermission.Role !== 'admin' && userPermission.Role !== 'dev' && userPermission.Role !== 'technician') {
            console.log(userPermission.Role)
            return res.status(403).json({ error: `Forbidden : You do not have permission to add ${table}`});
        }

        const values = keys.map(k => data[k]); // เอาค่าที่อยู่ใน keys มาใส่ใน values
        const select = keys.join(', ');
        const sql = `INSERT INTO ${table} (${select}) VALUES (${keys.map(() => '?').join(', ')});`;
        const [callback_insert] = await db.execute<ResultSetHeader>(sql, values as any);
        console.log(callback_insert);

        res.status(201).json({
            message : "success",
            id_repair : callback_insert.insertId,
            ... callback_insert
        });
    }catch (error) {
        console.log(`Error in ${table}`, error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}