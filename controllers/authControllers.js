import bcrypt from "bcrypt";
import database from "../database/db.js";
import { catch_async_errors } from "../middleware/catch_async_errors.js";
import ErrorHandler from "../middleware/errorHandler.js";
import { send_token } from "../utils/jwt_tokens.js";

export const register = catch_async_errors(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  if (password.length < 6) {
    return next(
      new ErrorHandler("Password must be at least 6 characters", 400),
    );
  }

  const is_already_registered = await database.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email.toLowerCase()],
  );

  if(is_already_registered.rows.length > 0 ){
    return next(
        new ErrorHandler("User already registered with this email", 400),
    );
  }

  const hashed_password = await bcrypt.hash(password, 10);
  const user = await database.query(
    "INSERT INTO users (name, email , password) VALUES ($1, $2, $3) RETURNING *", [name, email, hashed_password],
  );

  send_token(user.rows[0], 201, "User Registered Successfully", res);
});

export const login = catch_async_errors(async(req, res, next) => {
    const {email ,password} = req.body;
    if(!email || !password) {
        return next(new ErrorHandler("Please provide email and password", 400));
    }
    const user = await database.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);

    if(user.rows.length === 0) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }
    const is_match = await bcrypt.compare(password, user.rows[0].password);
    if(!is_match) {
        return next(new ErrorHandler("Invalid password", 401));
    }
    send_token(user.rows[0], 200, "User logged in successfully", res);
});

export const get_user = catch_async_errors(async(req, res, next) => {
    const {user} = req;
    res.status(200).json({
        success: true,
        user,
    });
});


export const log_out = catch_async_errors(async(req, res, next) => {
    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "Log out successfully",
    });
});
