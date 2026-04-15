import { db } from "../db_connect/db_sql";
import { Response , Request , Router } from 'express'
import {ResultSetHeader} from 'mysql2';

const router = Router();

router.patch('/options_increment/table/:nameTable', async(req: Request , res : Response)=>{
    try {
        const nameTable : string = req.params.nameTable as string;
        if(!nameTable) return res.status(400).send('Bad Request : Missing nameTable');

        const [row] = await db.execute<ResultSetHeader>(`ALTER TABLE ${nameTable} AUTO_INCREMENT = 1;`);
        console.log(row);
        console.log("INCREMENT SUCCESS ");
        
        res.status(200).json(
            {"massage" : "INCREMENT SUCCESS ", "row" : row});
    }catch (error : any) {
        console.log("INCREMENT ERROR");
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

export default router;

//call in controller when error 500
export const SetIncrement_static = async(nameTable : string)=>{
    const res: Response = {} as Response;
    try {
        if(!nameTable) return res.status(400).send('Bad Request : Missing nameTable');

        const [row] = await db.execute(`ALTER TABLE ${nameTable} AUTO_INCREMENT = 1;`);
        console.log("INCREMENT SUCCESS : No response");
    }catch (error : any) {
        console.log("INCREMENT ERROR");
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}