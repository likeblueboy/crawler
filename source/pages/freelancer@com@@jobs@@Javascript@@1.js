var nightmare = require('nightmare')

var meta = require('_meta')
var get = require('_get')

var URL = get.url(__filename)
var NAME = get.name(URL)

module.exports = execute

function execute (opts, done) {
  if (typeof done !== 'function') return
  opts = opts || { show: false }
  opts.show = true
  nightmare(opts)
  .goto(`http://${URL}`)
  .wait('.ProjectTable-title')
  .evaluate(query)
  .end()
  .run(nextPage)

  var allUrls = []

  function nextPage (error, data) { //because of .run, we need 2 arguments: err & result
    if (error) return done(error)
    allUrls = allUrls.concat(data.urls)
    console.log(`collected urls: ${allUrls.length}`)
    var next = data.next
    console.log(next)
    if (next) return nightmare(opts)
      .goto(next)
      .wait('.ProjectTable-title a')
      .evaluate(query)
      .end()
      .run(nextPage)
    console.log("GOING TO COLLECT NOW")
    collect(error, allUrls)
  }

  function collect (error, urls) {
    console.log("START COLLECTING")
    if (error) return done(error)
    var DATA = []
    var total = urls.length
    if (urls.length) next(urls.pop(), callback)
    function callback (error, data) {
      if (error) return done(error)
      if (data) DATA.push(data)
      console.log(`${urls.length}/${total} - ${URL}`)
      if (urls.length) next(urls.pop(), callback)
      else {
        console.log("I'M DONE")
        done(null, { NAME, DATA })
      }
    }
  }

}

function next (url, cbFn) {
  nightmare()
  .goto(url)
  .wait('.Grid-col')
  .evaluate(query)
  .end()
  .run(analyze)

  function query (){
    return document.querySelector('.Grid-col').innerText
  }
  function analyze (error, text) {
    if (error) return cbFn(error)
    meta({ item: {}, raw: text }, filter)
  }
  function filter (error, data) { // data = { item: {}, raw: text, meta: { pros: [], cons: [] } }
    if (error) return done(error)
    if (data.meta.cons.length) return cbFn()
    cbFn(null, data)
  }
}

function query () {
  var urls = []
  console.log("URLS " + urls)
  var nodeList = document.querySelectorAll('.ProjectTable-title a')
  console.log("NODE lIST " + nodeList)
  ;(nodeList||[]).forEach(function (x) {
    urls.push(x.href)
  })
  console.log("URLS " + urls)
  var array = document.querySelectorAll('.Pagination-item a')||[]
  var next
  if (array[array.length - 2].getAttribute('class') != 'btn next paginate_button Pagination-link') {
    next = (document.querySelectorAll('.Pagination-item a')[array.length - 2]).href
  } else {
    next = {}.href
  }
  return { urls, next } // same as `{ urls:urls, next:next }`
}