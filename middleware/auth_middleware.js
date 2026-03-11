import jwt from "jsonwebtoken";
import database from "../database/db.js";
import { catch_async_errors } from "./catch_async_errors.js";
import ErrorHandler from "./errorHandler.js";
export const isAuthenticated  = catch_async_errors(async(req, res, next) => {
    const {token} = req.cookies;
    if(!token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await database.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [decoded.id]);
    req.user = user.rows[0];
    next();
});

export const authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(`Role ${req.usesr.role} is not allowed to access this resource`, 403)
            )
        }
        next();
    }
}