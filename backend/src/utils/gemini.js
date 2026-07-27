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

  const keys = [
    process.env.VITE_GEMINI_KEY_1,
    process.env.VITE_GEMINI_KEY_2,
    process.env.VITE_GEMINI_KEY_3,
    process.env.VITE_GEMINI_KEY_4,
    process.env.VITE_GEMINI_KEY_5
  ].map(k => k ? k.trim() : '').filter(k => k !== '');

  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  let lastError = null;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const slotIndex = (currentKeySlot + attempt) % keys.length;
    const activeKey = keys[slotIndex];
    
    console.log(`[Gemini Client] Attempting API call using Key Slot ${slotIndex + 1}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
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

    try {
      // Set a fetch timeout to prevent hanging forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout per key
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const resData = await response.json();
      const rawText = resData.candidates[0].content.parts[0].text;
      
      // Successfully called and parsed
      const parsed = JSON.parse(rawText);
      
      // Update global rotation pointer to next slot for future calls
      currentKeySlot = (slotIndex + 1) % keys.length;
      return parsed;

    } catch (err) {
      console.warn(`[Gemini Client] Key Slot ${slotIndex + 1} failed: ${err.message}`);
      lastError = err;
      // Continue to next key slot in loop
    }
  }

  throw new Error(`All ${keys.length} Gemini API Key Slots failed. Last error: ${lastError?.message}`);
}
