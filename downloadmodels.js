const https = require('https');
const fs = require('fs');
const path = require('path');

const modelUrls = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-shard1'
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1'
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_expression_model-weights_manifest.json'
  },
  {
    name: 'face_expression_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_expression_model-shard1'
  }
];

const modelsDir = path.join(process.cwd(), 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Download function
const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}. Status code: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(filePath, () => {
        reject(err);
      });
    });
  });
};

// Download all models
async function downloadModels() {
  console.log('Starting model downloads...');
  
  for (const model of modelUrls) {
    const filePath = path.join(modelsDir, model.name);
    console.log(`Downloading ${model.name}...`);
    
    try {
      await downloadFile(model.url, filePath);
      console.log(`Successfully downloaded ${model.name}`);
    } catch (error) {
      console.error(`Error downloading ${model.name}:`, error);
    }
  }
  
  console.log('Download process completed!');
}

// Run the download
downloadModels();