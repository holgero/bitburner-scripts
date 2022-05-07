#!/bin/sh

(
	sed -n '2,/CONTRACTSOLVER/s/^[ \t]*"\(\S*\)"[],;]*/\1/p' git-pull.js
	ls *.js
) | sort | uniq -c | grep -v ' 2 '
