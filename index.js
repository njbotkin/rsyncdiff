const chalk = require('chalk')
const pify = require('pify')
const { exec } = pify(require('child_process'))

const terminalWidth = (process.stdout && process.stdout.columns) ? process.stdout.columns : 80

module.exports = {
  diff: (local, remote, { exclude = [] }) => {

      exclude = exclude.reduce((a, e) => a+' --exclude "'+e+'"', '')

      var flags = '-crlinz' // matches ALL different files
      var reverse_flags = '-curlinz' // only matches files on remote that are newer

      return Promise.all([
        exec('rsync '+local+' '+remote+' '+exclude+' '+flags),
        exec('rsync '+remote+' '+local+' '+exclude+' '+reverse_flags)
      ])
      .then(function(res) {

        console.log('\n key:  ' + chalk.bgCyan('  ') + chalk.bold.cyan(' new  ') + chalk.bgYellow('  ') + chalk.bold.yellow(' newer ') + '\n')

        function jsonify (string) {
          return string.split('\n').map(function(c) {
            var s = c.indexOf(' ')
            return {gibber: c.substring(0, s), name: c.substring(s+1)}
          })
        }

        var here = jsonify(res[0] || '')
        var there = jsonify(res[1] || '')

        here.pop()
        there.pop()

        var both = []

        // merge here and there
        here.forEach(function (e) {
          both[e.name] = {here: e.gibber, there: ''}
        })
        there.forEach(function (e) {
          if(both[e.name]) {
            both[e.name].there = e.gibber
          } else {
            both[e.name] = {here: '', there: e.gibber}
          }
        })

        var table = []
        // convert obj to array
        for(var i in both) {
          table.push({name: i, row: both[i]})
        }

        if(table.length === 0) {
            return Promise.reject('No differences.')
        }

        // print side-by-side
        var colwidth = Math.floor((terminalWidth - 6) / 2)
        var colcenter = colwidth/2

        function process(str) {
          var strProcessed
          if(str.length > colwidth) {
            // truncate middle
            var overflow = str.length - colwidth + 1
            var remove = str.substr( colcenter, overflow )
            strProcessed = str.replace(remove, '…')
          } else {
            // right-pad
            strProcessed = str
            var l = colwidth - str.length
            for(l; l > 0; l--) strProcessed += ' '
          }
          return strProcessed
        }

        console.log(' ' + process(local) + '    ' + process(remote) + '\n')

        // draw table
        table.forEach(function(e) {
          let r = e.row

          if(r.here) {

            if(r.here[1] === 'f') {
              // file
              if(r.here[2] === 'c') {
                // change event
                if(r.there) {
                  // file newer on remote
                  console.log(' ' + chalk.bold.black(process(e.name)) + '    ' + chalk.bold.yellow(process(e.name)))
                } else {
                  // file newer on local
                  console.log(' ' + chalk.bold.yellow(process(e.name)) + '    ' + chalk.bold.black(process(e.name)))
                }
              }

              if(r.here[2] === '+') {
                // file does not exist on remote
                console.log(' ' + chalk.bold.cyan(process(e.name)) + '    ' + process(''))
              }
            }

            if(r.here[1] === 'd') {
              // directory does not exist on remote
              console.log(' ' + chalk.bold.cyan(process(e.name)) + '    ' + process(''))
            }

          }
          else if(r.there) {

            if(r.there[1] === 'f' && r.there[2] === '+') {
              // file does not exist on local
              console.log(' ' + process('') + '    ' + chalk.bold.cyan(process(e.name)))
            }
            if(r.there[1] === 'd') {
              // directory does not exist on local
              console.log(' ' + process('') + '    ' + chalk.bold.cyan(process(e.name)))
            }

          }
        })

        if(here.length == 0) {
          return Promise.reject('Nothing to transfer!')
        }

        return true

      })
      .catch(function(e) {
        console.log(e)
        return {err: e}
      })
  }
}