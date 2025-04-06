// server.js with music-metadata and /music/upload route
import express from "express";
import path from "path";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import postgres from "postgres";
// Load environment variables
dotenv.config();
const sql = postgres(process.env.DATABASE_URL,{ssl:"require"});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIEWS_DIR = path.join(__dirname, "views");
const PARTIALS_DIR = path.join(VIEWS_DIR, "partials");


const app = express();
const PORT = process.env.PORT || 3003;


app.engine("html", engine({ extname: ".html", defaultLayout: false, partialsDir: PARTIALS_DIR }));
app.set("view engine", "html");
app.set("views", VIEWS_DIR);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

async function setupDB() {
    console.log("Starting DB...");
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
        await sql`
            CREATE TABLE routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT UNIQUE,
                region TEXT,
                country TEXT,
                operator TEXT,
                length_km REAL,
                game TEXT, -- e.g. TSW2, TSW3, TSW4
                release_date DATE
            )`;
        console.log("USERS ADDED TO DB");
    } catch (error) {
        console.error(error);
    }
}
setupDB();
app.get("/", (req, res) => res.render("index"));
app.get("/add", (req, res) => res.render("add"));
app.get("/routes", (req, res) => res.render("routes"));
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

function shutdown() {
    console.log("Shutting down server...");
    server.close(() => {
        console.log("Server closed.");
        process.exit(0);
    });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("message", (msg) => msg === "shutdown" && shutdown());
