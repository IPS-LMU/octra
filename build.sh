#!/usr/bin/env bash

buildDir="dist/octra/"
baseHref="https://www.phonetik.uni-muenchen.de/apps/octra/octra-dev/"

# change this list to your needs (for exclusion of files or folders in the dist folder)
excludedList='"config" "LICENCE.txt"'

# 1 = disable indexing, 2 = enable
disableRobots=1

echo "Building OCTRA..."
ng build --prod --base-href "${baseHref}"
echo "Change index.html..."
indexHTML=$(<${buildDir}index.html)
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(scripts\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(es2015-polyfills\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(src="\)\(polyfills\.[0-9a-z]*\.js\)/\1.\/assets\/\2/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(main\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(runtime\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(styles\.[0-9a-z]*\.css\)/.\/assets\/\1/g')

if [[ ${disableRobots} == 0 ]]
then
  indexHTML=$(echo "${indexHTML}" | sed -e 's/\(<meta name="robots" content="noindex">\)/<\!--\1-->/g')
fi

echo "${indexHTML}" > ${buildDir}index.html

regEx=$(echo "${buildDir}" | sed 's:\/:\\/:g')
regEx="s|\.\/${regEx}||g"
echo ${regEx}

for old in ./${buildDir}*; do
    entry=$(echo $old | sed -e "${regEx}")
    found=0

    if [[ ${excludedList} != '' ]]
    then
      for excluded in ${excludedList}; do
        echo "compare ${entry} with ${excluded}"
        if [[ "\"${entry}\"" == ${excluded} ]]
        then
          found=1
          break
        fi
      done
    fi

    if [[ ${entry} != 'index.html' ]] && [[ ${entry} != 'assets' ]] && [[ ${found} == 0 ]]
    then
      mv "./${buildDir}${entry}" "./${buildDir}assets/${entry}"
    fi
  done
# you can add more jobs here
# mv "./${buildDir}assets/.htaccess" "./${buildDir}.htaccess"

echo "Building COMPLETE"
