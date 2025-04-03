/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from "jspdf";
import { useUser } from "@clerk/clerk-react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase.config"; // Firestore DB import
import PDFViewer from "./pdfViewer";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const Learn = () => {
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("Search to Generate...");
    const [loading, setLoading] = useState(false);
    const [pdfs, setPdfs] = useState<{ id: string; title: string; pdfUrl: string; pdfData: string; }[]>([]);
    const [suggestedContent, setSuggestedContent] = useState<{ id: string; title: string; }[]>([]);
    const [aiSuggestion, setAiSuggestion] = useState("")
    const { user } = useUser();
    useEffect(() => {
        if (user?.id) {
            loadPDFs();
            loadTitle();
        }
    }, [user?.id]);

    const loadPDFs = async () => {
        try {
            const q = query(collection(db, "pdfs"), where("userId", "==", user?.id));
            const querySnapshot = await getDocs(q);
            const pdfList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                pdfUrl: doc.data().pdfUrl,
                pdfData: doc.data().pdfData,
            }));
            setPdfs(pdfList);
        } catch (error) {
            console.error("Failed to fetch PDFs:", error);
        }
    };
    const loadTitle = async () => {
        try {
            const q = query(collection(db, "pdfs"), where("userId", "==", user?.id));
            const querySnapshot = await getDocs(q);
            const pdfTitle = querySnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
            }))
            setSuggestedContent(pdfTitle)
        } catch (error) {
            console.error("Failed to fetch PDFs:", error);
        }
    }

    const generateContent = async () => {
        if (!topic) return;
        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const prompt = `Generate a detailed study material for the topic: ${topic}. Ensure it's well-structured with headings and make headings with bold font, bullet points, and key explanations. Also, provide a roadmap for mastering this topic.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const generatedText = response.text();

            setContent(generatedText);
        } catch (error) {
            console.error("Error generating content:", error);
            setContent("Failed to generate content. Please try again.");
        }
        setLoading(false);
    };

    const generatePDF = async () => {
        if (!user?.id) {
            console.error("User must be logged in to generate PDFs.");
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth() - 20;
        const lines = doc.splitTextToSize(content, pageWidth);
        doc.setFont("times", "normal");
        doc.text(`Study Material: ${topic}`, 10, 10);
        doc.setFontSize(12);
        doc.text(lines, 10, 20);

        const pdfBlob = doc.output("blob");

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = async () => {
            const pdfBase64 = reader.result as string;

            try {
                // Store in Firestore
                await addDoc(collection(db, "pdfs"), {
                    title: topic,
                    pdfUrl: pdfBase64,
                    userId: user.id,
                    timestamp: new Date(),
                    pdfData: content,
                });

                console.log("✅ PDF saved to Firestore!");
                loadPDFs(); // Refresh PDF list
            } catch (error) {
                console.error("❌ Error saving PDF to Firestore:", error);
            }
        };
    };

    const suggestNextTopic = async () => {
        if (suggestedContent.length === 0) return;

        const titles = suggestedContent.map(pdf => pdf.title).join(", ");
        const prompt = `Here are some study materials: ${titles}. Based on this, suggest what topics the user might want to search for next. just give the answer in one word what user could search`;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const result = await model.generateContent(prompt);
            setAiSuggestion(result.response.text())
        } catch (error) {
            console.error("Error generating suggestions:", error);
        }
    };

    useEffect(() => {
        if (aiSuggestion) {
            // console.log("Updated AI Suggestions:", aiSuggestion);
        }
    }, [aiSuggestion]);

    return (
        <>
            <div className="p-6 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Learn a Topic</h1>

                {/* Input Field */}
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={aiSuggestion || "Enter a topic to search"} 
                    className="w-full p-2 border rounded mb-4"
                />
                <div className="flex justify-between">
                    <button
                        onClick={generateContent}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        disabled={loading }
                    >
                        {loading ? "Generating..." : "Generate"}
                    </button>
                    <button
                        onClick={suggestNextTopic}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        disabled={loading}
                    >
                        Suggest Content 
                    </button>
                </div>
                {aiSuggestion.length>0 && <div className="font-bold text-lg flex justify-center mt-4 text-red-600">Now You should learn {aiSuggestion} </div>}
                {content && <PDFViewer content={content} generatePDF={generatePDF} />}
            </div>
            <div className="mt-6 flex flex-col items-center pb-6 p-2">
                <h2 className="text-xl font-semibold mb-3 mt-3">Previously Generated PDFs</h2>
                {pdfs.length === 0 ? (
                    <p className="text-gray-500">No PDFs generated yet.</p>
                ) : (
                    <ul className="space-y-4">
                        {pdfs.map((pdf) => (
                            <div key={pdf.id} className="border p-2 rounded bg-gray-100">
                                {<PDFViewer content={pdf.pdfData} generatePDF={generatePDF} />}
                            </div>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default Learn;
