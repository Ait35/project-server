import { Router ,Request, Response} from 'express'; 
import { get_pole } from '../method/pole_contral/get_pole/get_pole';
import { post_pole } from '../method/pole_contral/pose_pole/pose_pole';
import { patch_pole } from '../method/pole_contral/patch_pole/patch_pole';

const router = Router();
//ใช้ query เช่น http://localhost:3000/get_pole?id=1&token=token
//http://localhost:3000/get_pole?token=token อันนี้คือดึงหมด
router.get('/get_pole', get_pole);

router.post('/post_pole/newPole', post_pole);

router.patch('/patch_pole/:token/:id', patch_pole); //id_acc

export default router;

// ก่อน RUN ทำตามนี้
// 1.ติดตั้ง package ให้ครบ ดูได้จาก package.json, package-lock.json
// 2.token มีอายุ 1 วัน ต้อง login อีกครั้ง ถึง gen ใหม่

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// req data structure in Table ทั้งหมด ยกเว้น Table ของ user_data
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// req data structure in method post(body) : Rule of req data
// { //แนบข้อมูลผ่าน body                    : - username และ token ต้องตรงกัน
//     "token" : "string",                 : - ต้องเป็น Dev or Admin
//     "username" : "string",              : - ต้องมีข้อมูลครบทุก field ยกเว้นที่มี default
//     "data" :{                           
//         "mode": "sensor",
//         "time_on": "18:30:00",
//         "time_off": "05:30:00",
//         "brightness": 80,
//         "lux": 25,
//         "rule_lux": 20
//     } 
// }
// if success response (json)
// {"message":"success","id_config":6,"fieldCount":0,"affectedRows":1,"insertId":6,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
// ====================================================================================
// req data structure in method get(query) : Rule of req data
// Enter token และid_acc บน api            : - token ต้องมีใน api
// เช่น /get_config?token=token&id=1        : - ใครก็ขอได้ ถ้ามี token
// สมมุติว่า id คือ ข้อมูลใน field ที่ต้องการค้นหา  : - ต้องมีตัวที่ต้องการ get ใน api
//                                         : - ถ้ามีแต่ token ได้ข้อมูลทั้งหมดใน table
//                                         :
// if success response (json) is /get_config?token=token&id=dev
// {"0":{"id_config":1,"mode":"auto","time_on":"18:00:00","time_off":"06:00:00","brightness":100,"lux":20,"rule_lux":15,"is_deleted":0},"message":"Get config successful"}
// ====================================================================================
// req data structure in method patch(body,params) : Rule of req data
// Enter token และid_acc บน api บน api      : - token และ ia_acc ต้องมีใน api
// ยืนยันตัวตน ตัวอย่าง เช่น /patch_config/token/1 : - ต้องเป็น Dev or Admin้
// { // แนบข้อมูลที่จะแก้ผ่าน body               : - ต้องแนบ body ข้อมูลที่จะแก
//     "token" : "string",                  
//     "id" : 2, //id_config
//     "data" : {
//         "time_on": "19:00:00",
//         "time_off": "06:00:00"
//     }
// }                                       
// if success response (json) is /get_config?token=token&id=dev
// {"message":"Config updated successfully","time_on":"19:00:00","time_off":"06:00:00"}


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// req data structure in Table userdata รวมความโง่ และ hardcode กากๆ ของกู
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// req SIGNIN structure in method post(body) : Rule of req data
// { //แนบข้อมูลผ่าน body                    : - username email phone ห้ามซ้ํา
//   "username": "tester02",              : - ต้องมีข้อมูลครบทุก field ยกเว้น Role
//   "email": "test02@gmail.com",         : - แต่ถ้าเป็น admin, dev ก็ใส่ ไม่งั้นเป็น user 
//   "password": "hashed_password_here",  : - token auto generate
//   "name": "Somchai",
//   "last": "Jaidee",
//   "birthdate": "2000-01-01"
// }
// if success response (json)
// {"message":"Signin successful","id_acc":4,"username":"tester02","email":"test02@gmail.com","name":"Som","last":"chai","birthdate":"2000-01-01","Role":"admin","available":false,"phone":"0877755412","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NjI0NzcyOSwiZXhwIjoxNzc2MzM0MTI5fQ._zw_dDv93E8JKtIFrE2erud5nrJPFhF60bg5W9JGDPM"}
// =====================================================================================
// req LOGIN structure in method post(body) : Rule of req data
// { //แนบข้อมูลผ่าน body                    : - email, password ต้องตรงกัน
//     "email" : "test1@gmail.com",       : - Gen token auto เมื่อหมดอายุ
//     "password" : "12345678"            : - ฉะนั้น ถ้า token หมดอายุ ก็ให้ login ใหม่ ทำใน frontend ด้วย
// }
// if success response (json)
// เหมือน sign in เลย
// ======================================================================================
// req data structure in method get (params)
// รูปแบบที่ 1 ได้ข้อมูล field เดี่ยว ใส่ api ตามนี้ 
// /get_user/field ข้อมูลที่ต้องการ/tfield ของข้อมูลที่ใช้ค้นหา/ข้อมูลใน field ที่ต้องการค้นหา'

// รูปแบบที่ 2 ได้ข้อมูลทั้งหมดของข้อมูลที่ใช้ค้นหา ใส่ api ตามนี้
// /get_user/field ของข้อมูลที่ใช้ค้นหา/ข้อมูลใน field ที่ต้องการค้นหา'

// รูปแบบที่ 3 ได้ข้อมูลทั้งหมดของข้อมูลทีอยู่ใน table data_user ใส่ api ตามนี้
// /get_user/Ao-jing/GenZ/Boon-koon-Paw-Mae/Kha-Yai-Bang-Bua/Boon-koon-Paw-Mae/Kha-Yai-Bang-Bua/ใส่ token ตรงนี้
// =====================================================================================
// req data structure in method patch(body) : Rule of req data
// { // แนบข้อมูลที่จะแก้ผ่าน body               : - ถ้าแก้ password ,username,email ต้องเป้น admin, dev
//     "token" : "token",                   : - email, phone ,username ห้ามซ้ำ
//     "id" : 1,
//     "data" : {
//         "name" : "ait"
//     }
// }                                    
// if success response (json) is /get_config?token=token&id=dev
// {"message":"User updated successfully"}