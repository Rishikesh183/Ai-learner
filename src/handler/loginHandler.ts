import axios from "axios";

interface LoginParams {
  email: string;
  password: string;
}

const LoginHandler = async ({ email, password }: LoginParams) => {
  try {
    const response = await axios.post("https://ai-learner-backend.onrender.com/api/auth/login", {
      email,
      password,
    });

    const { user, token } = response.data;
    console.log(response.data);
    return { user, token };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || "Login failed");
  }
};

export default LoginHandler;
