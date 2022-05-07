#!/bin/sh

MISSING=$( (
	sed -n '2,/CONTRACTSOLVER/s/^[ \t]*"\(\S*\)"[],;]*/\1/p' git-pull.js
	ls *.js
) | sort | uniq -c | grep -v ' 2 ')

if [ -n "$MISSING" ] ; then
  echo "Files are missing from git-pull.js:" $MISSING
  exit 1
fi