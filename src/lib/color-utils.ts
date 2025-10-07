
"use client"

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let v = max
  const d = max - min
  s = max === 0 ? 0 : d / max

  if (max === min) {
    h = 0
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

export function hsvToRgbString(h: number, s: number, v: number): string {
    let r=0, g=0, b=0;
    const sat = s / 100;
    const val = v / 100;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = val * (1 - sat);
    const q = val * (1 - f * sat);
    const t = val * (1 - (1 - f) * sat);

    switch (i % 6) {
        case 0: r = val; g = t; b = p; break;
        case 1: r = q; g = val; b = p; break;
        case 2: r = p; g = val; b = t; break;
        case 3: r = p; g = q; b = val; break;
        case 4: r = t; g = p; b = val; break;
        case 5: r = val; g = p; b = q; break;
    }

    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}


export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b_lab: number } {
    r /= 255; g /= 255; b /= 255;
    
    const linearToSRGB = (c: number) => (c > 0.0031308) ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
    const srgbToLinear = (c: number) => (c > 0.04045) ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;

    r = srgbToLinear(r);
    g = srgbToLinear(g);
    b = srgbToLinear(b);

    let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    x /= 0.95047;
    y /= 1.00000;
    z /= 1.08883;

    const xyzToLab = (t: number) => (t > 0.008856) ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116);
    x = xyzToLab(x);
    y = xyzToLab(y);
    z = xyzToLab(z);
    
    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const b_ = 200 * (y - z);
    
    return { l: Math.round(l), a: Math.round(a), b_lab: Math.round(b_) };
}
