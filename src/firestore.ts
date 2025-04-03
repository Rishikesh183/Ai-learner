import { db } from './config/firebase.config'; 
import { collection, addDoc, Timestamp, getDocs, query, orderBy, where } from "firebase/firestore";

// Function to save metadata in Firestore
export const savePDFMetadata = async (title: string, pdfUrl: string, userId: string) => {
  if (!userId) {
    console.error("User not logged in!");
    throw new Error("User must be logged in to save PDFs.");
  }

  try {
    console.log("Saving PDF metadata...", { title, pdfUrl, userId }); // Log before adding

    const docRef = await addDoc(collection(db, "generated_pdfs"), {
      title,
      pdfUrl,
      userId,
      createdAt: Timestamp.now(),
    });

    console.log("✅ PDF metadata saved! Document ID:", docRef.id); // Log success
    return docRef.id;
  } catch (error) {
    console.error("❌ Error saving PDF metadata:", error); // Log failure
    throw error;
  }
};


// Function to fetch PDFs for the logged-in user
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchPDFs = async (userId:any) => {
  if (!userId) {
    console.error("User not logged in!");
    throw new Error("User must be logged in to fetch PDFs.");
  }

  try {
    const q = query(
      collection(db, "generated_pdfs"),
      where("userId", "==", userId),  // Fetch only the logged-in user's PDFs
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as { id: string; title: string; pdfUrl: string }[];
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    throw error;
  }
};
