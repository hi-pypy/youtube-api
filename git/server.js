const express = require('express');
const bodyParser = require('body-parser');
const authorize = require('./authorize');
const uploadVideosSequentially = require('./uploadVideosSequentially');

const app = express();
const port = 3000;
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

app.use(bodyParser.json());
app.use(express.static('src'));

app.get('/upload-videos', async (req, res) => {
  try {
    await authorize(SCOPES, async (auth) => {
      await uploadVideosSequentially(auth, [
        '1 Min Countdown Timer red.mp4',
        '2 Min Countdown Timer green.mp4',
        '3 Min Countdown Timer yellow.mp4',
        '4 Min Countdown Timer blue.mp4',
        '5 Min Countdown Timer white.mp4',
        '6 Min Countdown Timer black.mp4',
        '7 Min Countdown Timer gray.mp4',
        '8 Min Countdown Timer pink.mp4',
        '9 Min Countdown Timer red.mp4',
        '10 Min Countdown Timer green.mp4',
        // Other video files
      ]);
    });

    res.json({ message: 'Videos uploaded successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🌐 Server is running at http://localhost:${port}`);
});
