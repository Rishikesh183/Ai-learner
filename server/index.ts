import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

interface GenerateRequestBody {
  topic: string;
}

// ✅ Correctly define the route
app.post(
    "/generate",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { topic } = req.body;
        if (!topic) {
          res.status(400).json({ error: "Topic is required" });
          return;
        }
  
        const response = await axios.post(
            "https://api.deepseek.com/generate", // 🔹 Check if this is correct!
            {
              prompt: "Your prompt here",
              max_tokens: 100
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer sk-cb36387cf02e4242a7d49ad77610bde5` // 🔹 Check API key
              }
            }
          );
          
  
        res.json({ text: response.data.text });
      } catch (error) {
        console.error("DeepSeek API Error:", error);
        res.status(500).json({ error: "Failed to generate study material" });
      }
    }
  );
  

// ✅ Ensure you're correctly starting the server
app.get("/", (req, res) => {
    res.send("Server is running...");
  });
  
  app.listen(PORT, () => console.log("Server running on port 5000"));

//   console.log("DeepSeek API Key:", process.env.DEEPSEEK_API_KEY);