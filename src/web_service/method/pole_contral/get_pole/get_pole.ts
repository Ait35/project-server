import { Request, Response }from 'express';
import { db } from '../../../db_connect/db_sql';
import jwt from 'jsonwebtoken';

export const get_pole = async (req : Request, res : Response) => {
    try{
        interface pole_req{
            token : string;
            id : string;
            height : string;
            status : string;
            bulb_type : string;
            max_watt : string;
            bulb_size : string;
            latitude : string;  
            longitude  : string;
            id_zone : string;
        }
        const data = req.query as unknown as pole_req;
        const canget : string[] = ['id' , 'height' , 'status' , 'bulb_type' , 'max_watt' , 'bulb_size' , "latitude", "longitude"   , 'id_zone'];
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
        let sql: string = `SELECT * FROM pole WHERE is_deleted = FALSE`;
        const values: any[] = [];
        //เช็คส่ามีแค่ token หรือไม่
        if(keys.length > 0){
            const select = keys.map(key => {
                if (key === 'id') {
                    values.push(String(data[key]).trim());
                    return 'id_pole = ?';
                }
                else if (key === 'bulb_type') {
                    values.push(`%${String(data[key]).trim()}%`);
                    return `${key} LIKE ?`;
                }   
                else{
                    values.push(data[key as keyof typeof data].trim());
                    return `${key} = ?`;
                }
            }).join(' AND ');

            sql += ` AND ${select}`;
        }
        
        const [rows] : any[] = await db.execute(sql, values);
        if(rows.length === 0) {
            return res.status(404).send('Not Found');
        }
    
        res.status(200).json({
                message : 'Get pole successful',
                ... rows
            }
        );
        
    }catch(error)
    {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}