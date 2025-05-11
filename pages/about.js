import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    window.location.href = "/404";
  }, []);
  return null;
}
