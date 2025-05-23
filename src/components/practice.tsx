import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import WebSearch from "./webSearch";

const Practice: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [show, setShow] = useState(false);
  const [content, setContent] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchInWeb = () => {
    setSearchQuery(topic);
  };

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const generateContent = async () => {
    if (!topic) return alert("Please enter a topic");
    setLoading(true);
    setContent([]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `As an experienced prompt engineer, generate a JSON array containing 5 technical interview questions along with short answers based on ${topic}. Each object in the array should have the fields "question" and "answer", formatted as follows:

        [
          { "question": "<Question text>", "answer": "<Answer text>" },
          ...
        ]
      `;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const cleanedResponse = response.text().replace(/```json|```/g, "").trim();

      try {
        const jsonData = JSON.parse(cleanedResponse);
        console.log(jsonData);
        const questionsArray = jsonData.map((item: { question: string }) => item.question);
        const answerArray = jsonData.map((item: { answer: string }) => item.answer);
        setAnswers(answerArray);
        setContent(questionsArray);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        setContent(["Rate Limit Error"]);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Failed to generate content. Try again later.");
    }

    setLoading(false);
  };



  return (
    <div className="pt-4 w-[75vw] mx-auto">
      <h2 className="text-xl font-bold mb-4">Learn with AI</h2>
      <input
        type="text"
        className="border p-2 w-full mb-4"
        placeholder="Enter a topic to practice"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      {searchQuery && <WebSearch topic={searchQuery} />}
      <div className="flex gap-3">
        <button
          onClick={searchInWeb}

          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Search in Web
        </button>


        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={generateContent}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate AI Questions"}
        </button>


      </div>

      {content.length > 0 && (
        <div className="mt-4 p-2 border rounded">
          <h3 className="font-semibold">AI Generated Questions:</h3>
          {content.map((question, index) => (
            <div key={index} className="p-2 flex justify-between border-b last:border-none">
              {index + 1}. {question}
            </div>
          ))}

          <button
            className="bg-blue-500 mt-5 text-white px-4 py-2 rounded"
            onClick={() => setShow(!show)}
          >
            {show ? "Hide Answers" : "Show Answers"}
          </button>
        </div>
      )}

      {show && answers.length > 0 && (
        <div className="mt-4 p-2 border rounded">
          <h3 className="font-semibold">Answers:</h3>
          {answers.map((answer, index) => (
            <div key={index} className="p-2 border-b last:border-none">
              {index + 1}. {answer}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Practice;
