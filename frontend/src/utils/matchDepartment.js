// matchDepartment.js
// A rules-based classifier mapping symptom descriptions in English, Hindi, or Kannada to healthcare departments.

const localizedKeywords = {
  cardiology: [
    "chest pain", "heart", "breath", "palpitation", "bp", "blood pressure",
    "सीने में दर्द", "दिल", "धड़कन", "सांस", "रक्तचाप",
    "ಎದೆ ನೋವು", "ಹೃದಯ", "ಉಸಿರಾಟ", "ರಕ್ತದೊತ್ತಡ"
  ],
  dermatology: [
    "skin", "rash", "itch", "acne", "allergy", "eczema", "itching",
    "त्वचा", "खुजली", "दानें", "एलर्जी",
    "ಚರ್ಮ", "ತುರಿಕೆ", "ಗುಳ್ಳೆ", "ಅಲರ್ಜಿ"
  ],
  orthopedics: [
    "leg", "knee", "back pain", "bone", "joint", "shoulder", "ankle", "fracture", "pain in leg",
    "पैर", "घुटने", "पीठ दर्द", "हड्डी", "जोड़", "दर्द",
    "ಕಾಲು", "ಮೊಣಕಾಲು", "ಬೆನ್ನು ನೋವು", "ಮೂಳೆ", "ನೋವು"
  ],
  pediatrics: [
    "child", "baby", "infant", "kid", "son", "daughter", "pediatric",
    "बच्चा", "शिशु", "बेटा", "बेटी",
    "ಮಗು", "ಮಕ್ಕಳು", "ಮಗ", "ಮಗಳು"
  ],
  gynecology: [
    "women", "pregnancy", "period", "gynec", "pregnant", "menstrual",
    "गर्भवती", "महिला", "पीरियड्स", "स्त्री",
    "ಗರ್ಭಿಣಿ", "ಮಹಿಳೆ", "ಋತುಚಕ್ರ", "ಹೆಣ್ಣು"
  ],
  dentistry: [
    "tooth", "teeth", "gum", "dentist", "toothache", "dental",
    "दांत", "मसूड़े", "दांत दर्द", "दंत",
    "ಹಲ್ಲು", "ಹಲ್ಲು ನೋವು", "ದಂತ"
  ],
  ophthalmology: [
    "eye", "vision", "blurry", "cataract", "glasses",
    "आँख", "नज़र", "धुंधला", "चश्मा",
    "ಕಣ್ಣು", "ದೃಷ್ಟಿ", "ಕಣ್ಣಿನ ನೋವು"
  ]
};

export function matchDepartment(inputText) {
  if (!inputText) return null;
  const text = inputText.toLowerCase();
  
  for (const [dept, keywords] of Object.entries(localizedKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      return dept;
    }
  }
  
  return null; // fallback to trigger helper message
}
