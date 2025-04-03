/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
  

const WebSearch = ({ topic }: { topic: string }) => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!topic) return;

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/search?query=${topic}`);

        // Extract questions from search results
        const searchResults = response.data.organic_results || [];
        const extractedQuestions = searchResults
          .map((result: any) => result.snippet)
          .slice(0, 10); // Limit to 10 questions

        setQuestions(extractedQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setQuestions(["Failed to fetch interview questions. Try again later."]);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [topic]);

  return (
    <div className="mt-4 p-2 border rounded">
      <h3 className="font-semibold">Top 10 Interview Questions for "{topic}"</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {questions.map((q, index) => (
            <li key={index} className="p-1 border-b last:border-none">
              {index + 1}. {q}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WebSearch;
