#! /usr/bin/env node

const { diff } = require(`./index`)
const cli = require(`commander`)
const gitignore = require(`parse-gitignore`)

async function main() {
	function list(val) {
		return val.split(`,`)
	}

	cli
		.version(`0.1.0`)
		.usage(`[options] <local> <remote>`)
		.option(`--exclude <items>`, `(comma-delimited list) directories or files`, list, [])
		.option(`--gitignore [path-to-git-ignore]`, `Excludes files from specified .gitignore file`, `.gitignore`)
		.option(`--include <items>`, `(comma-delimited list) remove items from exclude list`, list, [])
		.option(`-e, --rsh <command>`, `specify the remote shell to use`, ``)
		.on(`--help`, () => {
			console.log(``)
			console.log(`  Example:`)
			console.log(``)
			console.log(`    $ rsyncdiff localpath user@host:~/remotepath`)
			console.log(``)
		})
		.parse(process.argv)

	let exclude = cli.exclude
	const include = cli.include
	const rsh = cli.rsh

	try {
		if (cli.gitignore) {
			exclude = exclude.concat(gitignore(cli.gitignore))
		}

		exclude = exclude.filter(e => include.indexOf(e) < 0)

		if (cli.args.length < 2) {
			throw `need local and remote paths`
		}

		await diff(cli.args[0], cli.args[1], {
			exclude,
			rsh,
		})
	} catch (error) {
		console.log(`rsyncdiff:`, error)
		process.exit(1)
	}
}

main()
