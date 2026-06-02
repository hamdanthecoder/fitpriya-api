const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
require('dotenv').config()

const connectDB = require('./config/database')
const foodRoutes = require('./routes/foodRoutes')
const userRoutes = require('./routes/userRoutes')
const dietRoutes = require('./routes/dietRoutes')

const app = express()

connectDB()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10kb' }))
app.use(mongoSanitize())
app.use(morgan('dev'))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

app.use('/api/foods', foodRoutes)
app.use('/api/users', userRoutes)
app.use('/api/diet', dietRoutes)

app.get('/health', (req, res) => {
  res.json({
    status: 'Running',
    database: 'MongoDB Atlas',
    timestamp: new Date()
  })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`FitPriya API running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
