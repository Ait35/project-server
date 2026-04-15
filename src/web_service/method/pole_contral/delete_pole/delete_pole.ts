import {Request, Response} from "express";
import {db} from "../../../db_connect/db_sql";
import jwt from "jsonwebtoken";
import {ResultSetHeader} from "mysql2/promise";

export const delete_pole = async(req: Request , res : Response)=>{
    try{
        const table = 'pole';
        const id_name = 'id_pole';
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
        console.log("Req From id_acc : " + req_from[0].id_acc + " " + `${id_name} target : ` + Number(id_target));
        if(req_from[0].Role !== "admin" && req_from[0].Role !== "dev"){
            return res.status(403).json({ error: 'Forbidden : does not have permission' });
        }

        const [user_del] = await db.execute<ResultSetHeader>(`UPDATE ${table} SET is_deleted = ? WHERE ${id_name} = ? ;`,[status , id_target as string]);

        if (user_del.affectedRows === 0) {
             return res.status(404).json({ error: "Target user not found" });
        }

        res.status(200).json({
            message: `${table} deleted successfully`,
            ...user_del
        })
    }
    catch(error : any) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}
