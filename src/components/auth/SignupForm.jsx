import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const SignupForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email && password && username) {
        login({ email, username });
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500 text-white p-2 rounded-md">{error}</div>
      )}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 h-4 w-4 text-gray-400">👤</span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="pl-10 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 h-4 w-4 text-gray-400">📧</span>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 h-4 w-4 text-gray-400">🔒</span>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 h-4 w-4 text-gray-400">🔒</span>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none"
        disabled={isLoading}
      >
        {isLoading ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
};

export default SignupForm;
