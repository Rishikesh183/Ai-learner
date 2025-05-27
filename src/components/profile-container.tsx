import { useAuth } from "../authContext";
// import { Loader } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export const ProfileContainer = () => {
  const { isSignedIn, user, logout } = useAuth();

  const navigate = useNavigate();
  const navigateToSignUP = () => {
    navigate("/register")
  }

  // if (!user) {
  //   return <Loader className="animate-spin text-emerald-500" />;
  // }

  // if(!isSignedIn){
  //   navigate("/register")
  // }
  

  return (
    <div className="flex items-center gap-6">
      {isSignedIn ? (
        <div className="flex items-center gap-5">
          <span className="font-semibold">Hi {user?.username}</span>
          <Button size="sm" className="bg-red-500" onClick={logout}>
            Logout
          </Button>
        </div>
      ) : (
          <Button size="sm" onClick={navigateToSignUP}>Get Started</Button>
      )}
    </div>
  );
};
