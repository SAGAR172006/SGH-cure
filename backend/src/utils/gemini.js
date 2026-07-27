// gemini.js
// Shared utility for rotated Gemini LLM API calls on the Node.js backend.



let currentKeySlot = 0;

export function getActiveGeminiKey() {
  const keys = [
    process.env.VITE_GEMINI_KEY_1,
    process.env.VITE_GEMINI_KEY_2,
    process.env.VITE_GEMINI_KEY_3,
    process.env.VITE_GEMINI_KEY_4,
    process.env.VITE_GEMINI_KEY_5
  ].map(k => k ? k.trim() : '').filter(k => k !== '');

  if (keys.length === 0) return { key: null, slot: 0 };
  
  const slotIndex = currentKeySlot % keys.length;
  currentKeySlot++;
  return { key: keys[slotIndex], slot: slotIndex + 1 };
}

export async function callGemini(prompt, systemInstruction = "") {
  const bypass = process.env.VITE_BYPASS_LLM === 'true';
  if (bypass) {
    throw new Error("Gemini API call bypassed by configuration");
  }

  const { key: geminiKey, slot: keySlotNum } = getActiveGeminiKey();
  if (!geminiKey) {
    throw new Error("No Gemini API key available in slot configuration");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini HTTP Error ${response.status}: ${errorBody}`);
  }

  const resData = await response.json();
  try {
    const rawText = resData.candidates[0].content.parts[0].text;
    return JSON.parse(rawText);
  } catch (parseError) {
    throw new Error(`Failed to parse Gemini JSON output: ${parseError.message}`);
  }
}
