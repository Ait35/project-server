import {Request, Response} from "express";
import {db} from "../../../db_connect/db_sql";
import jwt from "jsonwebtoken";
import {ResultSetHeader } from "mysql2/promise";

export const delete_zone = async(req: Request , res : Response)=>{
    try{
        const table = 'zone';
        const id_name = 'id_zone';
        const FK_table = 'pole';
        
        interface user_req{
            token : string;
            status : boolean;
        }
        const id_target = req.params.id;
        const {token , status } = req.body as unknown as user_req; 
        if(!token || status === undefined || status === null){
            return res.status(400).send("Bad Request : Missing token or id or del");
        }
        try{
            jwt.verify(token as string, process.env.JWT_SECRET!);
        }catch (error) {
            console.log('Token expired or invalid in token');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const sql_from = `SELECT Role, id_acc FROM user_data WHERE token = ? AND is_deleted = FALSE;`;
        const [req_from] = await db.execute<any[]>(sql_from , [token]);

        if(req_from.length === 0){
            console.log(`${table} not found or token invalid`);
            return res.status(400).send( `Bad Request : ${table} not found or token invalid`);
        }
        console.log("Req From id_acc : " + req_from[0].id_acc + " " + `${id_name} target : `+ Number(id_target));

        if(req_from[0].Role !== "admin" && req_from[0].Role !== "dev"){
            return res.status(403).json({ error: 'Forbidden : does not have permission' });
        }

        const connection = await db.getConnection(); 
        
        try {
            await connection.beginTransaction(); 

            const [soft_del] = await connection.execute<ResultSetHeader>(
                `UPDATE ${table} SET is_deleted = ? WHERE ${id_name} = ? AND ${id_name} != 1`,
                [status, id_target as string]
            );

            if (soft_del.affectedRows === 0) {
                console.log('Begin Rollback');
                await connection.rollback();
                connection.release();
                return res.status(404).json({ error: `Target ${table} not found or cannot modify default config` });
            }

            let FK_update = { affectedRows: 0 };

            if (status === true) {
                console.log("Zone Update to Default");
                const sql_zone = `UPDATE ${FK_table} SET ${id_name} = 1 WHERE ${id_name} = ? AND is_deleted = FALSE;`;
                const [result] = await connection.execute<ResultSetHeader>(sql_zone, [id_target as string]);
                FK_update = result as ResultSetHeader;
            }

            await connection.commit(); 
            connection.release(); 
            console.log(`${table} ${status ? 'deleted' : 'restored'} successfully`);

            res.status(200).json({
                message: `${table} ${status ? 'deleted' : 'restored'} successfully`,
                config_affected: soft_del.affectedRows,
                zone_affected: FK_update.affectedRows
            });

        } catch (db_error) {
            await connection.rollback();
            connection.release();
            throw db_error; // โยน Error ออกไปให้ Catch ตัวนอกสุด
        }

    } catch (error: any) {
        console.log("Delete Config Error:", error);
        res.status(500).send("Internal Server Error");
    }
}