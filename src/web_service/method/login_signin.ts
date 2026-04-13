import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db_connect/db_sql';

 export const login = async (req: Request, res: Response) => {
  try {
    const {email , passwd} = req.body; //req.body คือ เป็น object ที่มี key value
    if(!email || !passwd) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    //rows คือ ข้อมูลจากการ sql โดยเป็น array เก็บ object ที่มี key เป็นชื่อ column และ value เป็นค่าของ column นั้นๆ
    const [rows] = await db.execute<any[]>('SELECT * FROM user_data WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    //แปลงรหัสผ่านที่รับมาเป็นภาษาเอเลี่ยน มาเทียบกับรหัสผ่านในฐานข้อมูล
    if (!await bcrypt.compare(passwd, (rows as any[])[0].password)) {
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
    console.log(rows[0]);
    res.status(200).json({
        message: 'Login successful' ,
        id: rows[0].id,
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
    const {username, email , passwd,name , last, birthdate, Role, available, phone} = req.body;
    if( !username || !email || !passwd ||!name ||!last || !birthdate || !Role || !phone) {
      return res.status(400).json({ error: 'Error in signin try again' });
    }
    //เช็ค mail username phone 
    if (await checkdata('email', email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }else if (await checkdata('username', username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }else if (await checkdata('phone', phone)) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    let token: string;
    // แปลงรหัสผ่านด เป็นภาษาเอเลี่ยน (้hashed)
    const hashedPassword = await bcrypt.hash(passwd, 10);

     if (!await db.execute('INSERT INTO user_data (username, email, password, token, name, last, birthdate, Role, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [username, email, hashedPassword, null, name, last, birthdate, Role, true])) 
    {
        return res.status(500).json({ error: 'Failed to create user' });
    }
    //ดึง id ล่าสุดที่เพิ่มลงไป [result] บังคับดึง array index 0 มาเก็บ result
    const [result] = await db.execute('SELECT id_acc FROM user_data WHERE email = ?', [email]);
    const id_last = (result as any[])[0].id_acc;

    do {
        token = gentoken(id_last);
    } while (await checkdata('token', token)); //เช็ค id และ token
    console.log(`Token: ${token}`);
    if(!await db.execute('UPDATE user_data SET token = ? WHERE id_acc = ?', [token, id_last])) {
        return res.status(500).json({ error: 'Failed to update user token' });
    }

    //ยัดลง sql
    if (!await db.execute('INSERT INTO user_phone (id_acc, phone) VALUES (?, ?)', [id_last, phone])) {
        return res.status(500).json({ error: 'Failed to create user phone' });
    }

    res.status(200).json({
    message: 'Signin successful',
    id_acc: id_last,
    username: username,
    email: email ,
    hashedPassword: hashedPassword ,
    name: name,
    last: last,
    birthdate: birthdate,
    Role: Role,
    available: available,
    phone: phone,
    token: token
    });
    console.log(`User ${email} signed in successfully`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    throw error;
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
