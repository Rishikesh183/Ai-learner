/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from "jspdf";
import { useAuth } from "../authContext";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase.config"; // Firestore DB import
import PDFViewer from "./pdfViewer";

// Add Difficulty type
type Difficulty = "beginner" | "intermediate" | "advanced";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const Learn = () => {
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("Search to Generate...");
    const [loading, setLoading] = useState(false);
    const [pdfs, setPdfs] = useState<{ id: string; title: string; pdfUrl: string; pdfData: string; }[]>([]);
    const [suggestedContent, setSuggestedContent] = useState<{ id: string; title: string; }[]>([]);
    const [aiSuggestion, setAiSuggestion] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
    const [contentType, setContentType] = useState("comprehensive");
    const [customPrompt, setCustomPrompt] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            loadPDFs();
            loadTitle();
        }
    }, [user?.id]);

    const suggestNextTopic = async () => {
        if (suggestedContent.length === 0) {
            if (!topic) return;

            const prompt = `You are an AI assistant that only returns structured topic suggestions.

            Given the topic: "${topic}", suggest exactly 3 related topics that would be good to learn next.

            ⚠️ Important Rules:
            - Return ONLY the following format with no extra explanation or commentary.
            - Do NOT include any greetings, introductions, summaries, or additional text.

            Strict Format:
            Topic 1 : [suggested topic 1]
            Topic 2 : [suggested topic 2]
            Topic 3 : [suggested topic 3]

            Now return your response in the strict format above.`;

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                const result = await model.generateContent(prompt);
                const response = await result.response.text();
                const cleanedResponse = response.replace(/```json|```/g, "").trim();
                const topicList = cleanedResponse
                    .split('\n')
                    .map(line => line.split(':')[1]?.trim())
                    .filter(Boolean);
                setAiSuggestion(topicList);
            } catch (error) {
                console.error("Error generating suggestions:", error);
            }
            return;
        }
        const titles = suggestedContent.map(pdf => pdf.title).join(", ");
        const prompt = `Here are some study materials the user has created: ${titles}. Based on this learning pattern, suggest 2-3 logical next topics they should explore. 
        ⚠️ Important Rules:
            - Return ONLY the following format with no extra explanation or commentary.
            - Do NOT include any greetings, introductions, summaries, or additional text.

            Strict Format:
            Topic 1 : [suggested topic 1]
            Topic 2 : [suggested topic 2]
            Topic 3 : [suggested topic 3]

            Now return your response in the strict format above.`;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const result = await model.generateContent(prompt);
            const response = await result.response.text();

            const cleanedResponse = response.replace(/```json|```/g, "").trim();
            const topicList = cleanedResponse
                .split('\n')
                .map(line => line.split(':')[1]?.trim())
                .filter(Boolean);
            setAiSuggestion(topicList);
        } catch (error) {
            console.error("Error generating suggestions:", error);
        }
    };

    console.log(aiSuggestion);

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

    const generateAdvancedPrompt = () => {
        const basePrompt = `Create a comprehensive ${difficulty}-level study guide for: ${topic}`;

        let structurePrompt = "";
        switch (contentType) {
            case "comprehensive":
                structurePrompt = `
                Structure the content as follows:
                1. **Overview & Introduction** - Brief explanation and importance
                2. **Core Concepts** - Main ideas with clear definitions
                3. **Detailed Explanations** - In-depth coverage with examples
                4. **Key Formulas/Principles** (if applicable)
                5. **Practical Applications** - Real-world examples and use cases
                6. **Common Misconceptions** - What people often get wrong
                7. **Practice Questions** - 5-10 questions with brief answers
                8. **Further Reading** - Suggested resources and next steps
                9. **Summary & Key Takeaways** - Quick review points
                10. **Learning Roadmap** - Step-by-step mastery plan`;
                break;
            case "quick-reference":
                structurePrompt = `
                Create a concise quick-reference guide with:
                - Key definitions and terminology
                - Essential formulas or principles
                - Quick facts and important points
                - Handy tips and shortcuts
                - Common pitfalls to avoid`;
                break;
            case "tutorial":
                structurePrompt = `
                Create a step-by-step tutorial format:
                - Prerequisites and requirements
                - Step-by-step instructions
                - Code examples or practical demonstrations
                - Troubleshooting common issues
                - Best practices and tips`;
                break;
            case "exam-prep":
                structurePrompt = `
                Focus on exam preparation with:
                - Key topics likely to be tested
                - Important formulas and concepts
                - Sample questions and answers
                - Memory techniques and mnemonics
                - Last-minute review checklist`;
                break;
        }

        const difficultyInstructions: Record<Difficulty, string> = {
            beginner: "Use simple language, provide basic examples, and explain fundamental concepts clearly. Assume no prior knowledge.",
            intermediate: "Include moderate complexity, practical examples, and some advanced concepts. Assume basic familiarity with the subject.",
            advanced: "Use technical language, complex examples, and dive deep into nuanced aspects. Assume strong foundational knowledge."
        };

        const formatInstructions = `
        Formatting Requirements:
        - Use **bold** for all headings and important terms
        - Use bullet points for lists and key points
        - Include relevant examples in *italics*
        - Add numbered steps where appropriate
        - Use clear section breaks with horizontal lines (---)
        - Keep paragraphs concise but informative
        `;

        return `${basePrompt}

${structurePrompt}

Difficulty Level: ${difficultyInstructions[difficulty]}

${formatInstructions}

Make the content engaging, practical, and easy to understand. Include real-world examples and analogies where helpful.`;
    };

    const generateContent = async () => {
        if (!topic) return;
        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const prompt = customPrompt || generateAdvancedPrompt();

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
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth() - 20;
        const pageHeight = doc.internal.pageSize.getHeight() - 20;
        let y = 20;

        // Enhanced PDF formatting
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Study Material: ${topic}`, 10, 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 15);
        doc.text(`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`, pageWidth - 40, 15);

        // Process content with better formatting
        const lines = content.split('\n');
        doc.setFontSize(11);

        for (let line of lines) {
            if (y > pageHeight - 10) {
                doc.addPage();
                y = 20;
            }

            // Handle bold headings
            if (line.includes('**')) {
                doc.setFont("helvetica", "bold");
                line = line.replace(/\*\*/g, '');
            } else {
                doc.setFont("helvetica", "normal");
            }

            const wrappedLines = doc.splitTextToSize(line, pageWidth);
            doc.text(wrappedLines, 10, y);
            y += wrappedLines.length * 5;
        }

        doc.save(`${topic}_study_guide.pdf`);
    };

    const savePDF = async () => {
        if (!user?.id) {
            console.error("User must be logged in to save PDFs.");
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth() - 20;
        const pageHeight = doc.internal.pageSize.getHeight() - 20;
        let y = 20;

        // Enhanced PDF formatting (same as generatePDF)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Study Material: ${topic}`, 10, 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 15);
        doc.text(`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`, pageWidth - 40, 15);

        const lines = content.split('\n');
        doc.setFontSize(11);

        for (let line of lines) {
            if (y > pageHeight - 10) {
                doc.addPage();
                y = 20;
            }

            if (line.includes('**')) {
                doc.setFont("helvetica", "bold");
                line = line.replace(/\*\*/g, '');
            } else {
                doc.setFont("helvetica", "normal");
            }

            const wrappedLines = doc.splitTextToSize(line, pageWidth);
            doc.text(wrappedLines, 10, y);
            y += wrappedLines.length * 5;
        }

        const pdfBlob = doc.output("blob");

        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = async () => {
            const pdfBase64 = reader.result as string;

            try {
                await addDoc(collection(db, "pdfs"), {
                    title: `${topic} (${difficulty} - ${contentType})`,
                    pdfUrl: pdfBase64,
                    userId: user.id,
                    timestamp: new Date(),
                    pdfData: content,
                    difficulty: difficulty,
                    contentType: contentType,
                });

                console.log("✅ PDF saved to Firestore!");
                loadPDFs();
            } catch (error) {
                console.error("❌ Error saving PDF to Firestore:", error);
            }
        };
    };


    const handleQuickSelect = (suggestion: any) => {
        setTopic(suggestion.trim());
        setAiSuggestion([]);
    };


    return (
        <>
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center">AI-Powered Learning Hub</h1>

                {/* Main Input and Controls */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="space-y-4">
                        {/* Topic Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Topic to Learn:</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={aiSuggestion ? `Try: ${aiSuggestion[0]}` : "Enter any topic (e.g., Machine Learning, Photosynthesis, JavaScript...)"}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Quick Options Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Difficulty Level:</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="beginner">Beginner - Start from basics</option>
                                    <option value="intermediate">Intermediate - Some background knowledge</option>
                                    <option value="advanced">Advanced - Deep technical coverage</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Content Type:</label>
                                <select
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="comprehensive">Comprehensive Guide</option>
                                    <option value="quick-reference">Quick Reference</option>
                                    <option value="tutorial">Step-by-Step Tutorial</option>
                                    <option value="exam-prep">Exam Preparation</option>
                                </select>
                            </div>
                        </div>

                        {/* Advanced Options Toggle */}
                        <div>
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                {showAdvanced ? "Hide" : "Show"} Advanced Options
                            </button>
                        </div>

                        {/* Advanced Custom Prompt */}
                        {showAdvanced && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Custom Prompt (Optional):</label>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Override the default prompt with your own specific instructions..."
                                    className="w-full p-3 border rounded-lg h-24 resize-vertical"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty to use the enhanced auto-generated prompt</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={generateContent}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1 min-w-[120px]"
                                disabled={loading || !topic}
                            >
                                {loading ? "Generating..." : "🚀 Generate Study Material"}
                            </button>

                            <button
                                onClick={suggestNextTopic}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                disabled={loading}
                            >
                                💡 Get Suggestions
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Suggestions Display */}
                {aiSuggestion && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-purple-800 mb-2">💡 Suggested Topics:</h3>
                        <div className="flex flex-wrap gap-2">
                            {aiSuggestion.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleQuickSelect(suggestion)}
                                    className="bg-white hover:bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200 transition-colors"
                                >
                                    {suggestion.trim()}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Display */}
                {content && content !== "Search to Generate..." && (
                    <PDFViewer content={content} generatePDF={generatePDF} savePDF={savePDF} />
                )}
            </div>

            {/* Previously Generated PDFs */}
            <div className="mt-8 flex flex-col items-center pb-6 p-2">
                <h2 className="text-2xl font-semibold mb-4">📚 Your Study Library</h2>
                {pdfs.length === 0 ? (
                    <div className="text-center text-gray-500 bg-gray-50 rounded-lg p-8">
                        <p className="text-lg mb-2">No study materials yet!</p>
                        <p className="text-sm">Generate your first study guide above to get started.</p>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl space-y-4">
                        {pdfs.map((pdf) => (
                            <div key={pdf.id} className="border rounded-lg bg-gray-50 p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-lg">{pdf.title}</h3>
                                    {/* <span className="text-sm text-gray-500">
                                        {new Date(pdf.timestamp?.seconds * 1000).toLocaleDateString()}
                                    </span> */}
                                </div>
                                <PDFViewer content={pdf.pdfData} generatePDF={generatePDF} savePDF={savePDF} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Learn;