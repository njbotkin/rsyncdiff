#! /usr/bin/env node

const { diff } = require('./index')
const cli = require('commander')
const gitignore = require('parse-gitignore')

function list(val) {
  return val.split(',')
}

cli
  .version('0.1.0')
  .usage('[options] <local> <remote>')
  .option('--exclude <items>', '(comma-delimited list) directories or files', list, [])
  .option('--gitignore [path-to-git-ignore]', 'Excludes files from specified .gitignore file (defaults to working-directory .gitignore)')
  .option('--include <items>', '(comma-delimited list) remove items from exclude list', list, [])
  .on('--help', function(){
	console.log('')
	console.log('  Example:')
	console.log('')
	console.log('    $ rsyncdiff localpath user@host:~/remotepath')
	console.log('')
  })
  .parse(process.argv)

var exclude = cli.exclude
var include = cli.include

if(cli.gitignore) {
	let path = cli.gitignore === true ? '.gitignore' : cli.gitignore
	exclude = exclude.concat(gitignore(path))
}

exclude = exclude.filter(e => include.indexOf(e) < 0)

if (cli.args.length < 2) {
   console.error('need local and remote paths')
   process.exit(1)
}

diff(cli.args[0], cli.args[1], {
	exclude
})