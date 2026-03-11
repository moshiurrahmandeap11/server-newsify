import { create_news_table } from "../models/news_table.js";
import { create_user_table } from "../models/user_table.js";

export const create_tables = async() => {
    try {
        await create_user_table();
        await create_news_table();
        console.log("All tables created Successfully");
    } catch(error) {
        console.error("Error creating tables", error);
    }
}