import  mysql  from 'mysql2/promise';
import { config } from 'dotenv';



config()

export const poolDB = mysql.createPool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0,
});


export const database = async ()=>{
let  connection;
try {
const connection = await poolDB.getConnection()
const [rows]  = await connection.query('SELECT NOW() AS currentTime')
console.log("Database has been connected successfully", rows);
connection.release();
} catch (error) {
console.error("MySQL Database connection error:", error);
}};

