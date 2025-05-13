import { useEffect, useState } from "react";
import { useRouter as useAppRouter } from "next/navigation";
import { useRouter as usePagesRouter } from "next/router";
import { Progress } from "../components/ui/progress";

function getRouter() {
  // Try /app router first (if in /app directory)
  try {
    return useAppRouter();
  } catch {
    // fallback to /pages router
    return usePagesRouter();
  }
}

export default function RouteProgressBar() {
  const router = getRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  let timeout = null;

  useEffect(() => {
    if (!router?.events) return;
    const handleStart = () => {
      setVisible(true);
      setProgress(10);
      clearTimeout(timeout);
      timeout = setTimeout(() => setProgress(60), 200);
    };
    const handleComplete = () => {
      setProgress(100);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    };
    router.events.on && router.events.on("routeChangeStart", handleStart);
    router.events.on && router.events.on("routeChangeComplete", handleComplete);
    router.events.on && router.events.on("routeChangeError", handleComplete);
    return () => {
      router.events.off && router.events.off("routeChangeStart", handleStart);
      router.events.off && router.events.off("routeChangeComplete", handleComplete);
      router.events.off && router.events.off("routeChangeError", handleComplete);
      clearTimeout(timeout);
    };
  }, [router]);

  if (!visible) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", zIndex: 99999, pointerEvents: "none" }}>
      <div className="w-full">
        <Progress value={progress} className="h-1 bg-purple-600" />
      </div>
    </div>
  );
}
