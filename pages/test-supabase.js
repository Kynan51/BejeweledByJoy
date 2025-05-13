import { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";

export default function TestSupabase() {
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = "https://izorbgujgfqtugtewxap.supabase.co/rest/v1/products?select=*";
    const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
    fetch(url, {
      headers: {
        "apikey": apikey,
        "Authorization": `Bearer ${apikey}`,
        "Accept": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch((err) => setError(err.toString()));
  }, []);

  const testLogin = async () => {
    // console.log("Testing Supabase login...");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // console.log("Test login result:", { data, error });
      setResult({ data, error });
    } catch (err) {
      console.error("Test login error:", err);
      setResult({ error: err.message });
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Test Supabase REST API</h1>
      {error && <pre style={{ color: "red" }}>{error}</pre>}
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <h2>Test Supabase Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 8 }}
      />
      <button onClick={testLogin}>Test Supabase Login</button>
    </div>
  );
}
