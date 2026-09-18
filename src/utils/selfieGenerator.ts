/**
 * Generates an authentic-looking SVG data-URI of a camera capture selfie with viewfinder framing,
 * timestamp watermark, employee initial badge, and facial outline silhouette.
 */
export function generateMockSelfie(
  name: string,
  timeString: string,
  locationText = "HQ Campus - Sector 62",
  statusColor = "#10b981"
): string {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="50%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    
    <!-- Background (Camera feed feel) -->
    <rect width="400" height="400" fill="url(#bgGrad)"/>
    
    <!-- Camera Viewfinder Grid Overlay -->
    <line x1="133" y1="0" x2="133" y2="400" stroke="#64748b" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.4"/>
    <line x1="266" y1="0" x2="266" y2="400" stroke="#64748b" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.4"/>
    <line x1="0" y1="133" x2="400" y2="133" stroke="#64748b" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.4"/>
    <line x1="0" y1="266" x2="400" y2="266" stroke="#64748b" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.4"/>
    
    <!-- Face Silhouette / Person representation -->
    <circle cx="200" cy="165" r="70" fill="url(#avatarGrad)" stroke="#94a3b8" stroke-width="2"/>
    <path d="M 100 340 C 100 250, 300 250, 300 340 Z" fill="url(#avatarGrad)" stroke="#94a3b8" stroke-width="2"/>
    
    <!-- Initials inside the face circle -->
    <text x="200" y="180" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="42" font-weight="700" fill="#f8fafc" text-anchor="middle">${initials}</text>
    
    <!-- Viewfinder Corner Brackets -->
    <path d="M 40 70 L 40 40 L 70 40" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <path d="M 330 40 L 360 40 L 360 70" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <path d="M 40 330 L 40 360 L 70 360" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <path d="M 330 360 L 360 360 L 360 330" stroke="#38bdf8" stroke-width="3" fill="none"/>
    
    <!-- Live Biometric Face Detection Frame -->
    <rect x="110" y="75" width="180" height="240" rx="20" fill="none" stroke="${statusColor}" stroke-width="2" stroke-dasharray="8 6"/>
    
    <!-- Top Bar Status & Live Indicator -->
    <rect x="0" y="0" width="400" height="42" fill="#000000" fill-opacity="0.6"/>
    <circle cx="24" cy="21" r="5" fill="#ef4444"/>
    <text x="36" y="25" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="600" fill="#f8fafc">REC • LIVE VERIFIED</text>
    <text x="376" y="25" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" text-anchor="end">CAM 01</text>
    
    <!-- Bottom Timestamp & Location Watermark Overlay -->
    <rect x="0" y="340" width="400" height="60" fill="#000000" fill-opacity="0.75"/>
    <text x="20" y="362" font-family="monospace" font-size="12" font-weight="700" fill="#f8fafc">${name}</text>
    <text x="20" y="384" font-family="monospace" font-size="11" fill="#38bdf8">${timeString} • GPS: ${locationText}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
