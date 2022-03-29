/*jshint esversion: 9 */
/*jshint -W033*/
const express = require('express')
const session = require('express-session')
const app = express()

const path = require('path')
const bodyParser = require('body-parser')
const hash = require('pbkdf2-password')()

server = {
  host: '127.0.0.1',
  port: 3000
}

//----silly DB----//

let users = {
  alice: {}
}

create_user()

//----middleware----//

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

//----routing----//

app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, './auth.html')) })

app.post('/login/password', (req, res) => {
  auth(req.body.username, req.body.password, function(err, user) {

    if (err) return next(err)

    if (user) {
      req.session.user = true
      res.redirect('/home')
    } else {
      console.log('error login')
      res.redirect('/login')
    }

  })
})

app.get('/home', restrict, (req, res) => { res.send('<h1>home page</h1>') })

app.get('/error', (req, res) => { res.send('<h1>error page</h1>')})

app.get('/', (req, res) => {

  if(req.session.user) {
    res.redirect('/home')
  } else {
    res.redirect('/login')
  }

})

app.get('*', (req, res) => { res.redirect('/error')})

app.listen(server.port, server.host, () => {
  console.log(`server is listening at http://${server.host}:${server.port}`)
})


//----functions----//

//creating user for bd
function create_user() {
  hash({ password: 'verystrongpass' }, function (err, pass, salt, hash) {
    if (err) throw err

    users.alice.salt = salt
    users.alice.hash = hash
  })
}

//checking login/passport
function auth(log, pass, fn) {
  let user = users[log]

  if(!user) return fn(null, null)

  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
   if (err) return fn(err)
   if (hash === user.hash) return fn(null, user)
   fn(null, null)
 });
}

//restrict page for non-auth user
function restrict(req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.session.error = 'Access denied!'
    res.redirect('/login')
  }
}
