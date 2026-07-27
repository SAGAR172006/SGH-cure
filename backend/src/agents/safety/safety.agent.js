// safety.agent.js
// Scans for clinical emergency indicators to prioritize urgent routing.

const emergencyKeywords = [
  "chest pain", "heart attack", "cardiac arrest", "stroke symptoms", "active paralysis", "severe difficulty breathing",
  "cannot breathe", "choking", "bleeding heavily", "severe arterial bleeding", "active poisoning",
  "grand mal seizure", "unconscious", "suicide attempt", "suicidal thoughts", "severe pregnancy bleeding",
  "सीने में असहनीय दर्द", "दिल का गंभीर दौरा", "सांस रुकना", "गंभीर रक्तस्राव", "विषाक्तता",
  "ಎದೆ ತೀವ್ರ ನೋವು", "ಹೃದಯಾಘಾತ", "ಉಸಿರಾಟ ನಿಲ್ಲುವುದು", "ಭಾರಿ ರಕ್ತಸ್ರಾವ", "ವಿಷ ಸೇವನೆ"
];

export function runSafetyCheck(inputText) {
  const textLower = inputText.toLowerCase();
  const isEmergency = emergencyKeywords.some(kw => textLower.includes(kw));
  
  if (isEmergency) {
    return {
      emergency: true,
      level: "Critical",
      reason: "Potential cardiopulmonary, stroke, airway, or acute trauma emergency detected.",
      recommendation: "Please bypass clinical booking and contact emergency services 108 immediately!"
    };
  }
  
  return { emergency: false };
}
