import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import database from "../database/db.js";
import { catch_async_errors } from "../middleware/catch_async_errors.js";
import ErrorHandler from "../middleware/errorHandler.js";
import { generate_forgot_password_email_template } from "../utils/generate_forgot_password_email_template.js";
import { generate_reset_password_token } from "../utils/generate_reset_password_token.js";
import { send_token } from "../utils/jwt_tokens.js";
import { send_email } from "../utils/send_email.js";

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

  if (is_already_registered.rows.length > 0) {
    return next(
      new ErrorHandler("User already registered with this email", 400),
    );
  }

  const hashed_password = await bcrypt.hash(password, 10);
  const user = await database.query(
    "INSERT INTO users (name, email , password) VALUES ($1, $2, $3) RETURNING *",
    [name, email, hashed_password],
  );

  send_token(user.rows[0], 201, "User Registered Successfully", res);
});

export const login = catch_async_errors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password", 400));
  }
  const user = await database.query(`SELECT * FROM users WHERE email = $1`, [
    email.toLowerCase(),
  ]);

  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  const is_match = await bcrypt.compare(password, user.rows[0].password);
  if (!is_match) {
    return next(new ErrorHandler("Invalid password", 401));
  }
  send_token(user.rows[0], 200, "User logged in successfully", res);
});

export const get_user = catch_async_errors(async (req, res, next) => {
  const { user } = req;
  res.status(200).json({
    success: true,
    user,
  });
});

export const log_out = catch_async_errors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Log out successfully",
    });
});

export const forgot_password = catch_async_errors(async (req, res, next) => {
  const { email } = req.body;
  const { frontendUrl } = req.query;
  let user_result = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );

  if (user_result.rows.length === 0) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  const user = user_result.rows[0];
  const { hashed_token, reset_password_expire_time, reset_token } =
    generate_reset_password_token();

  await database.query(
    `UPDATE users SET reset_password_token = $1, reset_password_expire = to_timestamp($2) WHERE email = $3`,
    [hashed_token, reset_password_expire_time / 1000, email.toLowerCase()],
  );

  const reset_password_url = `${process.env.FRONTEND_URL}/reset-password/${reset_token}`;

  const message = generate_forgot_password_email_template(reset_password_url);

  try {
    await send_email({
      email: user.email,
      subject: "Newsify password reset",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    await database.query(
      `UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE email = $1`,
      [email.toLowerCase()],
    );
    return next(new ErrorHandler("Email could not send ", 500));
  }
});

export const reset_password = catch_async_errors(async (req, res, next) => {
  const { token } = req.params;
  const reset_password_token = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await database.query(
    "SELECT * FROM users WHERE reset_pasword_token = $1 AND reset_password_expire > NOW()",
    [reset_password_token],
  );

  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid or expired reset token", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match ", 400));
  }

  if (req.body.password?.length < 6 || req.body.confirmPassword.length < 6) {
    return next(
      new ErrorHandler("Password must be at least 6 characters", 400),
    );
  }

  const hashed_password = await bcrypt.hash(req.body.password, 10);

  const update_user = await database.query(
    `UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expire = NULL WHERE id = $2 RETURNING *`,
    [hashed_password, user.rows[0].id],
  );

  send_token(update_user.rows[0], 200, "Password reset successfully", res);
});

export const update_password = catch_async_errors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassowrd } = req.body;
  if (!currentPassword || !newPassword || !confirmPassowrd) {
    return next(new ErrorHandler("Please provide all require fields", 400));
  }

  const isMatch = await bcrypt.compare(currentPassword, req.user.password);
  if (!isMatch) {
    return next(new ErrorHandler("current password is incorrect", 400));
  }

  if (newPassword !== confirmPassowrd) {
    return next(new ErrorHandler("New passwords do not match", 400));
  }

  if (newPassword?.length < 6 || confirmPassowrd?.length < 6) {
    return next(
      new ErrorHandler("Password must be at least 6 characters", 400),
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await database.query("UPDATE users SET password = $1 WHERE id = $2", [
    hashedPassword,
    req.user.id,
  ]);

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

export const updateProfile = catch_async_errors(async(req, res, next) => {
    const {name, email} = req.body;
    if(!name || !email) {
        return next(new ErrorHandler("Plese provide all required fields", 400))
    }

    if(name.trim().length === 0 || email.trim().length === 0) {
        return next(new ErrorHandler("Name and email cannot be empty", 400))
    }

    let avatarData = {};
    if(req.files && req.files.avatar) {
        const {avatar} = req.files;
        if(req.user?.avatar?.public_id) {
            await cloudinary.uploader.destroy(req.user.avatar.public_id);
        }

        const newProfileImage = await cloudinary.uploader.upload(avatar, tempFilePath, {
            folder: "Newsify_Avatars",
            width: 150,
            crop: "scale",
        })
        avatarData = {
            public_id: newProfileImage.public_id,
            url: newProfileImage.secure_url
        }
    }

    let user;
    if(Object.keys(avatarData).length === 0) {
        user = await database.query(
            "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *", [name, email, req.user.id]
        )
    } else {
        user = await database.query(
            "UPDATE users SET name = $1, email = $2, avatar = $3 WHERE id = $4 RETURNING *", [name, email, avatarData, req.user.id]
        )
    }

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: user.rows[0],
    })
})