const express = require('express');
const app = express();
const port = 3000;

// Middleware agar Express bisa membaca request body berupa JSON
app.use(express.json());

// Endpoint utama untuk mengecek status server  
app.get('/', (req, res) => {
    res.json({
        app: "API SIM PMB Universitas Ibn Khaldun Bogor",
        status: "Aktif",
        message: "Server backend berhasil berjalan!"
    });
});

app.listen(port, () => {
    console.log(`[SERVER] API berjalan di http://localhost:${port}`);
});