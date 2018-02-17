const chalk = require(`chalk`)
const pify = require(`pify`)
const { exec } = pify(require(`child_process`))

const terminalWidth = (process.stdout && process.stdout.columns) ? process.stdout.columns : 80

module.exports = {
	diff: (local, remote, { exclude = [], rsh }) => {
		rsh = rsh ? `-e "` + rsh + `"` : ``

		exclude = exclude.reduce((a, e) => a + ` --exclude "` + e + `"`, ``)

		const flags = `-crlinz` // matches ALL different files
		const reverse_flags = `-curlinz` // only matches files on remote that are newer

		return Promise.all([
			exec(`rsync ` + rsh + ` ` + local + ` ` + remote + ` ` + exclude + ` ` + flags),
			exec(`rsync ` + rsh + ` ` + remote + ` ` + local + ` ` + exclude + ` ` + reverse_flags),
		])
			.then(res => {
				console.log(`\n key:  ` + chalk.bgCyan(`  `) + chalk.bold.cyan(` new  `) + chalk.bgYellow(`  `) + chalk.bold.yellow(` newer `) + `\n`)

				function jsonify(string) {
					return string.split(`\n`).map(c => {
						const s = c.indexOf(` `)
						return { gibber: c.substring(0, s), name: c.substring(s + 1) }
					})
				}

				const here = jsonify(res[0] || ``)
				const there = jsonify(res[1] || ``)

				here.pop()
				there.pop()

				const both = []

				// merge here and there
				here.forEach(e => {
					both[e.name] = { here: e.gibber, there: `` }
				})
				there.forEach(e => {
					if (both[e.name]) {
						both[e.name].there = e.gibber
					} else {
						both[e.name] = { here: ``, there: e.gibber }
					}
				})

				const table = []
				// convert obj to array
				for (const i in both) {
					table.push({ name: i, row: both[i] })
				}

				if (table.length === 0) {
					return Promise.reject(`No differences.`)
				}

				// print side-by-side
				const colwidth = Math.floor((terminalWidth - 6) / 2)
				const colcenter = colwidth / 2

				function fit(str) {
					let strProcessed
					if (str.length > colwidth) {
						// truncate middle
						const overflow = str.length - colwidth + 1
						const remove = str.substr(colcenter, overflow)
						strProcessed = str.replace(remove, `…`)
					} else {
						// right-pad
						strProcessed = str
						let l = colwidth - str.length
						for (l; l > 0; l--) {
							strProcessed += ` `
						}
					}
					return strProcessed
				}

				console.log(` ` + fit(local) + `    ` + fit(remote) + `\n`)

				// draw table
				table.forEach(e => {
					const r = e.row

					if (r.here) {
						if (r.here[1] === `f`) {
							// file
							if (r.here[2] === `c`) {
								// change event
								if (r.there) {
									// file newer on remote
									console.log(` ` + chalk.bold.black(fit(e.name)) + `    ` + chalk.bold.yellow(fit(e.name)))
								} else {
									// file newer on local
									console.log(` ` + chalk.bold.yellow(fit(e.name)) + `    ` + chalk.bold.black(fit(e.name)))
								}
							}

							if (r.here[2] === `+`) {
								// file does not exist on remote
								console.log(` ` + chalk.bold.cyan(fit(e.name)) + `    ` + fit(``))
							}
						}

						if (r.here[1] === `d`) {
							// directory does not exist on remote
							console.log(` ` + chalk.bold.cyan(fit(e.name)) + `    ` + fit(``))
						}
					} else if (r.there) {
						if (r.there[1] === `f` && r.there[2] === `+`) {
							// file does not exist on local
							console.log(` ` + fit(``) + `    ` + chalk.bold.cyan(fit(e.name)))
						}
						if (r.there[1] === `d`) {
							// directory does not exist on local
							console.log(` ` + fit(``) + `    ` + chalk.bold.cyan(fit(e.name)))
						}
					}
				})

				if (here.length == 0) {
					throw `Nothing to transfer!`
				}

				return 0
			})
	},
}
