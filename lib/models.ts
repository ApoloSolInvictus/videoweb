export const imagePresets = [
  {
    id: "chroma",
    label: "Chroma",
    price: "$0.01",
    size: { width: 1024, height: 1024 },
    note: "Economico recomendado"
  },
  {
    id: "z-image-turbo",
    label: "Z-Image Turbo",
    price: "$0.01",
    size: { width: 1024, height: 1024 },
    note: "Rapido y barato"
  },
  {
    id: "grok-imagine-image",
    label: "Grok Imagine",
    price: "$0.03 1K",
    resolution: "1K",
    note: "Privado, mejor detalle"
  },
  {
    id: "krea-2-turbo",
    label: "Krea 2 Turbo",
    price: "$0.04 1K",
    resolution: "1K",
    note: "Buen balance"
  }
] as const;

export const videoPresets = [
  {
    id: "longcat-distilled-text-to-video",
    label: "Longcat Distilled",
    mode: "text",
    duration: "30s",
    resolution: "720p",
    audio: false,
    audioConfigurable: false,
    note: "Mas duracion por credito"
  },
  {
    id: "grok-imagine-text-to-video-private",
    label: "Grok Imagine Private",
    mode: "text",
    duration: "15s",
    resolution: "480p",
    audio: true,
    audioConfigurable: false,
    note: "Privado, audio, fotorealista"
  },
  {
    id: "grok-imagine-image-to-video-private",
    label: "Grok Imagine I2V Private",
    mode: "image",
    duration: "15s",
    resolution: "480p",
    audio: true,
    audioConfigurable: false,
    note: "Animar imagen privada"
  },
  {
    id: "pixverse-c1-image-to-video",
    label: "PixVerse C1 I2V",
    mode: "image",
    duration: "15s",
    resolution: "360p",
    audio: true,
    audioConfigurable: true,
    note: "Economico con audio"
  },
  {
    id: "wan-2-7-video-to-video",
    label: "Wan 2.7 Edit",
    mode: "video",
    duration: "Auto",
    resolution: "720p",
    audio: false,
    audioConfigurable: false,
    note: "Continuar o editar video"
  }
] as const;
