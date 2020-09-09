const fs = require("fs");

const path = require('path');
const {NodeSSH} = require('node-ssh');
const process = require('process');
const ssh = new NodeSSH();

const configText = fs.readFileSync("./deploy.config.json", {
  encoding: "utf8"
});
const config = JSON.parse(configText);

console.log(`connect via ssh...`);
const timeStamp = getDateTimeString();

start().then(() => {
  console.log(`finished`);
  process.exit();
}).catch((error) => {
  console.log(error);
});

async function start() {
  try {
    let success = true;

    await ssh.connect({
      host: config.server.host,
      username: config.server.userName,
      password: config.server.password,
      tryKeyboard: true,
      port: config.server.port
    });
    console.log(`connected!`);
    try {
      fs.unlinkSync(`${config.distPath}.DS_Store`);
    } catch (e) {
    }

    if (config.hasOwnProperty("groups") && Array.isArray(config.groups)) {
      for (const group of config.groups) {
        // replace base-href

        let indexHTMLOriginal = fs.readFileSync(`${config.distPath}index.html`, {
          encoding: "utf8"
        });

        for (const listElement of group.list) {
          let indexHTML = indexHTMLOriginal;
          indexHTML = indexHTML.replace(/(<base href=")[^"]+(">)/g, `$1${listElement.baseHref}$2`);

          if (listElement.hasOwnProperty("robots") && listElement.robots === true) {
            indexHTML = indexHTML.replace(/(<meta name="robots" content="noindex">)/g, "");
          }

          fs.writeFileSync(`${config.distPath}index.html`, indexHTML, {
            encoding: "utf8"
          });
          console.log(`indexed html changed for ${listElement.baseHref}`);

          try {
            console.log(`backup ${listElement.path} ...`);
            await backupDir(ssh, listElement.path, "/raid/r29/WWW/htdocs/apps/octra/backups/");

            try {
              console.log(`remove folders from ssh...`);
              await clearRemote(config.distPath, listElement.path);

              console.log(`upload via ssh to ${listElement.path}...`);
              const failed = [];
              const successful = [];

              try {
                const status = await ssh.putDirectory(`${config.distPath}`, listElement.path, {
                  recursive: true,
                  concurrency: 1,
                  validate: function (itemPath) {
                    const baseName = path.basename(itemPath);
                    return baseName !== ".DS_Store";
                  },
                  tick: function (localPath, remotePath, error) {
                    if (error) {
                      failed.push(localPath)
                      console.log(`failed: ${localPath}`);
                    } else {
                      successful.push(localPath)
                    }
                  }
                });

                success = success && failed.length === 0;
                console.log('the directory transfer was', status ? 'successful' : 'unsuccessful');
                console.log('failed transfers:', failed.length);
                console.log('successful transfers:', successful.length);
                console.log(`---------`);
              } catch (e) {
                console.log(e);
              }
            } catch (e) {
              console.log(e);
            }
          } catch (e) {
            console.log(e);
            console.log(`backup failed!`);
          }
        }
        console.log(`success? ${success}`);
        console.log(`disconnect...`);
        ssh.dispose();
      }
    }
  } catch (e) {
    console.log(e);
  }
}

ssh.connect({
  host: config.server.host,
  username: config.server.userName,
  password: config.server.password,
  tryKeyboard: true,
  port: config.server.port
}).then(() => {
}).catch((error) => {
  console.log(error);
});


function clearRemote(distPath, remotePath) {
  const files = fs.readdirSync(distPath);
  const promises = [];

  for (const file of files) {
    promises.push(ssh.execCommand(`rm -rf ${remotePath}${file}`));
  }
  return Promise.all(promises);
}

function backupDir(ssh, remotePath, backupDir) {
  return new Promise((resolve, reject) => {
    let tmpPath = remotePath.substr(0, remotePath.length - 1);
    const dirName = tmpPath.substr(tmpPath.lastIndexOf("/") + 1);

    ssh.execCommand(`cp -rf ${remotePath} ${backupDir}${timeStamp}_${dirName}`).then(function (result) {
      if (result.stderr) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

function getDateTimeString() {
  const today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let h = today.getHours();
  let min = today.getMinutes();
  let sec = today.getSeconds();

  const yyyy = today.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  if (h < 10) {
    h = '0' + h;
  }
  if (min < 10) {
    min = '0' + min;
  }
  if (sec < 10) {
    sec = '0' + sec;
  }
  return `${yyyy}-${mm}-${dd}_${h}-${min}-${sec}`;
}
