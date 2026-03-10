import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import app from "./app";
dotenv.config();
port = process.env.PORT;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_API,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
    res.send("Server is running")
});


app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
})