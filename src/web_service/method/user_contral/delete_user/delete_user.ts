import {Request, Response} from "express";
import {db} from "../../../db_connect/db_sql";
import jwt from "jsonwebtoken";
import {ResultSetHeader} from "mysql2/promise";

export const delete_user = async(req: Request , res : Response)=>{
    try{
        const table = 'user_data';
        interface user_req{
            token : string;
            status : boolean;
        }
        const id_target = req.params.id; //id_pole
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
        console.log( "Req From id_acc : " + req_from[0].id_acc + " " + "id_acc target : " + Number(id_target));
        if(req_from[0].Role !== "admin" && req_from[0].Role !== "dev" && req_from[0].id_acc !== Number(id_target)){
            return res.status(403).json({ error: 'Forbidden : does not have permission' });
        }

        const connection = await db.getConnection();
        try{
            await connection.beginTransaction();

            const [user_del] = await connection.execute<ResultSetHeader>(`UPDATE ${table} SET is_deleted = ? WHERE id_acc = ? ;`,[status , id_target as string]);

            if (user_del.affectedRows === 0) {
                console.log(`Rollback: ${table} not found or token invalid`);
                await connection.rollback();
                connection.release();
                return res.status(404).json({ error: "Target user not found" });
            }
            let FK_update = { affectedRows: 0 };

            if(status === true){
                const [affe] = await connection.execute<ResultSetHeader>(`DELETE FROM user_phone WHERE id_acc = ?;`, [id_target as string]);
                FK_update = affe;
            }
            await connection.commit(); 
            connection.release(); 
            console.log(`${table} ${status ? 'deleted' : 'restored'} successfully`);
            res.status(200).json({
                message: `${table} ${status ? 'deleted' : 'restored'} successfully`,
                user_affected: user_del.affectedRows,
                phone_affected: FK_update.affectedRows
            });
  
        }catch (error) {
            console.log(error);
            await connection.rollback();
            connection.release();
            throw error;
        }
    }
    catch(error : any) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}
