import LoginHandler from "@/handler/loginHandler";
import { SetStateAction, useState } from "react";
import { useAuth } from "../authContext"; // Assuming you have this context
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setemail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth(); 
    const navigate = useNavigate();

    const handleEmailChange = (e: { target: { value: SetStateAction<string> } }) => {
        setemail(e.target.value);
    };

    const handlePasswordChange = (e: { target: { value: SetStateAction<string> } }) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const { user, token } = await LoginHandler({ email, password });
            login(user, token); // ⬅️ Store in context
            console.log("Login successful");
            navigate("/")
        } catch (error) {
            console.error("Login failed", error);
            alert("Invalid email or password. Try again.");
        }

    };

    return (
        <div className="min-h-[52vh] mt-10 flex flex-col">
            <h1 className="text-center font-bold text-xl capitalize">
                Hi User, Please Enter Your Details To Resume Your Journey
            </h1>
            <div className="w-[22vw] m-auto shadow p-4 shadow-gray-400 rounded-lg mb-24">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block font-medium mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={email}
                            type="email"
                            placeholder="Enter email"
                            className="w-full border border-gray-300 rounded-md p-2"
                            required
                            onChange={handleEmailChange}
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={password}
                            type="password"
                            placeholder="Enter password"
                            className="w-full border border-gray-300 rounded-md p-2"
                            required
                            onChange={handlePasswordChange}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full bg-orange-600 text-white p-2 rounded-md hover:bg-orange-700"
                        >
                            Login
                        </button>
                    </div>
                </form>
                <div className="capitalize font-semibold p-1">
                    already a member ? <span className="text-green-700">
                        <Link to={"/register"}>Register</Link>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Login;
