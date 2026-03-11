import database from "../database/db.js";

export async function create_news_table() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS news (
            news_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            author_id UUID NOT NULL,
            author_name VARCHAR(100) NOT NULL,
            news_title VARCHAR(200) NOT NULL,
            news_thumbnail JSONB,  -- Cloudinary image info store korbe (public_id, url, etc.)
            news_video JSONB,       -- Optional video info
            news_description TEXT NOT NULL,
            news_tags TEXT[],       -- Array of tags
            share_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Foreign key constraint
            CONSTRAINT fk_author 
                FOREIGN KEY(author_id) 
                REFERENCES users(id)
                ON DELETE CASCADE
        );
        `;
        
        await database.query(query);
        console.log("News table created successfully");
        
    } catch (error) {
        console.error("Error creating news table:", error);
        process.exit(1);
    }
}