const express = require('express');
const pool = require('./config/db');
const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 
app.use(express.json());


app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await pool.query(
            "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [name, email, password]
        );
        res.status(201).json({ message: "User registered", user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/report', upload.single('image'), async (req, res) => {
    try {
        const { user_id, service_type, description, city, country_code } = req.body;
        
        
        const image_url = req.file ? req.file.path : null;

        const result = await pool.query(
            "INSERT INTO reports (user_id, service_type, description, city, country_code, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [user_id, service_type, description, city, country_code, image_url]
        );
        
        res.status(201).json({ message: "Report logged with media!", report: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Reporting failed: " + err.message });
    }
});


app.put('/report/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        const result = await pool.query(
            "UPDATE reports SET status = $1 WHERE report_id = $2 RETURNING *",
            [status, id]
        );
        res.json({ message: "Status updated successfully!", report: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log("🚀 Server is running on port 5000"));