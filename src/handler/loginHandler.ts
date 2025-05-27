import axios from "axios";

interface LoginParams {
  email: string;
  password: string;
}

const LoginHandler = async ({ email, password }: LoginParams) => {
  try {
    const response = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });

    const { user, token } = response.data;
    console.log(response.data);
    return { user, token };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export default LoginHandler;
