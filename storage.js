const { Storage } = require("@google-cloud/storage");
const path = require("path");
require("dotenv").config();


const base64Key = process.env.GOOGLE_CLOUD_STORAGE_KEY;
const keyJson = Buffer.from(base64Key, 'base64').toString('utf-8');
const keyFilename = JSON.parse(keyJson);

const storage = new Storage({
  keyFilename: keyFilename,
  projectId: "elegant-moment-440103-f0",
});

const bucketName = "popcornmovie";

async function readFileContent(fileName, lineNumber = null) {
  try {
    const file = storage.bucket(bucketName).file(fileName);

    if (lineNumber !== null && fileName === "similarity.json") {
      const [contents] = await file.download();
      const data = JSON.parse(contents.toString("utf-8"));

      return data[lineNumber] || [];
    } else {
      const [contents] = await file.download();
      return JSON.parse(contents.toString("utf-8"));
    }
  } catch (error) {
    console.error(`Error reading file ${fileName}:`, error);
    throw new Error("Failed to read file from GCS");
  }
}

module.exports = {
  readFileContent,
};
