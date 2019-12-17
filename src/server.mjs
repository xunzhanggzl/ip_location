import express from 'express'
import cors from 'cors'
import bunyan from 'bunyan'
import geoip from 'geoip-lite'
import config from './config.mjs'

const log = bunyan.createLogger(config.logger.options)
const app = express()

export default async function startServer(portToListenOn = config.server.port) {
  return await new Promise((resolve, reject) => {
    try {
      app.disable('x-powered-by')

      // https://expressjs.com/en/guide/behind-proxies.html
      app.set('trust proxy', 1)
      app.use(cors())

      app.get('/me', (req, res) => {
        // https://devcenter.heroku.com/articles/http-routing#heroku-headers
        const realClientIpAddress = (req.headers['x-forwarded-for'] || req.ip || "").split(',')
        const ip = realClientIpAddress[realClientIpAddress.length - 1]
        res.json({
          ip,
          ...geoip.lookup(ip)
        })
      })

      app.get('/:ip', (req, res) => {
        res.json({
          ip: req.params.ip,
          ...geoip.lookup(req.params.ip)
        })
      })

      app.all('*', (req, res) => {
        res.redirect('/me')
      })

      app.use((err, req, res, next) => {
        log.error('Express error handling', err)
        res.sendStatus(500)
      })

      app.listen(portToListenOn, () => {
        log.info(`listening on *: ${portToListenOn}`)
        resolve(app)
      })

    } catch (err) {
      log.error("Error starting server", err)
      reject(err)
    }
  })
}