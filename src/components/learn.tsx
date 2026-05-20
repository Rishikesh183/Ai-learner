/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from "jspdf";
import { useAuth } from "../authContext";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase.config";
import PDFViewer from "./pdfViewer";
import { Eye, X, FileText, Sparkles, BookOpen, Zap } from "lucide-react";

type Difficulty = "beginner" | "intermediate" | "advanced";

interface SavedPdf {
    id: string;
    title: string;
    pdfUrl: string;
    pdfData: string;
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const CONTENT_TYPES = [
    { value: "comprehensive", label: "Comprehensive", icon: <BookOpen size={14} /> },
    { value: "quick-reference", label: "Quick Ref", icon: <Zap size={14} /> },
    { value: "tutorial", label: "Tutorial", icon: <Sparkles size={14} /> },
    { value: "exam-prep", label: "Exam Prep", icon: <FileText size={14} /> },
];

const Learn = () => {
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [pdfs, setPdfs] = useState<SavedPdf[]>([]);
    const [suggestedContent, setSuggestedContent] = useState<{ id: string; title: string }[]>([]);
    const [aiSuggestion, setAiSuggestion] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
    const [contentType, setContentType] = useState("comprehensive");
    const [customPrompt, setCustomPrompt] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<SavedPdf | null>(null);
    const [numPages, setNumPages] = useState(15);

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
Strict Format:
Topic 1 : [suggested topic 1]
Topic 2 : [suggested topic 2]
Topic 3 : [suggested topic 3]
Now return your response in the strict format above.`;
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const result = await model.generateContent(prompt);
                const response = result.response.text();
                const topicList = response.replace(/```json|```/g, "").trim()
                    .split('\n').map(line => line.split(':')[1]?.trim()).filter(Boolean);
                setAiSuggestion(topicList);
            } catch (error) {
                console.error("Error generating suggestions:", error);
            }
            return;
        }
        const titles = suggestedContent.map(pdf => pdf.title).join(", ");
        const prompt = `Here are some study materials the user has created: ${titles}. Suggest 2-3 logical next topics.
⚠️ Important Rules:
- Return ONLY the following format with no extra explanation.
Strict Format:
Topic 1 : [suggested topic 1]
Topic 2 : [suggested topic 2]
Topic 3 : [suggested topic 3]
Now return your response in the strict format above.`;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response.text();
            const topicList = response.replace(/```json|```/g, "").trim()
                .split('\n').map(line => line.split(':')[1]?.trim()).filter(Boolean);
            setAiSuggestion(topicList);
        } catch (error) {
            console.error("Error generating suggestions:", error);
        }
    };

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
            setSuggestedContent(querySnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title })));
        } catch (error) {
            console.error("Failed to fetch titles:", error);
        }
    };

    const generateAdvancedPrompt = () => {
        const difficultyMap: Record<Difficulty, string> = {
            beginner: "Assume zero prior knowledge. Define every term. Use analogies and simple language. Avoid jargon.",
            intermediate: "Assume basic familiarity. Skip trivial definitions. Include trade-offs, edge cases, and moderate-depth examples.",
            advanced: "Assume strong foundational knowledge. Use precise technical language. Cover nuances, internals, and non-obvious gotchas.",
        };

        const structureMap: Record<string, string> = {
            comprehensive: `
## 1. Overview
- What is ${topic}? One clear definition.
- Why does it matter? Real-world relevance in 2-3 sentences.
- Where does it fit? (field, domain, ecosystem)

---

## 2. Prerequisites
- List what the learner must already know before studying this topic.

---

## 3. Core Concepts
For each major concept:
- **Concept name** — precise definition
- Key properties or rules
- A concrete example

---

## 4. How It Works (Internals / Mechanism)
- Step-by-step explanation of the underlying process or logic.
- Use numbered steps.
- Include diagrams described in text if helpful.

---

## 5. Key Formulas / Syntax / Rules
- Present each formula, rule, or syntax block clearly.
- Explain what each part means.

---

## 6. Worked Examples
- At least 2 fully worked examples from scratch.
- Show inputs, process, and output.

---

## 7. Common Mistakes & Misconceptions
- List the top 3–5 mistakes learners make.
- For each: what goes wrong and why, then the correct approach.

---

## 8. Comparisons & Trade-offs
- Compare with related concepts or alternatives.
- When to use this vs. something else.

---

## 9. Practice Problems
Q1. [Question — conceptual]
Q2. [Question — applied]
Q3. [Question — tricky/edge case]
Q4. [Question — real-world scenario]
Q5. [Question — synthesis / multi-step]

**Answers:**
A1. ...
A2. ...
A3. ...
A4. ...
A5. ...

---

## 10. Summary & Key Takeaways
- 5–8 bullet points capturing the most important ideas.
- One-line memory hook or mnemonic if applicable.

---

## 11. What to Learn Next
- 3 logical follow-up topics with one sentence on why each matters.`,

            "quick-reference": `
## Quick Reference: ${topic}

### Definition
One precise sentence.

---

### Key Terms
| Term | Meaning |
|------|---------|
| ... | ... |

---

### Core Rules / Formulas
- Rule 1: ...
- Rule 2: ...
- Formula: ...

---

### When to Use
- ✅ Use when: ...
- ❌ Avoid when: ...

---

### Common Pitfalls
1. ...
2. ...
3. ...

---

### Quick Examples
- Example 1: ...
- Example 2: ...

---

### Cheat Sheet
Compact summary of the most important facts in bullet form.`,

            tutorial: `
## Tutorial: ${topic}

### What You Will Build / Learn
Clear goal statement. What can the learner do after completing this?

---

### Prerequisites
- Item 1
- Item 2

---

### Setup / Environment
Any tools, installs, or configuration needed before starting.

---

### Step 1 — [Name]
**Goal:** What this step achieves.
**Instructions:** Numbered sub-steps.
**Expected output:** What success looks like.

---

### Step 2 — [Name]
(same structure)

---

### Step 3 — [Name]
(same structure)

Continue for all necessary steps.

---

### Common Errors & Fixes
| Error | Cause | Fix |
|-------|-------|-----|
| ... | ... | ... |

---

### Checkpoint: Test Your Understanding
3 questions to verify the learner followed correctly.

---

### Next Steps
What to build or explore after completing this tutorial.`,

            "exam-prep": `
## Exam Prep: ${topic}

### High-Priority Topics (likely tested)
1. ...
2. ...
3. ...

---

### Must-Know Definitions
- **Term 1** — definition
- **Term 2** — definition
- **Term 3** — definition

---

### Critical Formulas / Rules
Present each with a memory tip.

---

### Conceptual Questions & Model Answers
**Q:** ...
**A:** ...

(Repeat for 5–8 questions)

---

### Tricky / Trap Questions
Questions designed to test deep understanding, with explanations of why wrong answers are wrong.

---

### Quick-Fire Recall Practice
50 rapid-fire facts, terms, or formulas — one per line. Great for last-minute review.

---

### Memory Aids & Mnemonics
Acronyms, stories, or patterns that make key facts stick.

---

### 48-Hour Study Plan
- Day 1 (first 8 hours): Focus on sections X, Y
- Day 1 (next 4 hours): Practice problems
- Day 2 (morning): Review mistakes, tricky questions
- Day 2 (1 hour before exam): Quick-fire recall only`,
        };

        return `You are an expert educator and study-guide author. Generate a thorough, exam-ready study document on the topic below.

**Topic:** ${topic}
**Difficulty:** ${difficulty} — ${difficultyMap[difficulty]}
**Format:** ${contentType}

${structureMap[contentType]}

---

**Formatting rules (strictly follow):**
- Every section heading must use ## or ### markdown.
- Use **bold** for all key terms and critical facts.
- Use bullet points or numbered lists — never dense prose paragraphs.
- Separate every major section with --- (horizontal rule).
- For code or formulas use inline backticks or fenced code blocks.
- Be specific and concrete. No vague statements. Every claim needs an example or evidence.
- Do NOT include meta-commentary like "here is your guide" or "I hope this helps". Start directly with the content.`;
    };

    const generateContent = async () => {
        if (!topic) return;
        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(customPrompt || generateAdvancedPrompt());
            setContent(result.response.text());
        } catch (error) {
            console.error("Error generating content:", error);
            setContent("Failed to generate content. Please try again.");
        }
        setLoading(false);
    };

    const buildPdfDoc = (doc: jsPDF, contentText: string, pdfTitle: string, pdfDifficulty: string, maxPages: number) => {
        const pageWidth = doc.internal.pageSize.getWidth() - 20;
        const pageHeight = doc.internal.pageSize.getHeight() - 20;
        let y = 20;
        let pageCount = 1;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Study Material: ${pdfTitle}`, 10, 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 15);
        if (pdfDifficulty) doc.text(`Difficulty: ${pdfDifficulty}`, pageWidth - 40, 15);
        const lines = contentText.split('\n');
        doc.setFontSize(11);
        outer: for (let line of lines) {
            if (line.includes('**')) { doc.setFont("helvetica", "bold"); line = line.replace(/\*\*/g, ''); }
            else { doc.setFont("helvetica", "normal"); }
            const wrappedLines = doc.splitTextToSize(line.trim() || ' ', pageWidth);
            for (const wl of wrappedLines) {
                if (y > pageHeight - 10) {
                    if (pageCount >= maxPages) break outer;
                    doc.addPage();
                    pageCount++;
                    y = 20;
                }
                doc.text(wl, 10, y);
                y += 6;
            }
        }
    };

    const downloadPDF = async (pdfContent: string, pdfTitle: string, pdfDifficulty: string) => {
        const doc = new jsPDF();
        buildPdfDoc(doc, pdfContent, pdfTitle, pdfDifficulty, numPages);
        doc.save(`${pdfTitle.replace(/\s+/g, '_')}_study_guide.pdf`);
    };

    const generatePDF = async () => downloadPDF(content, topic, difficulty);

    const savePDF = async () => {
        if (!user?.id) return;
        const doc = new jsPDF();
        buildPdfDoc(doc, content, topic, difficulty, numPages);
        const pdfBlob = doc.output("blob");
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = async () => {
            try {
                await addDoc(collection(db, "pdfs"), {
                    title: `${topic} (${difficulty} - ${contentType})`,
                    pdfUrl: reader.result as string,
                    userId: user.id,
                    timestamp: new Date(),
                    pdfData: content,
                    difficulty,
                    contentType,
                });
                loadPDFs();
            } catch (error) {
                console.error("Error saving PDF:", error);
            }
        };
    };

    const handleQuickSelect = (suggestion: any) => {
        setTopic(suggestion.trim());
        setAiSuggestion([]);
    };

    const difficultyConfig = {
        beginner: { label: "Beginner", active: "bg-emerald-500 text-white shadow-emerald-200", inactive: "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700" },
        intermediate: { label: "Intermediate", active: "bg-amber-500 text-white shadow-amber-200", inactive: "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700" },
        advanced: { label: "Advanced", active: "bg-rose-500 text-white shadow-rose-200", inactive: "bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-700" },
    };

    return (
        <>
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white py-12 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Sparkles size={28} className="text-yellow-300" />
                        <h1 className="text-4xl font-bold tracking-tight">AI Learning Hub</h1>
                        <Sparkles size={28} className="text-yellow-300" />
                    </div>
                    <p className="text-indigo-200 text-lg">Generate personalized study materials on any topic, instantly.</p>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto -mt-6">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
                    {/* Topic Input */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">What do you want to learn?</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && generateContent()}
                                placeholder={aiSuggestion[0] ? `Try: ${aiSuggestion[0]}` : "e.g. Machine Learning, Photosynthesis, React Hooks..."}
                                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-indigo-400 transition-colors text-gray-800 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Difficulty Pills */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                        <div className="flex gap-2">
                            {(Object.keys(difficultyConfig) as Difficulty[]).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                                        difficulty === d ? difficultyConfig[d].active + " shadow-md" : difficultyConfig[d].inactive
                                    }`}
                                >
                                    {difficultyConfig[d].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Type Pills */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Content Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {CONTENT_TYPES.map(ct => (
                                <button
                                    key={ct.value}
                                    onClick={() => setContentType(ct.value)}
                                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                                        contentType === ct.value
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-gray-200 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50"
                                    }`}
                                >
                                    {ct.icon}
                                    {ct.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PDF Pages */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            PDF Pages: <span className="text-indigo-600 font-bold">{numPages}</span>
                        </label>
                        <input
                            type="range"
                            min={10}
                            max={30}
                            step={1}
                            value={numPages}
                            onChange={(e) => setNumPages(Number(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>10</span><span>20</span><span>30</span>
                        </div>
                    </div>

                    {/* Advanced Toggle */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors"
                        >
                            <span>{showAdvanced ? "▲" : "▼"}</span>
                            {showAdvanced ? "Hide" : "Show"} Custom Prompt
                        </button>
                        {showAdvanced && (
                            <div className="mt-3">
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Write your own instructions to override the auto-generated prompt..."
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl h-24 resize-vertical focus:border-indigo-400 focus:ring-0 transition-colors text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave empty to use the smart auto-generated prompt</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={generateContent}
                            disabled={loading || !topic}
                            className="flex-1 min-w-[160px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    Generating...
                                </span>
                            ) : "Generate Study Material"}
                        </button>
                        <button
                            onClick={suggestNextTopic}
                            disabled={loading}
                            className="px-5 py-3 rounded-xl font-semibold border-2 border-purple-300 text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-50"
                        >
                            💡 Suggest Topics
                        </button>
                    </div>
                </div>

                {/* AI Suggestions */}
                {aiSuggestion.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 mb-6">
                        <p className="text-sm font-semibold text-purple-800 mb-3">Suggested next topics:</p>
                        <div className="flex flex-wrap gap-2">
                            {aiSuggestion.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickSelect(suggestion)}
                                    className="bg-white hover:bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm border border-purple-200 transition-colors shadow-sm"
                                >
                                    {suggestion.trim()}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Generated Content Viewer */}
                {content && (
                    <PDFViewer content={content} generatePDF={generatePDF} savePDF={savePDF} />
                )}
            </div>

            {/* Study Library */}
            <div className="max-w-4xl mx-auto px-6 pb-12">
                <div className="flex items-center gap-3 mb-5">
                    <BookOpen size={22} className="text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Your Study Library</h2>
                    {pdfs.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">{pdfs.length}</span>
                    )}
                </div>

                {pdfs.length === 0 ? (
                    <div className="text-center text-gray-400 bg-gray-50 rounded-2xl p-12 border-2 border-dashed border-gray-200">
                        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium mb-1">No study materials yet</p>
                        <p className="text-sm">Generate your first study guide above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pdfs.map(pdf => (
                            <div
                                key={pdf.id}
                                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-50 p-2.5 rounded-xl shrink-0">
                                        <FileText size={20} className="text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{pdf.title}</h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPdf(pdf)}
                                        className="shrink-0 p-2 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="View content"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedPdf && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setSelectedPdf(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                            <h3 className="font-bold text-gray-800 text-lg pr-4 line-clamp-1">{selectedPdf.title}</h3>
                            <button
                                onClick={() => setSelectedPdf(null)}
                                className="shrink-0 p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <PDFViewer
                                content={selectedPdf.pdfData}
                                generatePDF={() => downloadPDF(selectedPdf.pdfData, selectedPdf.title, '')}
                                savePDF={savePDF}
                                pdfUrl={selectedPdf.pdfUrl}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Learn;
