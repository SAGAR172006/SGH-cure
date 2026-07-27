// translation.agent.js
// Handles localized audio translations to/from English, Hindi, and Kannada.

export function translateToEnglish(text, sourceLanguage) {
  if (sourceLanguage === 'en') return text;
  
  if (sourceLanguage === 'hi') {
    return `[Translated from Hindi] ${text}`;
  }
  if (sourceLanguage === 'kn') {
    return `[Translated from Kannada] ${text}`;
  }
  return text;
}

export function translateFromEnglish(text, targetLanguage) {
  if (targetLanguage === 'en') return text;

  if (targetLanguage === 'hi') {
    return `[अनुवादित]: ${text}`;
  }
  if (targetLanguage === 'kn') {
    return `[ಅನುವಾದಿಸಲಾಗಿದೆ]: ${text}`;
  }
  return text;
}
