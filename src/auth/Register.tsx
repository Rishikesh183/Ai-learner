import { SetStateAction, useState } from "react"
import signupHandler from "../handler/signupHandler"
import { Link,useNavigate } from "react-router-dom"
const Register = () => {
    const [username, setusername] = useState('')
    const [number, setnumber] = useState('')
    const [email, setemail] = useState('')
    const [Password, setPassword] = useState('')
    const navigate = useNavigate();

    const handleNumberChange = (e: { target: { value: SetStateAction<string> } }) => {
        setnumber(e.target.value)
    }
    const handleNameChange = (e: { target: { value: SetStateAction<string> } }) => {
        setusername(e.target.value)
    }
    const handleEmailChange = (e: { target: { value: SetStateAction<string> } }) => {
        setemail(e.target.value)
    }
    const handlePasswordChange = (e: { target: { value: SetStateAction<string> } }) => {
        setPassword(e.target.value)
    }

    const handleSubmit = () => {
        signupHandler({ username, number, email, Password })
        navigate("/login")
    }

    return (
        <>
            <div className="w-[33vw] m-auto mt-12 shadow p-4 shadow-gray-400 rounded-lg mb-24">
                <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block font-medium mb-1">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={number}
                            type="number"
                            placeholder="Enter mobile number"
                            className="w-full border border-gray-300 rounded-md p-2"
                            maxLength={10}
                            required
                            onChange={handleNumberChange}
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={username}
                            type="text"
                            placeholder="Enter name"
                            className="w-full border border-gray-300 rounded-md p-2"
                            required
                            onChange={handleNameChange}
                        />
                    </div>

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
                            value={Password}
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
                            Register
                        </button>
                    </div>
                </form>
                <div className="capitalize font-semibold p-1">
                    already a member ? <span className="text-green-700">
                        <Link to={"/login"}>Login</Link>
                    </span>
                </div>
            </div>
        </>
    )
}

export default Register