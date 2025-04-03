import express, { json } from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(json());

app.get("/search", async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get(`https://serpapi.com/search.json?q=${query}&api_key=079f801083b7e05ed1492665177c68d973ae51a3eee65e291971666c49c990be`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
