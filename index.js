const express = require("express");
const cors = require("cors");
const path = require("path");
const { readFileContent } = require("./storage");
require("dotenv").config();


const app = express();
app.use(express.json());

// const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];
// app.use(cors({
//   origin: allowedOrigins,
//   methods: ["POST", "GET"],
//   credentials: true,
// }))

const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173"];

// Set up CORS with specified origins and credentials
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "GET"],
  credentials: true,
}));



let movies = [];
let similarity = [];

// const loadDataFromGCS = async () => {
//   try {
//     movies = await readFileContent("movie.json");
//     similarity = await readFileContent("similarity.json");
//   } catch (error) {
//     console.error("Error loading data from GCS:", error);
//     throw new Error("Failed to load data");
//   }
// };

const loadDataFromGCS = async () => {
  try {
    console.log("Attempting to load movies from GCS...");
    movies = await readFileContent("movie.json");
    similarity = await readFileContent("similarity.json");
  } catch (error) {
    console.error("Error loading data from GCS:", error);
    throw new Error("Failed to load data");
  }
};

loadDataFromGCS()
  .then(() => {
    console.log("Data loaded successfully");
  })
  .catch((error) => {
    console.error("Failed to load data:", error);
  });

const getRecommendations = async (movieTitle) => {
  const movieIndex = movies.findIndex(
    (m) => m.title.toLowerCase() === movieTitle.toLowerCase()
  );
  if (movieIndex === -1) return [];

  let similarities;
  try {
    similarities = await readFileContent("similarity.json", movieIndex);
  } catch (error) {
    console.error(
      `Error fetching similarities for movie ${movieTitle}:`,
      error
    );
    return [];
  }

  if (!similarities) {
    console.error(`No similarities found for movie: ${movieTitle}`);
    return [];
  }

  return similarities
    .map((score, index) => ({
      movie: movies[index],
      score,
    }))
    .filter(
      (item) =>
        item.score > 0.1 &&
        item.movie.title.toLowerCase() !== movieTitle.toLowerCase()
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((item) => item.movie);
};

// app.get("/movies", (req, res) => {
//   if (movies.length === 0) {
//     return res.status(500).json({ error: "Movie data is not loaded" });
//   }
//   res.json(movies);
// });

app.get("/movies", async (req, res) => {
  if (movies.length === 0) {
    try {
      await loadDataFromGCS();
    } catch (error) {
      return res.status(500).json({ error: "Failed to load data" });
    }
  }
  res.json(movies);
});


app.post("/recommend", async (req, res) => {
  const { movieTitle } = req.body;
  if (!movieTitle) {
    return res.status(400).json({ error: "Movie title is required" });
  }

  try {
    const recommendations = await getRecommendations(movieTitle);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
