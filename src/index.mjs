import startServer from './server.mjs'

;(async function () {
  try {
    await startServer()
  } catch (err) {
    process.exit()
  }
})()