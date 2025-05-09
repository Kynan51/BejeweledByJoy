import { useState } from "react";
import supabase from "../utils/supabaseClient";

export default function TestSupabase() {
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const testLogin = async () => {
    console.log("Testing Supabase login...");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("Test login result:", { data, error });
      setResult({ data, error });
    } catch (err) {
      console.error("Test login error:", err);
      setResult({ error: err.message });
    }
  };

  return (
    <div style={{ padding: 32 }}>
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
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
