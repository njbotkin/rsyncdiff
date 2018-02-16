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
		.option(`--gitignore [path-to-git-ignore]`, `Excludes files from specified .gitignore file (defaults to working-directory .gitignore)`)
		.option(`--include <items>`, `(comma-delimited list) remove items from exclude list`, list, [])
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

	try {
		if (cli.gitignore) {
			const path = cli.gitignore === true ? `.gitignore` : cli.gitignore
			exclude = exclude.concat(gitignore(path))
		}

		exclude = exclude.filter(e => include.indexOf(e) < 0)

		if (cli.args.length < 2) {
			throw `need local and remote paths`
		}

		await diff(cli.args[0], cli.args[1], {
			exclude,
		})
	} catch (error) {
		console.log(`rsyncdiff:`, error)
		process.exit(1)
	}
}

main()
