require('dotenv').config();
const express = require('express');
const app = express();
const archiverOptions = { format: 'zip', level: 0, highWaterMark: 1024 * 1024 * 4 };

const S3 = require('aws-sdk').S3;
const s3Creds = {
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
};
const s3 = new S3(s3Creds);
const yas3z = require('yas3z');
const bucket = 'mybucketname';

const s3Folder = 'sample/path/to';
const s3Files = require('./ar.js');
console.log('s3Files length: ', s3Files.length);

//const renameFunc = (name) => name.replace(/\.jpg$/, '.jpeg');
const renameFunc = (name) => {
  const result = name.replace(/\.jpg$/, '.jpeg');
  console.log('[renameFunc] ', name, ' => ', result);
  return (result);
}

app.get('/', function (req, res) {
  res.on('close', function() {
    console.log('res closed.', new Date());
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="test.zip"');

  yas3z.archive({ s3, s3Folder, s3Files, archiverOptions, bucket, debug: true, renameFunc }).pipe(res);

})

app.listen(3000);


function intervalFunc() {
  const mem = process.memoryUsage();
  process.stdout.cursorTo(0,0);
  console.log("mem: rss:", mem.rss/1024/1024, " M                \n                                ");
  process.stdout.cursorTo(0, process.stdout.rows - 1);
}

setInterval(intervalFunc, 100);
