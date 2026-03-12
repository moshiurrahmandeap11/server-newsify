import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

export const send_token = (user, statusCode, message, res) => {
    const token = jwt.sign(
        {id: user.id}, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    res.status(statusCode).cookie("token", token, {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }).json({
        succuess: true,
        user,
        message,
        token,
    })
}