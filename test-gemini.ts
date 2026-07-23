import { GoogleGenAI } from "@google/genai";

async function main() {
  const geminiEnvKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  console.log("GEMINI_API_KEY present:", !!geminiEnvKey);
  if (!geminiEnvKey) {
    console.log("No API key found in process.env");
    return;
  }

  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
  ];

  for (const mName of candidateModels) {
    try {
      console.log(`Testing model: ${mName}...`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${geminiEnvKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 100 },
          }),
        },
      );
      if (!res.ok) {
        const errText = await res.text();
        console.log(`Model ${mName} FAILED with status ${res.status}: ${errText.slice(0, 200)}`);
      } else {
        const json = await res.json();
        console.log(`Model ${mName} SUCCESS! Response:`, JSON.stringify(json).slice(0, 200));
        break;
      }
    } catch (e) {
      console.log(`Model ${mName} CRASHED:`, e);
    }
  }
}

main();
