// 
// Setup 
// 
var AuthPort = require('authport')
var MakerpassService = require('authport-makerpass')

if (! process.env.MAKERPASS_CLIENT_ID || ! process.env.MAKERPASS_CLIENT_SECRET) {
  throw new Error("Please set MAKERPASS_CLIENT_ID and MAKERPASS_CLIENT_SECRET")
}
 
AuthPort.registerService('makerpass', MakerpassService)
 
AuthPort.createServer({
  service: 'makerpass',
  id: process.env.MAKERPASS_CLIENT_ID,
  secret: process.env.MAKERPASS_CLIENT_SECRET,
  callbackURL: process.env.HOST + '/auth/makerpass/callback',
})
 
AuthPort.on('auth', function(req, res, data) {
  console.log("OAuth success!", data)
  req.session.accessToken = data.token
  res.redirect('/')
})
 
AuthPort.on('error', function(req, res, data) {
  console.log("OAuth failed.", data)
  res.status(500).send({ error: 'oauth_failed' })
})
 
 
// 
// Adding to your express app 
// 
var express = require('express')
var app = express()
 
app.get("/auth/:service", AuthPort.app)
 
app.listen(4000)