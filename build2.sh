#!/usr/bin/env bash

buildDir="dist/octra/"
targetFolder="core"
baseHref="https://www.phonetik.uni-muenchen.de/apps/octra/octra-dev/"
#dev=""
dev="-c dev"

# change this list to your needs (for exclusion of files or folders in the dist folder)
excludedList='"config" "LICENCE.txt"'

# 1 = disable indexing, 2 = enable
disableRobots=1

timeNow=`date "+%Y-%m-%d %H:%M:%S"`
octraVersion="1.3.1"

echo "Building OCTRA..."
node --max-old-space-size=12000 ./node_modules/@angular/cli/bin/ng build --prod ${dev} --base-href "${baseHref}"
mkdir "./${buildDir}core"
echo "Change index.html..."
indexHTML=$(<${buildDir}index.html)
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(assets\)/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(scripts\.[0-9a-z]*\.js\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(polyfills-es5\.[0-9a-z]*\.js\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(polyfills-es2015\.[0-9a-z]*\.js\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(src=\"\)\(-es2015\.[0-9a-z]*\.js\)/\1.\/${targetFolder}\/\2/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(src=\"\)\(-es5\.[0-9a-z]*\.js\)/\1.\/${targetFolder}\/\2/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(main-es2015\.[0-9a-z]*\.js\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(main-es5\.[0-9a-z]*\.js\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(runtime-es2015\.[0-9a-z]*\.js\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(runtime-es5\.[0-9a-z]*\.js\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(styles\.[0-9a-z]*\.css\)/.\/${targetFolder}\/\1/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(const octraLastUpdated = \"\).*\(\";\)/\1${timeNow}\2/g")
indexHTML=$(echo "${indexHTML}" | sed -e "s/\(const octraVersion = \"\).*\(\";\)/\1${octraVersion}\2/g")

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

    if [[ ${entry} != 'index.html' ]] && [[ ${entry} != ${targetFolder} ]] && [[ ${found} == 0 ]]
    then
      mv "./${buildDir}${entry}" "./${buildDir}${targetFolder}/${entry}"
    fi
  done

# you can add more jobs here
mv "./${buildDir}${targetFolder}/assets/.htaccess" "./${buildDir}.htaccess"

echo "Building COMPLETE"
