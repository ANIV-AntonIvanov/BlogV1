if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}
const { MongoClient } = require("mongodb")
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
const bodyParser = require('body-parser');
var User = require('./models/user')
const uri = "mongodb://127.0.0.1:27017/blog";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userArr = []

client.connect()
  .then(() => {
    const db = client.db("blog");
    const collection = db.collection("users");
    return collection.find({}).toArray();
  })
  .then((users) => {
    userArr.push(...users);
    client.close();
  })
  .catch((err) => {
    console.error("Error retrieving users:", err);
  });

initializePassport(
  passport,
  email => userArr.find(user => user.email === email),
  id => userArr.find(user => user.id === id)
)

db = mongoose.connect('mongodb://127.0.0.1:27017/blog', {
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//page render
app.get('/', checkAuthenticated, async (req, res) => {
  const articles = await Article.find().sort({ createdAt: 'desc' })
  res.render('articles/index', { articles: articles })
})

app.get('/about', async (req, res) => {
  res.render('articles/about')
})

app.get('/login', checkNotAuthenticated, async (req, res) => {
  res.render('articles/login')
})

app.get('/register', checkNotAuthenticated, async (req, res) => {
  res.render('articles/register')
})
//page render

//Login
app.post('/login', checkNotAuthenticated, passport.authenticate("local", {

  successRedirect: '/',
  failureRedirect: "/login",
  failureFlash: true
}))
//Login

//Passing register data
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    var user = new User({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      hashedPassword: await bcrypt.hash(req.body.password, 10)
    })
    console.log(user)
    userArr.push(user)
    console.log(userArr)
    user.save()
    res.redirect("/login")
  } catch (err) {
    console.log(err)
    res.redirect("/register")
  }
})
//Passing register data

app.delete("/logout", (req, res) => {
  req.logout(req.user, err => {
    if (err) return next(err)
  })
  res.redirect("/login")
})

//Auth functions
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/")
  }
  next()
}

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/login")
}

app.use('/articles', articleRouter)

app.listen(5000)