import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import { errorMiddleware } from "./middleware/errorHandler.js";
import { create_tables } from "./utils/create_table.js";
dotenv.config();
const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(fileUpload({
    tempFileDir: "./uploads",
    useTempFiles: true,
}));

create_tables();

app.use(errorMiddleware)

export default app;