interface DeviceInfo {
  name: string;
  type: string;
  os: string;
  browser: string;
  fingerprint: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Determine device type
  let type = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    type = 'tablet';
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    type = 'mobile';
  }

  // Determine OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac os x')) os = 'macos';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('ios')) os = 'ios';
  else if (ua.includes('linux')) os = 'linux';

  // Determine browser
  let browser = 'unknown';
  if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('chrome')) browser = 'chrome';
  else if (ua.includes('safari')) browser = 'safari';
  else if (ua.includes('edge')) browser = 'edge';
  else if (ua.includes('opera')) browser = 'opera';

  // Generate a simple fingerprint
  const fingerprint = Buffer.from(
    `${type}-${os}-${browser}-${userAgent}`,
  ).toString('base64');

  // Generate device name
  const name = `${os.charAt(0).toUpperCase() + os.slice(1)} ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return {
    name,
    type,
    os,
    browser,
    fingerprint,
  };
}
