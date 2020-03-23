"use strict";
const https = require('https')

const ENV_KEY='WIREPUSHER_KEY'
const CONFIG_FILENAME='.wirepusher'

module.exports = class WirePusher {
    constructor(ids) {
        let _ids = null
        if (typeof ids === 'undefined') {
            const confDir = 'WIREPUSHER_CONFIG_DIR' in process.env ? process.env.WIREPUSHER_CONFIG_DIR : os.homedir()
            const confFile = path.join(confDir, CONFIG_FILENAME)
            if (process.env[ENV_KEY] && process.env[ENV_KEY].length > 3) {
                _ids = process.env[ENV_KEY].split(',')
            } else if (fs.existsSync(confFile)) {
                const config = fs.readFileSync(confFile).toString('utf8').trim()
                if (config.indexOf(ENV_KEY) > -1) {
                    config.split('\n').forEach(conf => {
                        if (conf.indexOf(ENV_KEY) > -1) {
                            const confEntry = conf.split('=')
                            _ids = confEntry.pop().split(',')
                        }
                    })
                } else {
                    _ids = config.split(',')
                }
            } else {
                _ids = []
            }
        } else if (typeof ids === 'string') {
            _ids = ids.split(',')
        }
        if (_ids.length > 10) {
            while (_ids.length > 0) {
                if (_ids.length < 10) {
                    this.ids.push(_ids.join(','))
                    _ids = []
                } else {
                    const portion = _ids.slice(0, 10)
                    this.ids.push(portion.join(','))
                    _ids = _ids.slice(10)
                }
            }
        } else if (_ids.length > 1) {
            this.ids = _ids.join(',')
        } else {
            this.ids = _ids
        }
    }
    /**
     * notify
     */
    notify(n) {
        return new Promise((resolve, reject) => {
            this.ids.forEach(id => {
                let data = {
                    id: id,
                    title: n.title,
                    message: n.message
                }
                if ('type' in n && n['type'].length > 0) {
                    data.type = n['type']
                }
                if ('action' in n && n['action'].length > 0) {
                    data.action = n['action']
                }
                if ('image_url' in n && n['image_url'].length > 0) {
                    data.image_url = n['image_url']
                }
                if ('message_id' in n && n['message_id'].length > 0) {
                    data.message_id = n['message_id']
                }

                let dataStr = ''
                for (let [key, value] of Object.entries(data)) {
                    dataStr += key + `=` + escape(value) + `&`    
                }
                
                const req = https.get(`https://wirepusher.com/send?${dataStr}`, (res) => {
                    let response = ''
                    res.on('data', (d) => {
                        response += d
                    })
                    res.on('end', () => {
                        try {
                            const parsedData = JSON.parse(response);
                            if (parsedData.errors > 0) {
                                console.error(`Failed sending ${parsedData.errors} notifications`);
                                reject(parsedData)
                            } else {
                                resolve(parsedData)
                            }
                        } catch (e) {
                            console.error('Failed parsing response', e.message)
                            reject(e)
                        }
                    })
                })
                
                req.on('error', e => {
                    console.error('An error occured making the request', e.message)
                })
                
                req.write(data)
                req.end()
            })
        })
    }
}