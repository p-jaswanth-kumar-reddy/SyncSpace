import { useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);

  const sendResetCode = async () => {
    const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) setStep(2);
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const res = await fetch("http://localhost:5000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) window.location.href = "/";
  };

  const handleResend = async () => {
    const res = await fetch("http://localhost:5000/api/auth/resend-reset-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("New reset code sent!");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 from-indigo-600 to-purple-700">
      <div className="bg-white p-8 rounded-xl shadow-xl w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Reset Password
        </h2>

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={sendResetCode}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Send Reset Code
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="6-digit code"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <input
              type="password"
              placeholder="New password"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm password"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              onClick={resetPassword}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Reset Password
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="mt-3 w-full bg-gray-600 text-white p-2 rounded"
            >
              Resend Code
            </button>
          </>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          <a href="/" className="text-indigo-600 hover:underline">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;