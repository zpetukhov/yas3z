const archiver = require('archiver');
const assert = require('assert');
const path = require('path');

const yas3z = {};
module.exports = yas3z;

yas3z.archive = function(opts) {

  const debug = opts.debug || false;
  const { s3, s3Folder, s3Files, archiverOptions, bucket, format, preserveFolderStructure, renameFunc } = opts;

  assert(typeof s3 === 'object', 'opts.s3 must be an instance of AWS.S3');
  assert(typeof s3.getObject === 'function', 'opts.s3 must be an instance of AWS.S3');
  assert(Array.isArray(s3Files), 'opts.s3Files must be an array of s3 keys');
  assert(s3Files.length > 0, 'opts.s3Files must be an non-empty array of s3 keys');
  assert(typeof bucket === 'string', 'opts.bucket must be a string');

  const archive = archiver(format || 'zip', archiverOptions || {});
  var pointer = 0;

  const archiveAppend = function() {
    debug && console.log('s3Zip file ' + (pointer + 1) + '/' + s3Files.length);
    const s3File = s3Files[pointer];
    const s3Key = s3Folder ? path.posix.join(s3Folder, s3File) : s3File;
    const s3FileStream = s3.getObject({ Bucket: bucket, Key: s3Key }).createReadStream();
    
    s3FileStream.on('end', function () {
      debug && console.log('s3FileStream end: ', s3File);
    });
    
    s3FileStream.on('error', function (err) {
      debug && console.log('s3FileStream error: ', s3File, err.message);
    });
    s3FileStream.on('warning', function (err) {
      debug && console.log('s3FileStream warning: ', s3File, err.message);
    });
    let name = preserveFolderStructure ? s3File : s3File.replace(/^.*[\\/]/, '');
    if (renameFunc) name = renameFunc(name);
    archive.append(s3FileStream, { name });
    pointer++;
  }

  archive.on('error', function (err) {
    debug && console.log('archive error', err.message);
    // if (pointer < s3Files.length) {
    //   archiveAppend();
    // } else {
    //  debug && console.log('all files has been appended; no more files to append.');
    //  archive.finalize();
    // The code above doesn't work, and needs further investigation (the archive stream is not closed properly after errors)
    // Immediate call to abort is also doesn't work properly.
    setTimeout(() => {
      debug && console.log('aborting archive');
      archive.abort();
    }, 100);
  });
  archive.on('warning', function (err) {
    debug && console.log('archive warning', err);
  });
  archive.on('entry', function(entryData) {
    debug && console.log('archive entry:', entryData.name, archive.pointer());
    if (pointer < s3Files.length) {
      archiveAppend();
    } else {
      debug && console.log('all files has been appended; no more files to append.');
      //archive.finalize();
      setTimeout(() => {
        debug && console.log('finalizing archive');
        archive.finalize();
      }, 100);
    }
  });
  archive.on('progress', function(progr) {
    debug && console.log('archive progress:', progr);
    debug && console.log(archive.pointer());
  });

  archive.on('end', function () {
    debug && console.log('archive.end');
  });
  archive.on('close', function (err) {
    debug && console.log('archive.close', err);
  });
  archive.on('finish', function () {
    debug && console.log('archive.finish');
  });

  archiveAppend();
  return (archive);
}
