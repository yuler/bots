const fs = require('fs')
const path = require('path')
require('dotenv').config()
const yaml = require('js-yaml')
const Imap = require('imap')
const got = require('got')
const { sub } = require('date-fns')

const { EMAIL_IMAP_PASSWORD } = process.env
const { 
  EMAIL_IMAP_USER,
  EMAIL_IMAP_HOST,
  EMAIL_IMAP_PORT,
  CHECK_RECEIVE_LIST
} = yaml.safeLoad(fs.readFileSync(path.join(__dirname, './config.yml'), 'utf8'))
const sinceDate = sub(new Date, { weeks: 1 })

const imap = new Imap({
  user: EMAIL_IMAP_USER,
  password: EMAIL_IMAP_PASSWORD,
  host: EMAIL_IMAP_HOST,
  port: EMAIL_IMAP_PORT,
  tls: true,
})

function openInbox(cb) {
  imap.openBox('其他文件夹/周报', true, cb)
}

imap.once('ready', function() {
  const messages = []
  openInbox(function(err, box) {
    if (err) throw err
    imap.search(['ALL', ['SINCE', sinceDate]], function(err, results) {
      if (err) throw err
      var f = imap.fetch(results, { 
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
      })
      f.on('message', function(msg) {
        msg.on('body', function(stream, info) {
          var buffer = ''
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8')
          })
          stream.once('end', function() {
            messages.push(Imap.parseHeader(buffer))
          })
        })
      })
      f.once('error', function(err) {
        throw err
      })
      f.once('end', function() {
        checkout(messages, CHECK_RECEIVE_LIST)
        imap.end()
      })
    })
  })
})

imap.once('error', function(err) {
  throw err
})
imap.once('end', function() {
  console.log('Connection ended')
})
imap.connect()

async function checkout(messages, checkList) {
  for (let i = 0; i < messages.length; i ++) {
    // Format the `yule <yule@shihuituan.com>`
    const from = messages[i].from[0].match(/<(.*)>/)[1]
    if (checkList[from]) {
      delete checkList[from]
    }
  }
  // Notify DingTalk
  if (Object.keys(checkList).length) {
    const atMobiles = Object.values(checkList)
    const { body } = await got.post(process.env.DINGTALK_NOTIFY_URL, {
      json: {
        msgtype: 'markdown',
        markdown: {
          title: '周报提醒: ',
          text: `## 周报提醒:\n 周报格式: http://gitlaball.nicetuan.net/fe/projects/blob/master/templates/Mail-Weekly-Report.md \n\n ${atMobiles.map(mobile => '@' + mobile).join(' ')}`
        },
        at: {
          atMobiles,
          isAtAll: false
        }
      },
      responseType: 'json'
    })
    console.info(body)
  } else {
    console.info('周报已收到!!!')
  }
}
