import { db } from "@/config/firebase.config";
import { LoaderPage } from "@/routes/loader-page";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext"; // Adjust path if needed

const AuthHandler = () => {
  const { user, isSignedIn } = useAuth();
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storeUserData = async () => {
      if (isSignedIn && user) {
        setLoading(true);
        try {
          const userSnap = await getDoc(doc(db, "users", user.id));
          if (!userSnap.exists()) {
            const userData = {
              id: user.id,
              name: user.username || "Anonymous",
              email: user.email,
              imageUrl: "", // No image from custom auth; set empty or default
              createdAt: serverTimestamp(),
              updateAt: serverTimestamp(),
            };
            await setDoc(doc(db, "users", user.id), userData);
          }
        } catch (error) {
          console.log("Error storing the user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    storeUserData();
  }, [isSignedIn, user, pathname, navigate]);

  if (loading) {
    return <LoaderPage />;
  }

  return null;
};

export default AuthHandler;
