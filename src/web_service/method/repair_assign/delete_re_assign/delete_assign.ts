import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../../db_connect/db_sql';
import { ResultSetHeader } from 'mysql2';

export const delete_assign = async (req: Request, res: Response) => {
    try {
        const table : string = 'repair_assign';
        const { id_acc, id_repair, token } = req.query;
        const candelete: string[] = ['id_acc', 'id_repair']; 

        try{
            jwt.verify(token as string, process.env.JWT_SECRET!);
        }catch (error) {
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!token || !id_acc || !id_repair) {
            console.log(`Error in patch_user token : ${token} id_acc : ${id_acc} id_repair : ${JSON.stringify(id_repair)}`);
            return res.status(400).send('Bad Request : Missing token or id or data');
        }
        const [getRole]: any = await db.execute(
            `SELECT Role FROM user_data WHERE token = ? AND is_deleted = FALSE`,[token as string])
        if(getRole.length === 0){
            console.log(`Error in patch_user getRole : ${getRole}`);
            return res.status(400).send('Bad Request : User not found or token invalid');
        }
        const Role: string = getRole[0].Role;

        if(Role !== 'admin' && Role !== 'dev' && Role !== 'technician'){
            return res.status(403).json({ error: 'Forbidden : does not have permission' });
        }

        const sql : string = `DELETE FROM ${table} WHERE id_acc = ? AND id_repair = ?`;
        const [result] = await db.execute<ResultSetHeader>(sql , [id_acc as string, id_repair as string]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        console.log(result);
        res.status(200).json({  //slice(1) คือเอาตัวแรกออก
            message: `${table.at(0)?.toUpperCase() + table.slice(1)} deleted successfully`,
            ... result
        });

    }catch(error : any){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

}; 