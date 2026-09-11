export interface ParsedDeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  operatingSystem: string;
}

export function parseUserAgent(ua?: string | null): ParsedDeviceInfo {
  if (!ua || typeof ua !== 'string') {
    return {
      deviceType: 'unknown',
      browser: 'Unknown Browser',
      operatingSystem: 'Unknown OS',
    };
  }

  const uaLower = ua.toLowerCase();

  // 1. Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
  if (
    uaLower.includes('tablet') ||
    uaLower.includes('ipad') ||
    (uaLower.includes('android') && !uaLower.includes('mobile'))
  ) {
    deviceType = 'tablet';
  } else if (
    uaLower.includes('mobile') ||
    uaLower.includes('iphone') ||
    uaLower.includes('ipod') ||
    uaLower.includes('android') ||
    uaLower.includes('blackberry') ||
    uaLower.includes('webos')
  ) {
    deviceType = 'mobile';
  }

  // 2. Operating System
  let operatingSystem = 'Unknown OS';
  if (
    uaLower.includes('windows nt 10.0') ||
    uaLower.includes('windows 10') ||
    uaLower.includes('windows 11')
  ) {
    operatingSystem = 'Windows';
  } else if (uaLower.includes('windows nt')) {
    operatingSystem = 'Windows';
  } else if (
    uaLower.includes('iphone') ||
    uaLower.includes('ipad') ||
    uaLower.includes('ipod')
  ) {
    operatingSystem = 'iOS';
  } else if (uaLower.includes('mac os x') || uaLower.includes('macintosh')) {
    operatingSystem = 'macOS';
  } else if (uaLower.includes('android')) {
    operatingSystem = 'Android';
  } else if (uaLower.includes('linux')) {
    operatingSystem = 'Linux';
  } else if (uaLower.includes('cros')) {
    operatingSystem = 'ChromeOS';
  }

  // 3. Browser
  let browser = 'Unknown Browser';
  if (uaLower.includes('edg/') || uaLower.includes('edge/')) {
    browser = 'Microsoft Edge';
  } else if (uaLower.includes('opr/') || uaLower.includes('opera/')) {
    browser = 'Opera';
  } else if (uaLower.includes('chrome/') && !uaLower.includes('edg/')) {
    browser = 'Google Chrome';
  } else if (uaLower.includes('firefox/')) {
    browser = 'Mozilla Firefox';
  } else if (uaLower.includes('safari/') && !uaLower.includes('chrome/')) {
    browser = 'Apple Safari';
  } else if (uaLower.includes('postmanruntime')) {
    browser = 'Postman API Client';
  } else if (uaLower.includes('curl/')) {
    browser = 'cURL';
  }

  return {
    deviceType,
    browser,
    operatingSystem,
  };
}
