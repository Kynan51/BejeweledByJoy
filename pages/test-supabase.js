import { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";

export default function TestSupabase() {
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = "https://izorbgujgfqtugtewxap.supabase.co/rest/v1/products?select=*";
    const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
