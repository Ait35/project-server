import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../../db_connect/db_sql';

export const All_OneData_user = async (req: Request, res: Response) => {
    try {
        interface user_req {
            attribute: string;
            data: string | number | boolean;
        }
        const canfind = ['id', 'id_acc', 'username', 'email', 'name', 'last', 'birthdate', 'Role', 'available', 'phone'];
        let { attribute, data } = req.params as unknown as user_req;

        if (!attribute || !data || attribute === 'password' || !canfind.includes(attribute as string)) {
            console.log(`Error in get_user attribute : ${attribute} data : ${data}`);
            return res.status(400).send('Bad Request');
        }
        if (attribute === 'Role') {
            return res.status(400).json({ error: 'Cannot search by Role' });
        }
        if (attribute === 'id') {
            attribute = 'id_acc';
        }

        const selectFields = canfind
        .filter((v): v is string => v !== 'phone' && v !== 'id')
        .map(f => `u.${f}`)
        .join(', ');
        // กำหนดว่า attribute ที่ค้นหาอยู่ในตารางไหน? (p = phone, u = user)
        const targetTable = attribute === 'phone' ? 'p' : 'u';

        if(attribute == 'token'){
             try{
                    jwt.verify(attribute as string, process.env.JWT_SECRET!);
            }catch (error) {
                    console.log('Token expired or invalid in token');
                    return res.status(401).json({ error: 'Unauthorized' });
            }
            const [id] = await db.execute<any[]>(`SELECT iad_acc FROM user_data WHERE ${attribute} = ?`, [data]);
            const sql = `
            SELECT 
                ${selectFields}, 
                GROUP_CONCAT(p.phone SEPARATOR ', ') AS phone 
            FROM user_data u
            LEFT JOIN user_phone p ON u.id_acc = p.id_acc
            WHERE ${targetTable}.${id} = ?
            GROUP BY u.id_acc`;
            const [rows] = await db.execute<any[]>(sql, [data]);
            if (rows.length === 0) {
                console.log(`User not found with ${attribute} : ${data}`);
                return res.status(400).json({ error: 'User not found' });
            }

            res.status(200).json({
                message: 'Get user successful',
                ...rows[0]
            });
        }

        const sql = `
            SELECT 
                ${selectFields}, 
                GROUP_CONCAT(p.phone SEPARATOR ', ') AS phone 
            FROM user_data u
            LEFT JOIN user_phone p ON u.id_acc = p.id_acc
            WHERE ${targetTable}.${attribute} = ?
            GROUP BY u.id_acc
        `;
        const [rows] = await db.execute<any[]>(sql, [data]);
        
        if (rows.length === 0) {
            console.log(`User not found with ${attribute} : ${data}`);
            return res.status(400).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'Get user successful',
            ...rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// export const All_OneData_user = async (req: Request, res: Response) => {
//     try{
//         interface user_req{
//             attribute: string;
//             data: string | number | boolean;
//         } 
//         const canfind = ['id' ,'id_acc', 'username', 'email', 'name', 'last', 'birthdate', 'Role', 'available', 'phone'];
//         let { attribute, data } = req.params as unknown as user_req;

//         if(!attribute  || !data || attribute === 'password' || attribute === 'token' || !canfind.includes(attribute as string) )
//         {
//             console.log(`Error in get_user attribute : ${attribute} data : ${data}`);
//             return res.status(400).send('Bad Request');
//         }
//         if (attribute === 'Role') {
//             return res.status(400).json({ error: 'Cannot search by Role' });
//         }

//         if(attribute === 'id'){
//             attribute = 'id_acc';
//         }
//         // any คือ type ที่บอกว่าไม่รู้ว่า data ข้างในจะ type อะไร แต่รู้ว่าเป็น array
//         let [row]: any[] = []; 
//         let phoneValue: string | null = null;

//         if(attribute === 'phone') {
//              const [row_acc] = await db.execute<any[]>(`SELECT id_acc FROM user_phone WHERE ${attribute} = ?`, [data]);
//              if((row_acc as any[]).length === 0) {
//                 console.log(`User not found with ${attribute} : ${data}`);
//                 return res.status(400).json({ error: 'User not found' });
//              }

//              const id_acc = (row_acc as any[])[0].id_acc;
//              const [userRows] = await db.execute<any[]>(`SELECT ${canfind.filter((v): v is string => v !== 'phone' && v !== 'id').join(', ')} FROM user_data WHERE id_acc = ?`, [id_acc]);
//              const [phoneRows] = await db.execute<any[]>(`SELECT ${attribute} FROM user_phone WHERE id_acc = ?`, [id_acc]);

//              row = userRows as any[];
//             // ? ถ้าไม่มีข้อมูลที่มาจาก sql (กรณีที่ไม่มี field) จะได้ undefined ทันทีไม่ทำ ?? ต่อ
//              phoneValue = (phoneRows as any[])[0]?.phone ?? null; //ถ้าไม่มีข้อมูลใน phone จะได้ null แทน
//         }
//         else{//ถ้าไม่ใช่ [row] จะเป็น array ซ้อน array เพราะ sql จะ return array 2 ก้อน ในนี้ row จึงมี2 แล้วไปถูกตักตรง resultRow อีกที ต้องใช้ [row] ถึงจะเอามา 1 array 
//             row = await db.execute<any[]>(`SELECT ${canfind.filter((v): v is string => v !== 'phone' && v !== 'id').join(', ')} FROM user_data WHERE ${attribute} = ?`, [data]);
//             //เมื่อ array ถูกนำไปร่วมกับ object จะทำให้ key เป็น index ของ array และ value เป็นค่าของ array
//             row = (row as any[])[0]; //row = (row as any[])[0]; ได้ข้อมูล แต่ถ้า (row as any[0]) จะได้ array
            
//             const [idrow] = await db.execute<any[]>(`SELECT id_acc FROM user_data WHERE ${attribute} = ?`, [data]);
//             const [phowneRows] = await db.execute<any[]>(`SELECT phone FROM user_phone WHERE id_acc = ?`, [(idrow as any[])[0].id_acc]);
//             phoneValue = (phowneRows as any[])[0]?.phone ?? null; //ถ้าไม่มีข้อมูลใน phone จะได้ null แทน
//         }
    
//         if((row as any[]).length === 0) {
//             console.log(`User not found with ${attribute} : ${data}`);
//             return res.status(400).json({ error: 'User not found' });
//         }
//         //... คือ ก๊อปค่าจาก object เข้าสู่ object ใหม่ โดยก๊อปทุกตัว
//         const resultRow = {
//             ... (row as any[])[0],
//             ...(phoneValue !== null ? { phone: phoneValue } : {})
//         };

//         res.status(200).json({
//             message: 'Get user successful',
//             ...resultRow
//         });
//     }catch(error){
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// };