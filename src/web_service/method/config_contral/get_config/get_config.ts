import { Request, Response }from 'express';
import { db } from '../../../db_connect/db_sql';
import jwt from 'jsonwebtoken';
import console from 'node:console';

export const get_config = async (req : Request, res : Response) => {
    try{
        //set ตรงนี้
        const table = 'config';
        const id_current = 'id_config = ?';

        interface req_data{
            token : string;
            id : string;
            id_config : string;
        }
        const data = req.query as unknown as req_data;
        const canget : string[] = ['id','mode' , 'time_on' , 'time_off' , 'brightness' , 'lux' , 'rule_lux'];
        const keys = Object.keys(data).filter(key => canget.includes(key));

        if (!data.token){ 
            return res.status(400).send('Bad Request : Missing Token');
        }

        try{
            jwt.verify(data.token as string, process.env.JWT_SECRET!);
        }catch (error) {
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        //โชว์หมดทั้ง sql สำหรับ มีแค่ token
        let sql: string = `SELECT * FROM ${table}`;
        console.log(keys);
        //เช็คส่ามีแค่ token หรือไม่
        if(keys.length > 0){
            const select = keys.map(key => {
                if (key === 'id') return id_current;
                return `${key} = ?`;
            }).join(' AND ');

            sql += ` WHERE ${select}`;
            // const push_in_Values = keys.map(key => data[key as keyof typeof data]);
            // values.push(...push_in_Values);
        }
        const values: any[] = keys.map(key => data[key as keyof req_data]);
        const [rows] : any[] = await db.execute(sql, values);
        if(rows.length === 0) {
            return res.status(404).send('Not Found');
        }
    
        res.status(200).json({
                message : `Get ${table} successful`,
                ... rows
            }
        );
        
    }catch(error)
    {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}