const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const mysql = require("mysql2/promise")
const path = require("path")
const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

// Determine if we're in development or production
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

// Load environment variables
require("dotenv").config()

// Prepare Next.js
app.prepare().then(() => {
  const server = express()

  // Middleware
  server.use(cors())
  server.use(bodyParser.json())

  // Database connection pool
  const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  })

  // Create logs table if it doesn't exist
  ;(async () => {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          senderName VARCHAR(255),
          senderIp VARCHAR(50),
          receiverName VARCHAR(255),
          receiverIp VARCHAR(50),
          fileName VARCHAR(255),
          fileSize INT,
          fileType VARCHAR(50),
          timestamp DATETIME,
          successful BOOLEAN
        )
      `)
      console.log("✅ Database table checked/created successfully")
    } catch (error) {
      console.error("❌ Database initialization error:", error)
    }
  })()

  // API Routes

  // Health check endpoint
  server.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" })
  })

  // Save logs endpoint
  server.post("/api/logs", async (req, res) => {
    try {
      const log = req.body
      log.timestamp = log.timestamp || new Date().toISOString()

      await db.execute(
        `INSERT INTO logs (senderName, senderIp, receiverName, receiverIp, fileName, fileSize, fileType, timestamp, successful) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.senderName,
          log.senderIp,
          log.receiverName,
          log.receiverIp,
          log.fileName,
          log.fileSize,
          log.fileType,
          log.timestamp,
          log.successful,
        ],
      )

      console.log("✅ New Log:", log)
      res.json({ success: true })
    } catch (error) {
      console.error("❌ Error saving log:", error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Get logs endpoint
  server.get("/api/logs", async (req, res) => {
    try {
      const [logs] = await db.execute("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100")
      res.json(logs)
    } catch (error) {
      console.error("❌ Error fetching logs:", error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Let Next.js handle all other routes
  server.all("*", (req, res) => {
    return handle(req, res)
  })

  // Start server
  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
})

