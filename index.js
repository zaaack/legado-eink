const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()

app.use('/api', createProxyMiddleware({
  target: process.env.TARGET || 'http://192.168.31.246:1122/', changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  ignorePath: true,
  cookieDomainRewrite: true,
  cookiePathRewrite: true,
}));
app.use('/', (req, res) => {
  res.send(``)
})
