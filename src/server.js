
import {createServer} from "node:http"
import {create, find, liste, check} from "./blockchain.js";
import {NotFoundError} from "./errors.js";

createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const url = new URL(req.url, `http://${req.headers.host}`)
        const endpoint = `${req.method}:${url.pathname}`

        let results

        try {
            switch (endpoint) {
                case 'GET:/blockchain':
                    console.log('GET request received on /blockchain endpoint')
                    results = await liste(req, res, url)
                    break
                case 'POST:/blockchain':
                    console.log('POST request received on /blockchain endpoint')
                    results = await create(req, res)
                    break
                case 'PUT:/blockchain':
                    // results = await find(req, res)
                    results = await check(req, res)
                    break
                default :
                    console.log('404 - Endpoint not found')
                    res.writeHead(404)
            }
            if (results) {
                res.write(JSON.stringify(results))
            }
        } catch (erreur) {
            if (erreur instanceof NotFoundError) {
                res.writeHead(404)
            } else {
                throw erreur
            }
        }
        res.end()
    }
).listen(5555)
