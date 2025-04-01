// Simple Express backend with file upload, tags, and SQLite DB const express = require('express'); const multer = require('multer'); const cors = require('cors'); const sqlite3 = require('sqlite3').verbose(); const path = require('path'); const fs = require('fs');

console.log("Starting server...");

const app = express(); const port = process.env.PORT || 3001;

app.use(cors()); app.use(express.json()); app.use('/uploads', express.static('uploads'));

console.log("Setting up database..."); const db = new sqlite3.Database('./posts.db', (err) => { if (err) { console.error("FAILED TO OPEN DB:", err); process.exit(1); } console.log("Database loaded successfully."); });

db.serialize(() => { db.run(CREATE TABLE IF NOT EXISTS posts ( id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, image TEXT, tags TEXT, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ), (err) => { if (err) { console.error("FAILED TO CREATE TABLE:", err); } else { console.log("Table ready."); } }); });

const storage = multer.diskStorage({ destination: (req, file, cb) => { const dir = './uploads'; if (!fs.existsSync(dir)) fs.mkdirSync(dir); cb(null, dir); }, filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }, }); const upload = multer({ storage });

app.post('/upload', upload.single('image'), (req, res) => { const { title, tags, description } = req.body; const imagePath = /uploads/${req.file.filename}; db.run( INSERT INTO posts (title, image, tags, description) VALUES (?, ?, ?, ?), [title, imagePath, tags, description], function (err) { if (err) { console.error("UPLOAD ERROR:", err); return res.status(500).json({ error: err.message }); } res.json({ id: this.lastID, title, image: imagePath, tags, description }); } ); });

app.get('/posts', (req, res) => { db.all(SELECT * FROM posts ORDER BY created_at DESC, (err, rows) => { if (err) { console.error("FETCH ERROR:", err); return res.status(500).json({ error: err.message }); } res.json(rows); }); });

app.listen(port, () => { console.log(Server running at http://localhost:${port}); });

process.on('uncaughtException', function (err) { console.error('UNCAUGHT EXCEPTION:', err.stack || err); });

