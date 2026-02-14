import { useState } from "react";

function Verify() {
  const [code, setCode] = useState("");
  const email = localStorage.getItem("verifyEmail");

  const handleVerify = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Email verified successfully!");
      localStorage.removeItem("verifyEmail");
      window.location.href = "/";
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleVerify} className="space-y-4 w-80">
        <h2 className="text-xl font-bold">Verify Email</h2>

        <input
          type="text"
          placeholder="Enter 6-digit code"
          className="border p-2 w-full"
          onChange={(e) => setCode(e.target.value)}
        />

        <button className="bg-green-600 text-white p-2 w-full">
          Verify
        </button>
      </form>
    </div>
  );
}

export default Verify;