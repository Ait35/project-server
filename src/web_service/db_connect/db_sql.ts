import mysql from 'mysql2/promise';

export let db: mysql.Connection;

export async function connectToDatabase() {
    try {   
        db = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root_ja',
            database: 'Smart_Street_Light_db'
        });
        console.log('✅ Connected to the database successfully!');
        return db;
    } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    throw error;
  }
}