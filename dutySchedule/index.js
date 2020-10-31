const fs = require('fs')
const path = require('path')
const { shuffle, unzip } = require('lodash')
const { startOfWeek, format } = require('date-fns')
const puppeteer = require('puppeteer')

const groupA = ['周龙飞', '高智恒', '陈丽芬', '王京', '张义']
const groupB = ['李明星', '刘亚晶', '袁野', '马现文', '胡雅斯']

const weekMap = {
  0: '星期一',
  1: '星期二',
  2: '星期三',
  3: '星期四',
  4: '星期五'
}
const weekdays = {
  '星期一': [],
  '星期二': [],
  '星期三': [],
  '星期四': [],
  '星期五': []
}

const name = `duty-schedule-${format(startOfWeek(new Date), 'yyyy-MM-dd')}`

// @TODO Change it
let shuffleA = shuffle(groupA)
let shuffleB = shuffle(groupB)
for (let i = 0; i < 5; i++) {
  if (i == 2) {
    const lastA = shuffleA[4]
    const lastB = shuffleB[4]
    groupA.splice(groupA.indexOf(lastA), 1)
    groupB.splice(groupB.indexOf(lastB), 1)
    shuffleA = [...shuffleA, ...shuffle(groupA)].concat([lastA])
    shuffleB = [...shuffleB, ...shuffle(groupB)].concat([lastB])
  }
  weekdays[weekMap[i]].push(shuffleA[2 * i], shuffleA[ 2 * i + 1])
  weekdays[weekMap[i]].push(shuffleB[2 * i], shuffleB[ 2 * i + 1])
}

// Create HTML 
const html = 
`
<html>
  <head>
    <style>
      table {
        width: 100%;
      }
      tr {
        text-align: left;
        border: 1px solid black;
      }
      th {
        font-weight: bold;
        background: #CCC;
      }
      th, td {
        padding: 15px;
      }
    </style>
  </head>
  <body>
    <h1>${name}</h1>
    <table>
      <tr>
        ${Object.keys(weekdays)
          .map(day => `<th>${day}</th>`)
          .join('\n')}
      </tr>

      <tr>
      ${unzip(Object.values(weekdays))
        .map(persons => `<tr>${persons.map(p => `<td>${p}</td>`).join('\n')}</tr>`)
        .join('\n')}
      </tr>
    </table>
  </body>
</html>
`
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}
if (fs.existsSync(`dist/${name}.png`)) {
  console.info('排班表已存在!!!')
  return
}
fs.writeFileSync(`dist/${name}.html`, html)

// Generate Image
;(async function screenshot() {
	const browser = await puppeteer.launch()
  const page = await browser.newPage()
	await page.goto('file://' + path.resolve(`./dist/${name}.html`), { waitUntil: 'networkidle0' })
	await page.screenshot({ path: `dist/${name}.png` })
  await browser.close()
})()
