const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { getMimeType } = require('./utils');

const MAX_UPLOADS_PER_DAY = process.env.MAX_UPLOADS_PER_DAY || 100;
const MAX_DOWNLOADS_PER_DAY = process.env.MAX_DOWNLOADS_PER_DAY || 100;

// Set up daily limits
const dailyLimits = {};
setInterval(() => {
  for (const ip in dailyLimits) {
    dailyLimits[ip].uploads = 0;
    dailyLimits[ip].downloads = 0;
  }
}, 24 * 60 * 60 * 1000);

// Set up file cleanup job
const FILE_CLEANUP_INTERVAL = process.env.FILE_CLEANUP_INTERVAL || 24 * 60 * 60 * 1000;
setInterval(() => {
  const files = db.getFiles();
  const now = new Date();
  for (const file of files) {
    if (now - file.lastAccessedAt > FILE_CLEANUP_INTERVAL) {
      fs.unlink(file.path, (err) => {
        if (err) console.error(err);
      });
      db.deleteFile(file.privateKey);
    }
  }
}, FILE_CLEANUP_INTERVAL);

exports.uploadFile = (req, res) => {
  const ip = req.ip;
  if (!dailyLimits[ip]) {
    dailyLimits[ip] = { uploads: 0, downloads: 0 };
  }
  if (dailyLimits[ip].uploads >= MAX_UPLOADS_PER_DAY) {
    res.status(429).json({ error: 'Daily upload limit exceeded' });
    return;
  }
  const file = req.file;
  const privateKey = uuidv4();
  const publicKey = uuidv4();
  const mimetype = getMimeType(file.originalname);
  const filepath = file.path;
  db.addFile({ privateKey, publicKey, mimetype, filepath });
  dailyLimits[ip].uploads++;
  res.json({ privateKey, publicKey });
};

exports.downloadFile = (req, res) => {
  const ip = req.ip;
  if (!dailyLimits[ip]) {
    dailyLimits[ip] = { uploads: 0, downloads: 0 };
  }
  if (dailyLimits[ip].downloads >= MAX_DOWNLOADS_PER_DAY) {
    res.status(429).json({ error: 'Daily download limit exceeded' });
    return;
  }
}
