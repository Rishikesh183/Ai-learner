import { useState, useEffect } from "react";
import { Trash2, CheckCircle2, Circle, StickyNote, Plus } from "lucide-react";
import { useAuth } from "../authContext";
import { db } from "@/config/firebase.config";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";

const Notes = () => {
    const { user } = useAuth();
    const [note, setNote] = useState("");
    const [notesList, setNotesList] = useState<{ id: string; text: string; isCompleted: boolean }[]>([]);

    useEffect(() => {
        if (user) fetchNotes();
    }, [user]);

    const fetchNotes = async () => {
        if (!user) return;
        const q = query(collection(db, "notes"), where("userId", "==", user.id));
        const querySnapshot = await getDocs(q);
        setNotesList(querySnapshot.docs.map((d) => ({
            id: d.id, ...d.data(),
        })) as { id: string; text: string; isCompleted: boolean }[]);
    };

    const onAddNoteClick = async () => {
        if (!note.trim() || !user) return;
        const docRef = await addDoc(collection(db, "notes"), {
            userId: user.id,
            text: note.trim(),
            isCompleted: false,
        });
        setNotesList([...notesList, { id: docRef.id, text: note.trim(), isCompleted: false }]);
        setNote("");
    };

    const onNoteDelete = async (id: string) => {
        await deleteDoc(doc(db, "notes", id));
        setNotesList(notesList.filter((n) => n.id !== id));
    };

    const onNoteCheck = async (id: string, isCompleted: boolean) => {
        await updateDoc(doc(db, "notes", id), { isCompleted: !isCompleted });
        setNotesList(notesList.map((n) => n.id === id ? { ...n, isCompleted: !isCompleted } : n));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onAddNoteClick();
    };

    const completed = notesList.filter(n => n.isCompleted).length;
    const active = notesList.filter(n => !n.isCompleted);
    const done = notesList.filter(n => n.isCompleted);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-5">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-xl">
                            <StickyNote size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">My Notes</h1>
                            {notesList.length > 0 && (
                                <p className="text-xs text-gray-400">{completed}/{notesList.length} completed</p>
                            )}
                        </div>
                    </div>
                    {notesList.length > 0 && (
                        <div className="w-32 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${(completed / notesList.length) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
                {/* Input Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={4}
                        placeholder="Write a note... (Ctrl+Enter to save)"
                        className="w-full p-4 text-gray-700 placeholder-gray-300 resize-none focus:outline-none text-sm leading-relaxed"
                    />
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <span className="text-xs text-gray-300">{note.length} chars</span>
                        <button
                            onClick={onAddNoteClick}
                            disabled={!note.trim()}
                            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={15} />
                            Add Note
                        </button>
                    </div>
                </div>

                {/* Active Notes */}
                {active.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Active</p>
                        {active.map((n) => (
                            <div
                                key={n.id}
                                className="group bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3 hover:border-amber-200 transition-colors"
                            >
                                <button
                                    onClick={() => onNoteCheck(n.id, n.isCompleted)}
                                    className="mt-0.5 shrink-0 text-gray-300 hover:text-amber-500 transition-colors"
                                >
                                    <Circle size={18} />
                                </button>
                                <p className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{n.text}</p>
                                <button
                                    onClick={() => onNoteDelete(n.id)}
                                    className="shrink-0 text-gray-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all mt-0.5"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Completed Notes */}
                {done.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Completed</p>
                        {done.map((n) => (
                            <div
                                key={n.id}
                                className="group bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 hover:border-gray-200 transition-colors"
                            >
                                <button
                                    onClick={() => onNoteCheck(n.id, n.isCompleted)}
                                    className="mt-0.5 shrink-0 text-amber-400 hover:text-gray-300 transition-colors"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                                <p className="flex-1 text-sm text-gray-400 line-through leading-relaxed whitespace-pre-wrap break-words">{n.text}</p>
                                <button
                                    onClick={() => onNoteDelete(n.id)}
                                    className="shrink-0 text-gray-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all mt-0.5"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {notesList.length === 0 && (
                    <div className="text-center py-16 text-gray-300">
                        <StickyNote size={40} className="mx-auto mb-3" />
                        <p className="text-sm font-medium">No notes yet</p>
                        <p className="text-xs mt-1">Write something above to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notes;
