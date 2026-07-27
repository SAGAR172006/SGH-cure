import { Geolocation } from '@capacitor/geolocation';

/**
 * Gets the current GPS location coordinates and opens the native SMS application
 * pre-filled with a Google Maps link.
 * 
 * @param {string} phoneNumber The recipient's phone number
 */
export async function shareLocationViaSms(phoneNumber) {
  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    const { latitude, longitude } = pos.coords;
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const body = encodeURIComponent(`Emergency! I need help. My current GPS location: ${mapsLink}`);
    
    window.location.href = `sms:${phoneNumber}?body=${body}`;
  } catch (err) {
    console.error('Error sharing GPS coordinates:', err);
    throw err; // rethrow for component to catch and show user alert
  }
}
