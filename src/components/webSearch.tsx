/* eslint-disable @typescript-eslint/no-explicit-any */
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const WebSearch = ({ topic }: { topic: string }) => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("")

  useEffect(() => {
    if (!topic) return;

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/search?query=${topic}`);
        const data = await response.json();
        console.log(data);

        const extracted = data.results?.flatMap((item: any) => {
          if (!item.raw_content) return [];
          return item.raw_content
            .split("\n")
            .map((line: string) => line.trim())
            .filter((line: string) => line.endsWith("?") && line.length < 200);
        }) || [];
        const Source = data.results?.map((item: any) => item.url || "No Source Found") || [];
        setSource(Source)
        setQuestions(extracted);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setQuestions(["Failed to fetch interview questions. Try again later."]);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [topic]);

  const copyToClipboard = () => {
    const textToCopy = questions.join("\n");
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success("Copied all questions to clipboard!")
    })
  };


  return (
    <>
      <div className="mt-4 p-2 border rounded">
        <h3 className="font-semibold"> "{topic}"</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {questions.map((q, index) => (
              <li key={index} className="p-1 border-b last:border-none">
                {q}
              </li>
            ))}
            {
              <div className="flex justify-between items-center gap-2 p-3 border-b last:border-none text-sm text-gray-600">
              <div>
                Source of the above questions:&nbsp;
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  source
                </a>
              </div>
              <div className="flex bg-green-500 gap-1 font-semibold px-2 py-2 rounded-lg cursor-pointer">
                <button onClick={copyToClipboard}>
                  <Copy color="white" size={18}/>
                </button>
                <span className="text-white">copy</span>
              </div>
            </div>
            }
          </ul>
        )}
      </div>  
    </>
  );
};

export default WebSearch;




