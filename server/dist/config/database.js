"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.poolDB = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.poolDB = promise_1.default.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
const database = async () => {
    let connection;
    try {
        const connection = await exports.poolDB.getConnection();
        const [rows] = await connection.query('SELECT NOW() AS currentTime');
        console.log("Database has been connected successfully", rows);
        connection.release();
    }
    catch (error) {
        console.error("MySQL Database connection error:", error);
    }
};
exports.database = database;
