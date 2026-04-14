import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db_connect/db_sql';

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
    try {
        jwt.verify((rows as any[])[0].token, process.env.JWT_SECRET!);
    }catch (error) {
        const token = gentoken((rows as any[])[0].id);
        await db.execute('UPDATE user_data SET token = ? WHERE email = ?', [token, email]);
        console.log('Token expired, new token generated');
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
        token: rows[0].token
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
    if (await checkdata('email', email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }else if (await checkdata('username', username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }else if (await checkdata('phone', phone)) {
      return res.status(400).json({ error: 'Phone number already exists' });
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
            birthdate: birthdate
        }; 
    //ถ้ามีการส่งมา แสดงว่าต้องการ set ค่อยเพิ่มใน userDataToInsert
    if (Role !== undefined && Role !== null) userDataToInsert.Role = Role;
    if (available !== undefined && available !== null) userDataToInsert.available = available;

    const keys = Object.keys(userDataToInsert);
    const values = Object.values(userDataToInsert);
  
    const sql =`INSERT INTO user_data (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;

    const [insertResult] = await db.execute<any>(sql, values);
    //ดึง id ล่าสุดที่เพิ่มลงไป [result] บังคับดึง array index 0 มาเก็บ result
    // ResultSetHeader จะมี Property ชื่อ insertId ซ่อนอยู่
    const id_last = insertResult.insertId;

    let token: string;
    do {
        token = gentoken(id_last);
    } while (await checkdata('token', token)); //เช็ค id และ token
    console.log(`Token: ${token}`);

    await db.execute('UPDATE user_data SET token = ? WHERE id_acc = ?', [token, id_last]);
    //ยัดลง token sql
    await db.execute('INSERT INTO user_phone (id_acc, phone) VALUES (?, ?)', [id_last,phone]);

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
//เช็คข้อมูลใน sqlว่ามีข้อมูลทีไหม
export const checkdata = async function checkdata(attribute: string,data: string | number){//use select 1 ruturn 1 if have data
  if(attribute == "phone"){  
    const [row] = await db.execute(`SELECT 1 FROM user_phone WHERE ${attribute} = ?`, [data]);
    return (row as any[]).length > 0
  }
  const [row] = await db.execute(`SELECT 1 FROM user_data WHERE ${attribute} = ?`, [data]);
  return (row as any[]).length > 0; //return true if data exists
}

function gentoken(id: number) {  
    const token = jwt.sign(
        { userId: id },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' } // หมดอายุใน 1 ชั่วโมง
    );
    return token;
}
