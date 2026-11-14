"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR code for the payslip's public verification link. */
export function PayslipQr({ value, size = 76 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, { margin: 0, width: size * 3, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } })
      .then((url) => live && setSrc(url))
      .catch(() => live && setSrc(null));
    return () => {
      live = false;
    };
  }, [value, size]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Payslip verification QR code" width={size} height={size} className="block" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded bg-slate-100" />
  );
}
