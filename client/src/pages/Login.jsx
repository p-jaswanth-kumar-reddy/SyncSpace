import { useState } from "react";
import axios from "axios";

function Login() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            const res = await axios.post(
                "http://localhost:5000/api/auth/login",
                form
            );

            localStorage.setItem("token", res.data.token);
            alert("Login successful");
            window.location.href = "/chat";
        } catch (err) {
            alert("Login failed");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Login</h2>
            <input name="email" placeholder="Email" onChange={handleChange} />
            <br />
            <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
            />
            <br />
            <button onClick={handleSubmit}>Login</button>
            <p>
                Don't have an account?{" "}
                <a href="/register">Register</a>
            </p>
        </div>
    );
}

export default Login;