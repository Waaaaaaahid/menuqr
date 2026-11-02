import QRCode from 'qrcode';

export const generateTableQRCode = async (baseUrl, restaurantSlug, tableNumber, qrToken) => {
  const targetUrl = `${baseUrl}/menu/${restaurantSlug}?table=${encodeURIComponent(tableNumber)}${qrToken ? `&key=${encodeURIComponent(qrToken)}` : ''}`;

  // Generate PNG Data URL with high resolution & custom color scheme
  const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    scale: 10,
    color: {
      dark: '#0f172a', // Slate 900
      light: '#ffffff',
    },
  });

  // Generate SVG string for vector download
  const qrCodeSvg = await QRCode.toString(targetUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return {
    targetUrl,
    qrCodeDataUrl,
    qrCodeSvg,
  };
};
