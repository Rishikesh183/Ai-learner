import axios from "axios";

interface SignupParams {
  username: string;
  number: string;
  email: string;
  Password: string;
}

const signupHandler = async ({ username, number, email, Password }: SignupParams): Promise<void> => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/auth/register",
      {
        username,
        number,
        email,
        Password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.log("Error while posting data into the database", error);
  }
};

export default signupHandler;
