import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Trash, Check, Save } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { db } from "@/config/firebase.config";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";

const Notes = () => {
    const { user } = useUser();
    const [note, setNote] = useState("");
    const [notesList, setNotesList] = useState<{ id: string; text: string; isCompleted: boolean }[]>([]);

    useEffect(() => {
        if (user) {
            fetchNotes();
        }
    }, [user]);

    const fetchNotes = async () => {
        if (!user) return;
        const q = query(collection(db, "notes"), where("userId", "==", user.id));
        const querySnapshot = await getDocs(q);
        const notes = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as { id: string; text: string; isCompleted: boolean }[];
        setNotesList(notes);
    };

    const onAddNoteClick = async () => {
        if (note.trim() !== "" && user) {
            const docRef = await addDoc(collection(db, "notes"), {
                userId: user.id,
                text: note,
                isCompleted: false,
            });
            setNotesList([...notesList, { id: docRef.id, text: note, isCompleted: false }]);
            setNote("");
        }
    };

    const onNoteDelete = async (id: string) => {
        await deleteDoc(doc(db, "notes", id));
        setNotesList(notesList.filter((note) => note.id !== id));
    };

    const onNoteCheck = async (id: string, isCompleted: boolean) => {
        await updateDoc(doc(db, "notes", id), { isCompleted: !isCompleted });
        setNotesList(notesList.map((note) => note.id === id ? { ...note, isCompleted: !isCompleted } : note));
    };

    return (
        <div className="p-4">
            <div className="flex justify-between pb-6">
                <h1 className="font-bold text-2xl mb-4">Save Your Notes Here</h1>
                <Button onClick={onAddNoteClick}><Save />save Note</Button>
            </div>
            <div className="flex space-x-2 mb-4 ">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="border rounded border-black w-[90vw] h-[45vh] p-2 "
                    placeholder="save your notes...">
                </textarea>
            </div>

            <ul className="space-y-2">
                {notesList.map((note) => (
                    <li key={note.id} className={`flex justify-between items-center p-2 border rounded ${note.isCompleted ? "line-through text-gray-500" : ""}`}>
                        <span>{note.text}</span>
                        <div className="flex space-x-2">
                            <Button onClick={() => onNoteCheck(note.id, note.isCompleted)} variant="outline"><Check /></Button>
                            <Button onClick={() => onNoteDelete(note.id)} variant="destructive"><Trash /></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notes;
