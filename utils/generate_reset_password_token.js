import crypto from "crypto";
export const generate_reset_password_token =() => {
    const reset_token = crypto.randomBytes(20).toString("hex");

    const hashed_token = crypto.createHash("sha256").update(reset_token).digest("hex");

    const reset_password_expire_time = Date.now() + 15 * 60 * 1000; // 15 minutes

    return { reset_token, hashed_token, reset_password_expire_time };
}