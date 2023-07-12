const express = require('express')
const mongoose = require('mongoose')
const Article = require('./models/article')
const articleRouter = require('./routes/articles')
const methodOverride = require('method-override')
const passport = require("passport")
const app = express()
const bcrypt = require("bcrypt")
const initializePassport = require("./passport-config")
const flash = require("express-flash")
const session = require("express-session")


initializePassport(
  passport, 
  email => users.find(user => user.email === email),  
)

var userArr = []

mongoose.connect('mongodb://127.0.0.1:27017/blog', {
  useNewUrlParser: true, useUnifiedTopology: true
})

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))
app.use(flash())
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', async (req, res) => {
  const articles = await Article.find().sort({ createdAt: 'desc' })
  res.render('articles/index', { articles: articles })
})

app.get('/about', async (req, res) => {
  res.render('articles/about')
})

app.get('/login', async (req, res) => {
  res.render('articles/login')
})

app.get('/register', async (req, res) => {
  res.render('articles/register')
})

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    userArr.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      hashedPassword
    })
    console.log(userArr)
  } catch (err) {
    console.log(err)
    res.redirect("/register")
  }
})

app.use('/articles', articleRouter)

app.listen(5000)