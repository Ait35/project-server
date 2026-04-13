import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Router from './web_service/index_wedService';
import { connectToDatabase } from './web_service/db_connect/db_sql';

dotenv.config();
console.log('JWT_SECRET=', process.env.JWT_SECRET);
const app = express();

app.use(cors());
app.use(express.json());
app.use(Router);

connectToDatabase().then(() => {
  app.listen(3000, () => {
    console.log('---Server is running on port 3000---');
  });
}).catch((error) => {
  console.error('😵 Error starting the server:', error);
}); 