const express = require('express');
const multer = require('multer');
const fileStorage = require('./fileStorage');

const app = express();
const port = process.env.PORT || 3000;

// Set up file upload
const upload = multer({ dest: process.env.FOLDER || 'uploads/' });

// Define API endpoints
app.post('/files', upload.single('file'), fileStorage.uploadFile);
app.get('/files/:publicKey', fileStorage.downloadFile);
app.delete('/files/:privateKey', fileStorage.deleteFile);

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});