import mysql from 'mysql2/promise';

export let db: mysql.Pool;

export async function connectToDatabase() {
    try {   
        db = mysql.createPool({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root_ja',
            database: 'Smart_Street_Light_db',
            // ตั้งค่าพื้นฐานสำหรับ Pool
            waitForConnections: true,
            connectionLimit: 10, // มีพนักงานสแตนด์บาย 10 คน
            maxIdle: 10, 
            idleTimeout: 60000,
            queueLimit: 0
        });
        console.log('✅ Connected to the database successfully!');
        return db;
    } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    throw error;
  }
}