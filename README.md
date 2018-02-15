## rsyncdiff

Use bidirectional rsync and pretty formatting for quick filesystem diffs.

`$ rsyncdiff --help`

```
  Usage: rsyncdiff [options] <local> <remote>


  Options:

    -V, --version                     output the version number
    --exclude <items>                 (comma-delimited list) directories or files (default: )
    --gitignore [path-to-git-ignore]  Excludes files from specified .gitignore file (defaults to working-directory .gitignore)
    --include <items>                 (comma-delimited list) remove items from exclude list (default: )
    -h, --help                        output usage information

  Example:

    $ rsyncdiff localpath user@host:~/remotepath
```

### How good is it?

It will only tell you

	1) If there are new files on either side
	2) If any files are different, and which files are newer

### How does it do it?

`rsync [from] [to] -crlinz`
`rsync [to] [from] -curlinz` 

### Pretty output:

I'll put in screenshots later.