import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import { errorMiddleware } from "./middleware/errorHandler.js";
import { create_tables } from "./utils/create_table.js";
dotenv.config();
const app = express();


import users from "./routes/usersRoute/authRoutes.js";



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


// api endpoints
app.use("/api/v1/users", users);

create_tables();

app.use(errorMiddleware)

export default app;