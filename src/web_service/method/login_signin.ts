import e, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db_connect/db_sql';
import { ResultSetHeader } from 'mysql2';


 export const login = async (req: Request, res: Response) => {
  try {
    const {email , password} = req.body; //req.body คือ เป็น object ที่มี key value
    if(!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    //rows คือ ข้อมูลจากการ sql โดยเป็น array เก็บ object ที่มี key เป็นชื่อ column และ value เป็นค่าของ column นั้นๆ
    const [rows] = await db.execute<any[]>('SELECT * FROM user_data WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    //แปลงรหัสผ่านที่รับมาเป็นภาษาเอเลี่ยน มาเทียบกับรหัสผ่านในฐานข้อมูล
    if (!await bcrypt.compare(password, (rows as any[])[0].password)) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    //สร้าง token ใหม่
    let token: string = (rows as any[])[0].token;
    try {
        jwt.verify((rows as any[])[0].token, process.env.JWT_SECRET!);
    }catch (error) {
      console.log('Token expired, new token generated');
      let exist : any[];
      do {
        token = gentoken((rows as any[])[0].id_acc);
          //ไม่ได้เอา con_db ไป select เอา connection ที่ว่างอยู่ไป select จะได้ไวๆ
        [exist] = await db.execute<any[]>(`SELECT 1 FROM user_data WHERE token = ?`, [token]);
      } while (exist.length > 0); //เช็ค id และ token 
      await db.execute('UPDATE user_data SET token = ? WHERE id_acc = ?', [token, (rows as any[])[0].id_acc]);
    }
    //console.log(rows[0]);
    res.status(200).json({
        message: 'Login successful' ,
        id: rows[0].id_acc,
        username: rows[0].username,
        email: email ,
        name: rows[0].name,
        last: rows[0].last,
        birthdate: rows[0].birthdate,
        Role: rows[0].Role,
        available: rows[0].available,
        token: token
    });
    console.log(`User ${email} logged in successfully`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    throw error;
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const {username, email , password ,name , last, birthdate, Role, available, phone} = req.body;

    if (!username || !email || !password || !name || !last || !birthdate || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    //เช็ค mail username phone 
    const [row_phone]: any[] = await db.execute(`SELECT 1 FROM user_phone WHERE phone = ?`, [phone]);
    const [row_email]: any[] = await db.execute(`SELECT is_deleted,id_acc FROM user_data WHERE email = ?`, [email]);
    let come_back : boolean = false;

    if (row_email.length != 0) {
      if(row_email[0].is_deleted == false){
        return res.status(400).json({ error: 'Email already exists' });
      }
      come_back = true;
    }
    if (row_phone.length > 0) {
      return res.status(400).json({ error: 'Email or phone already exists' });
    }
    // แปลงรหัสผ่านด เป็นภาษาเอเลี่ยน (้hashed)
    const hashedPassword = await bcrypt.hash(password, 10);
   //เอาข้อมูลที่มี default (Role, available) กับอยู่ตารางอื่นออก (phone)
    const userDataToInsert: Record<string, any> = {
            username: username, //ไม่ใช้ filter เพราะ คืนค่าเป็น array 
            email: email,
            password: hashedPassword,
            name: name,
            last: last, 
            birthdate: birthdate,
        }; 
    //ถ้ามีการส่งมา แสดงว่าต้องการ set ค่อยเพิ่มใน userDataToInsert
    if (Role !== undefined && Role !== null) userDataToInsert.Role = Role;
    if (available !== undefined && available !== null) userDataToInsert.available = available;

    const keys = Object.keys(userDataToInsert);
    let values : any[]
    let sql: string ;
    if(come_back === false){
      sql =`INSERT INTO user_data (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;

      values = keys.map(key => userDataToInsert[key]);  
    }else{
      const key_filter = keys.filter(key => key !== 'email');
      sql = `UPDATE user_data SET ${key_filter.map((key) => `${key} = ?`).join(', ')}, is_deleted = FALSE WHERE email = ?`;

      values = key_filter.map(key => userDataToInsert[key]);
      values.push(email);
    }

    const con_db = await db.getConnection(); 
    try{
      await con_db.beginTransaction();
      
      const [insertResult] = await con_db.execute<ResultSetHeader>(sql, values);
      //ดึง id ล่าสุดที่เพิ่มลงไป [result] บังคับดึง array index 0 มาเก็บ result
      // ดูว่าควรใช้ id ล่าสุด หรือ id ที่เก่า (เช็คผ฿้ใช้อะแหละ)
      const id_last = come_back ? row_email[0].id_acc : insertResult.insertId;

      if(id_last === 0 || id_last === undefined)  {
        console.log('Failed to insert user data : Rollback');
        await con_db.rollback();
        con_db.release();
        return res.status(400).json({ error: 'Failed to insert user data' });
      }

      let token: string;
      let exist : any[]
      do {
          token = gentoken(id_last);
          //ไม่ได้เอา con_db ไป select เอา connection ที่ว่างอยู่ไป select จะได้ไวๆ
          [exist] = await db.execute<any[]>(`SELECT 1 FROM user_data WHERE token = ?`, [token]);
      } while (exist.length > 0); //เช็ค id และ token
      console.log(`Token: ${token}`);


      const [token_insert] = await con_db.execute<ResultSetHeader>('UPDATE user_data SET token = ? WHERE id_acc = ?', [token, id_last]);
      const [phone_insert] = await con_db.execute<ResultSetHeader>('INSERT INTO user_phone (id_acc, phone) VALUES (?, ?)', [id_last,phone]);

      if(phone_insert.affectedRows === 0 || token_insert.affectedRows === 0){
        console.log('Failed to insert phone or token : Rollback');
        await con_db.rollback();
        con_db.release();
        return res.status(400).json({ error: 'Failed to insert phone' });
      }
      await con_db.commit();
      con_db.release();

      res.status(201).json({
          message: 'Signin successful',
          id_acc: id_last,
          username,
          email,
          name,
          last,
          birthdate,      //กันแสดง null , undefined เพราะไม่ได้ส่งมา set
          Role: Role !== undefined && Role !== null ? Role:'user', 
          available: available !== undefined && available !== null? available : true,
          phone,
          token
      });

      console.log(`User ${userDataToInsert.email} signed in successfully`);
    }catch (error) {
      await con_db.rollback();
      con_db.release();
      console.error(error);
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function gentoken(id: number) {  
    const token =  jwt.sign(
        { userId: id },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' } // หมดอายุใน 1 ชั่วโมง
    );
    return token;
}
//เช็คข้อมูลใน sqlว่ามีข้อมูลทีไหม
// export const checkdata = async function checkdata(attribute: string,data: string | number){//use select 1 ruturn 1 if have data
//   if(attribute == "phone"){  
//     const [row] = await db.execute(`SELECT 1 FROM user_phone WHERE ${attribute} = ?`, [data]);
//     return (row as any[]).length > 0
//   }
//   const [row] = await db.execute(`SELECT 1 FROM user_data WHERE ${attribute} = ?`, [data]);
//   return (row as any[]).length > 0; //return true if data exists
// }