var fs = require('fs')
var chalk = require('chalk')
var dom = require('xmldom').DOMParser
var args = process.argv.slice(2)
var file= args[0]

if (!file) {
  console.log(chalk.white.bgRed.bold('File path not exsits, Please provide args for file paht.'))
  return
}

fs.readFile(file, 'utf8', function (err, data) {
  if (err) throw err

  var doc = new dom().parseFromString(data)
  var nodes = doc.documentElement.getElementsByTagName('rect')
  var els = []
  for (var i = 0; i < nodes.length; i++) {
    els.push({
      id: i,
      svgId: nodes[i].getAttribute('id'),
      x: +nodes[i].getAttribute('x'),
      y: +nodes[i].getAttribute('y'),
      width: nodes[i].getAttribute('width'),
      height: nodes[i].getAttribute('height')
    })
  }
  fs.writeFile('dist/sample.json', JSON.stringify(els, null, 2), 'utf8', function (err) {
    if (err) throw err
    console.log('Complete', els.length ,'seats')
  })
})



