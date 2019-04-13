#!/usr/bin/env bash

buildDir="dist/"
appName="octra-dev"
disableRobots=1

echo "Building OCTRA..."
ng build --prod --base-href "https://www.phonetik.uni-muenchen.de/apps/octra/${appName}/"
echo "Change index.html..."
indexHTML=$(<${buildDir}index.html)
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(scripts\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(polyfills\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(main\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(runtime\.[0-9a-z]*\.js\)/.\/assets\/\1/g')
indexHTML=$(echo "${indexHTML}" | sed -e 's/\(styles\.[0-9a-z]*\.css\)/.\/assets\/\1/g')

if [[ ${disableRobots} == 0 ]]
then
  indexHTML=$(echo "${indexHTML}" | sed -e 's/\(<meta name="robots" content="noindex">\)/<\!--\1-->/g')
fi

echo "${indexHTML}" > ${buildDir}index.html

for old in ./${buildDir}*; do
    new=$(echo $old | sed -e 's/\.\/dist\///g')
    if [[ ${new} != 'index.html' ]] && [[ ${new} != 'assets' ]] && [[ ${new} != 'config' ]] && [[ ${new} != 'LICENSE.txt' ]]
    then
      mv "./${buildDir}${new}" "./${buildDir}assets/${new}"
    fi
    #mv -v "$old" "$new"
  done

mv "./${buildDir}assets/.htaccess" "./${buildDir}.htaccess"
echo "Building COMPLETE"