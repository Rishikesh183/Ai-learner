import { LoaderPage } from "@/routes/loader-page";
import { useAuth } from "../authContext"; // adjust path if needed
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading phase for token check from localStorage
    const timer = setTimeout(() => setIsLoaded(true), 200); // or faster if preferred
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return <LoaderPage />;
  }

  if (!isSignedIn) {
    return <Navigate to={"/register"} replace />;
  }

  return <>{children}</>;
};

export default ProtectRoutes;
