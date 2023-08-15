//----Packages,Libraries and Helpers--------------//
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}

const { MongoClient } = require("mongodb")
const express = require('express')
const mongoose = require('mongoose')
const Article = require('./models/article')
const articleRouter = require('./articleRoute/articles')
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
app.use(express.static('./pictures'));
app.use('/articles', articleRouter)
//----Packages,Libraries and Helpers--------------//

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

//------------------Page render-------------------//
app.get('/', checkAuthenticated, async (req, res) => {
  const articles = await Article.find().sort({ createdAt: 'desc' })
  res.render('articles/index', { articles: articles })
})

app.get('/about', async (req, res) => {
  res.render('../views/about')
})

app.get('/visitorsview', async (req, res) => {
  const articles = await Article.find().sort({ createdAt: 'desc' })
  res.render('articles/indexForVisitors', { articles: articles })
})

app.get('/login', checkNotAuthenticated, async (req, res) => {
  res.render('../views/login')
})

app.get('/register', checkNotAuthenticated, async (req, res) => {
  res.render('../views/register')
})
//------------------Page render-------------------//

//-----------Login------------------//
app.post('/login', checkNotAuthenticated, passport.authenticate("local", {
  successRedirect: '/',
  failureRedirect: "/login",
  failureFlash: true
}))

app.delete("/logout", (req, res) => {
  req.logout(req.user, err => {
    if (err) return next(err)
  })
  res.redirect("/login")
})
//-----------Login------------------//

//-----------Passing register data---------------//
var rngCode = Math.floor(Math.random() * (99999 - 10000) + 10000)
console.log(rngCode)

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, code } = req.body;

    const existingUser = await User.findOne({ $or: [{ name }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    var user = new User({
      id: Date.now().toString(),
      name: name,
      email: email,
      hashedPassword: await bcrypt.hash(password, 10),
      code: code,
    })

    console.log(rngCode)
    if (user.code === rngCode) {
      userArr.push(user)
      user.save()
      res.redirect("/login")
    } else {
      rngCode = Math.floor(Math.random() * 10000)
      console.log(rngCode)
      res.redirect("/register")
    }

  } catch (err) {
    console.log(err)
  }
})
//-----------Passing register data---------------//

//----------------Auth functions------------------------//
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
//----------------Auth functions------------------------//

//-------------Search-------------------------//
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    const db = client.db();

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.get('/search', async (req, res) => {
      const query = req.query.query;

      try {
        await db.collection('articles').createIndex({ '$**': 'text' });
        const articles = await db.collection('articles').find({ $text: { $search: query } }).toArray();
        res.render('articles/indexSearchResults', { articles });
      } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while processing the search.');
      }
    });
  })
  .catch(err => {
    console.error('Failed to connect to the database:', err);
  });
//-------------Search-------------------------//

app.set('view engine', 'ejs')

app.listen(5000)