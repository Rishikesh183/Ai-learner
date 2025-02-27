import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const Learn: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const generateContent = async () => {
    if (!topic) return alert("Please enter a topic");
    setLoading(true);
    setContent("");
    try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(`Generate study material on: ${topic}`);
      const response = result.response;
      setContent(response.text());
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Failed to generate content. Try again later.");
    }
    setLoading(false);
  };
//   console.log("Gemini API Key:", "AIzaSyDTJuebx9IsNX-_aXBXoMA7nmUCFWbvSZ8");


  return (
    
    <div className="p-4 max-w-xl mx-auto">
        
      <h2 className="text-xl font-bold mb-4">Learn with AI</h2>
      <input
        type="text"
        className="border p-2 w-full mb-4"
        placeholder="Enter topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={generateContent}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Study Material"}
      </button>
      {content && (
        <div className="mt-4 p-2 border rounded">
          <h3 className="font-semibold">Generated Content:</h3>
          <p>{content}</p>
        </div>
      )}
    </div>
  );
};

export default Learn;
