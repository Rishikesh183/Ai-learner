import express, { json } from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(json());

app.get("/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    const response = await axios.post(
      "https://api.tavily.com/search",
      {
        query,
        topic: "general",
        search_depth: "basic",
        chunks_per_source: 3,
        max_results: 1,
        days: 7,
        include_answer: true,
        include_raw_content: true,
      },
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Tavily API error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch data from Tavily" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
