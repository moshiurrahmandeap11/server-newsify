import database from "../database/db.js";
import { catch_async_errors } from "../middleware/catch_async_errors.js";
import ErrorHandler from "../middleware/errorHandler.js";

export const getNews = catch_async_errors(async (req, res, next) => {
  const news = await database.query(
    `SELECT * FROM news ORDER BY created_at DESC LIMIT 50`,
  );
  if (news.rows.length === 0) {
    return next(new ErrorHandler("no news found , try again later", 404));
  }

  res.status(200).json({
    success: true,
    message: "News fetched successfully",
    count: news.rows.length,
    data: news.rows,
  });
});

// Add News
export const addNews = catch_async_errors(async (req, res, next) => {
  const {
    author_id,
    author_name,
    news_title,
    news_thumbnail,
    news_video,
    news_description,
    news_tags,
    category
  } = req.body;

  // Validation
  if (!author_id || !author_name || !news_title || !news_description) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Check if author exists
  const authorCheck = await database.query(
    `SELECT id FROM users WHERE id = $1`,
    [author_id]
  );

  if (authorCheck.rows.length === 0) {
    return next(new ErrorHandler("Author not found", 404));
  }

  const query = `
    INSERT INTO news (
      author_id, 
      author_name, 
      news_title, 
      news_thumbnail, 
      news_video, 
      news_description, 
      news_tags,
      category
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    author_id,
    author_name,
    news_title,
    news_thumbnail || null,
    news_video || null,
    news_description,
    news_tags || [],
    category || null
  ];

  const result = await database.query(query, values);

  res.status(201).json({
    success: true,
    message: "News added successfully",
    data: result.rows[0]
  });
});

// Update News
export const updateNews = catch_async_errors(async (req, res, next) => {
  const { id } = req.params;
  const {
    news_title,
    news_thumbnail,
    news_video,
    news_description,
    news_tags,
    category
  } = req.body;

  // Check if news exists
  const newsCheck = await database.query(
    `SELECT * FROM news WHERE news_id = $1`,
    [id]
  );

  if (newsCheck.rows.length === 0) {
    return next(new ErrorHandler("News not found", 404));
  }

  // Build dynamic update query
  const updates = [];
  const values = [];
  let valueIndex = 1;

  if (news_title) {
    updates.push(`news_title = $${valueIndex++}`);
    values.push(news_title);
  }
  if (news_thumbnail) {
    updates.push(`news_thumbnail = $${valueIndex++}`);
    values.push(news_thumbnail);
  }
  if (news_video) {
    updates.push(`news_video = $${valueIndex++}`);
    values.push(news_video);
  }
  if (news_description) {
    updates.push(`news_description = $${valueIndex++}`);
    values.push(news_description);
  }
  if (news_tags) {
    updates.push(`news_tags = $${valueIndex++}`);
    values.push(news_tags);
  }
  if (category) {
    updates.push(`category = $${valueIndex++}`);
    values.push(category);
  }

  // Always update updated_at timestamp
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  if (updates.length === 1) {
    return next(new ErrorHandler("No fields to update", 400));
  }

  const query = `
    UPDATE news 
    SET ${updates.join(", ")}
    WHERE news_id = $${valueIndex}
    RETURNING *
  `;

  values.push(id);
  const result = await database.query(query, values);

  res.status(200).json({
    success: true,
    message: "News updated successfully",
    data: result.rows[0]
  });
});

// Delete News
export const deleteNews = catch_async_errors(async (req, res, next) => {
  const { id } = req.params;

  // Check if news exists
  const newsCheck = await database.query(
    `SELECT * FROM news WHERE news_id = $1`,
    [id]
  );

  if (newsCheck.rows.length === 0) {
    return next(new ErrorHandler("News not found", 404));
  }

  await database.query(
    `DELETE FROM news WHERE news_id = $1`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: "News deleted successfully"
  });
});

// Get Single News
export const getSingleNews = catch_async_errors(async (req, res, next) => {
  const { id } = req.params;

  const result = await database.query(
    `SELECT * FROM news WHERE news_id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("News not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "News fetched successfully",
    data: result.rows[0]
  });
});

// Get News by Category
export const getNewsByCategory = catch_async_errors(async (req, res, next) => {
  const { category } = req.params;

  const result = await database.query(
    `SELECT * FROM news WHERE category = $1 ORDER BY created_at DESC LIMIT 50`,
    [category]
  );

  res.status(200).json({
    success: true,
    message: "News fetched successfully",
    count: result.rows.length,
    data: result.rows
  });
});

// Get News by Author
export const getNewsByAuthor = catch_async_errors(async (req, res, next) => {
  const { author_id } = req.params;

  const result = await database.query(
    `SELECT * FROM news WHERE author_id = $1 ORDER BY created_at DESC`,
    [author_id]
  );

  res.status(200).json({
    success: true,
    message: "News fetched successfully",
    count: result.rows.length,
    data: result.rows
  });
});

// Increment Share Count
export const incrementShareCount = catch_async_errors(async (req, res, next) => {
  const { id } = req.params;

  const result = await database.query(
    `UPDATE news SET share_count = share_count + 1 WHERE news_id = $1 RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("News not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Share count incremented",
    data: result.rows[0]
  });
});