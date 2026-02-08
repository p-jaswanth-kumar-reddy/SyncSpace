import { useState } from "react";
import axios from "axios";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      alert("Registration successful");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Register</h2>
      <input name="name" placeholder="Name" onChange={handleChange} />
      <br />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <br />
      <input
        name="password"
        type="password"
        placeholder="Password"
        onChange={handleChange}
      />
      <br />
      <button onClick={handleSubmit}>Register</button>
    </div>
  );
}

export default Register;