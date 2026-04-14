import {Request, Response} from 'express';
import {db} from '../../../db_connect/db_sql';
import jwt from 'jsonwebtoken';
import { ResultSetHeader } from 'mysql2';

export const post_zone = async(req: Request, res: Response) => {
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
        const canpost : string[] = ['name_zone' , 'id_config' ];

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
        if (userPermission.Role !== 'admin' && userPermission.Role !== 'dev') {
            console.log(userPermission.Role)
            return res.status(403).json({ error: 'Forbidden : You do not have permission to add poles' });
        }

        const values = keys.map(k => data[k]); // เอาค่าที่อยู่ใน keys มาใส่ใน values
        const select = keys.join(', ');
        const sql = `INSERT INTO zone (${select}) VALUES (${keys.map(() => '?').join(', ')});`;
        const [row] = await db.execute<ResultSetHeader>(sql, values as any);

        res.status(201).json({
            message : "success",
            id_zone : row.insertId,
            ...row
        });
    }catch (error) {
        console.log('Error in post_zone', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}