import express from "express"
import type { Request, Response } from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()
const startedAt = new Date().toLocaleString()   // toISOString()

const app = express()
const PORT = process.env.PORT || 3001

// Configuration EJS
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
// EJS common views
const ejsRenderStatus = (req: Request, res: Response) => {
  // src/views/status.ejs
  res.render("status", {
    status: "OK",
    dataSource: process.env.DATA_SOURCE || "local",
    startedAt: startedAt,
  })
}

// Middlewares
app.use(express.static("public")) // or the correct directory
app.use(cors())
app.use(express.json())

// Routes
import productsRouter from "./routes/products"
import usersRouter from "./routes/users"
// Products Routes
app.use("/api/products", productsRouter)
// Users Routes
app.use("/api/users", usersRouter)
// Status Route
app.get("/", ejsRenderStatus)
app.get("/status", ejsRenderStatus)
app.get("/api/status", ejsRenderStatus)

/* Démarrage du serveur */
app.listen(PORT, () => {
  console.log(`✅ Server API
    http://localhost:${PORT}
    startedAt: ${startedAt}
    📊 Data source: ${process.env.DATA_SOURCE?.toUpperCase() || "LOCAL"}
  `)
})
