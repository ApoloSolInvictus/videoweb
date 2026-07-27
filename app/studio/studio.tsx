"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { imagePresets, videoPresets } from "@/lib/models";

type Asset = {
  type: "image" | "video";
  src: string;
  label: string;
  extension?: "jpg" | "png" | "mp4";
};

type VideoJob = {
  model: string;
  queue_id: string;
  download_url?: string;
};

const aspectRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"];

function withImagePrefix(value: string, format: "png" | "jpeg") {
  if (value.startsWith("data:")) return value;
  return `data:image/${format};base64,${value}`;
}

async function readApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function errorMessage(data: any, fallback: string) {
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (typeof data?.details === "object") return JSON.stringify(data.details);
  return fallback;
}

async function fileToDataUrl(file?: File | null) {
  if (!file) return "";
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Studio() {
  const [tab, setTab] = useState<"image" | "video">("image");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [prompt, setPrompt] = useState(
    "Ancient apocryphal library under a midnight sun, luminous manuscripts, cinematic sacred mystery"
  );
  const [negativePrompt, setNegativePrompt] = useState("low quality, blurry, distorted text");
  const [imageModel, setImageModel] = useState<string>(imagePresets[0].id);
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg">("png");
  const [videoPresetId, setVideoPresetId] = useState<string>(videoPresets[0].id);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState<string>(videoPresets[0].duration);
  const [resolution, setResolution] = useState<string>(videoPresets[0].resolution);
  const [audio, setAudio] = useState<boolean>(videoPresets[0].audio);
  const [imageInput, setImageInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [job, setJob] = useState<VideoJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [quote, setQuote] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const videoPreset = useMemo(
    () => videoPresets.find((preset) => preset.id === videoPresetId) || videoPresets[0],
    [videoPresetId]
  );

  function applyVideoPreset(id: string) {
    const preset = videoPresets.find((item) => item.id === id) || videoPresets[0];
    setVideoPresetId(id);
    setDuration(preset.duration);
    setResolution(preset.resolution);
    setAudio(preset.audio);
    setQuote("");
    setJob(null);
  }

  async function pickFile(event: ChangeEvent<HTMLInputElement>, kind: "image" | "video") {
    const dataUrl = await fileToDataUrl(event.target.files?.[0]);
    if (kind === "image") setImageInput(dataUrl);
    if (kind === "video") setVideoInput(dataUrl);
  }

  async function generateImage() {
    setBusy(true);
    setError("");
    setStatus("Generando imagen...");

    const preset = imagePresets.find((item) => item.id === imageModel) || imagePresets[0];
    const payload: Record<string, unknown> = {
      model: preset.id,
      prompt,
      negative_prompt: negativePrompt,
      format: imageFormat,
      variants: 1,
      aspect_ratio: aspectRatio
    };

    if ("size" in preset) {
      payload.width = preset.size.width;
      payload.height = preset.size.height;
      delete payload.aspect_ratio;
    }
    if ("resolution" in preset) {
      payload.resolution = preset.resolution;
    }

    const response = await fetch("/api/venice/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse(response);
    setBusy(false);

    if (!response.ok) {
      setError(errorMessage(data, "No se pudo generar la imagen."));
      setStatus("");
      return;
    }

    const nextAssets = (data.images || []).map((image: string, index: number) => ({
      type: "image" as const,
      src: withImagePrefix(image, imageFormat),
      label: `${preset.label} #${index + 1}`,
      extension: imageFormat === "jpeg" ? "jpg" : "png"
    }));
    setAssets((current) => [...nextAssets, ...current]);
    setImageInput(nextAssets[0]?.src || imageInput);
    setStatus("Imagen lista.");
  }

  async function quoteVideo() {
    setBusy(true);
    setError("");
    setQuote("");
    setStatus("Calculando quote...");

    const payload: Record<string, unknown> = {
      model: videoPresetId,
      duration,
      resolution,
      aspect_ratio: aspectRatio,
      audio
    };
    if (videoPreset.mode === "image" && imageInput) payload.image_url = imageInput;
    if (videoPreset.mode === "video" && videoInput) payload.video_url = videoInput;

    const response = await fetch("/api/venice/video/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse(response);
    setBusy(false);

    if (!response.ok) {
      setError(errorMessage(data, "No se pudo cotizar."));
      setStatus("");
      return;
    }

    setQuote(`Quote estimado: $${Number(data.quote).toFixed(2)} USD`);
    setStatus("");
  }

  async function queueVideo() {
    if (videoPreset.mode === "image" && !imageInput) {
      setError("Sube una imagen base o pega una URL antes de crear este video.");
      return;
    }
    if (videoPreset.mode === "video" && !videoInput) {
      setError("Sube un video base o pega una URL antes de continuar este video.");
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Enviando video a la cola...");

    const payload: Record<string, unknown> = {
      model: videoPresetId,
      prompt,
      consents: {},
      negative_prompt: negativePrompt,
      duration,
      resolution,
      aspect_ratio: aspectRatio,
      audio
    };

    if (videoPreset.mode === "image") payload.image_url = imageInput;
    if (videoPreset.mode === "video") payload.video_url = videoInput;

    const response = await fetch("/api/venice/video/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse(response);
    setBusy(false);

    if (!response.ok) {
      setError(errorMessage(data, "No se pudo crear el job."));
      setStatus("");
      return;
    }

    setJob(data);
    setStatus(`Job listo: ${data.queue_id}. Consultando automaticamente...`);
    pollVideo(data);
  }

  async function pollVideo(currentJob: VideoJob, attempt = 0) {
    setPolling(true);
    setError("");
    setStatus(attempt ? `Procesando video... consulta ${attempt + 1}` : "Consultando video...");

    const response = await fetch("/api/venice/video/retrieve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentJob)
    });
    const data = await readApiResponse(response);

    if (!response.ok) {
      setPolling(false);
      setError(errorMessage(data, "No se pudo consultar el video."));
      setStatus("");
      return;
    }

    if (data.status === "COMPLETED" && data.video) {
      setAssets((current) => [
        { type: "video", src: data.video, label: `${videoPreset.label} ${duration}`, extension: "mp4" },
        ...current
      ]);
      setVideoInput(data.video);
      setPolling(false);
      setStatus("Video listo.");
      return;
    }

    const remaining = data.average_execution_time
      ? Math.max(0, Math.round((data.average_execution_time - data.execution_duration) / 1000))
      : null;
    setStatus(remaining === null ? `Estado: ${data.status}` : `Procesando. Estimado: ${remaining}s`);

    if (attempt < 60) {
      window.setTimeout(() => pollVideo(currentJob, attempt + 1), 8000);
      return;
    }

    setPolling(false);
    setStatus("El job sigue procesando. Usa Revisar job en unos minutos.");
  }

  async function retrieveVideo() {
    if (!job) return;
    pollVideo(job);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="sigil" aria-hidden="true">
            <span />
          </div>
          <div>
            <h1>Video Web</h1>
            <p>The Secret Books · Venice AI</p>
          </div>
        </div>
        <button className="logout" onClick={logout} type="button">
          Salir
        </button>
      </header>

      <section className="workspace">
        <aside className="panel controls">
          <div className="tabs">
            <button className={`tab ${tab === "image" ? "active" : ""}`} onClick={() => setTab("image")} type="button">
              Imagen
            </button>
            <button className={`tab ${tab === "video" ? "active" : ""}`} onClick={() => setTab("video")} type="button">
              Video
            </button>
          </div>

          <div className="form">
            <div className="field">
              <label htmlFor="prompt">Prompt</label>
              <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="negative">Negative prompt</label>
              <input
                id="negative"
                value={negativePrompt}
                onChange={(event) => setNegativePrompt(event.target.value)}
              />
            </div>

            {tab === "image" ? (
              <>
                <div className="field">
                  <label htmlFor="image-model">Modelo de imagen</label>
                  <select id="image-model" value={imageModel} onChange={(event) => setImageModel(event.target.value)}>
                    {imagePresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label} · {preset.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Aspect ratio</label>
                  <div className="segments">
                    {aspectRatios.map((ratio) => (
                      <button
                        className={`segment ${aspectRatio === ratio ? "active" : ""}`}
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        type="button"
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Formato de descarga</label>
                  <div className="segments">
                    <button
                      className={`segment ${imageFormat === "png" ? "active" : ""}`}
                      onClick={() => setImageFormat("png")}
                      type="button"
                    >
                      PNG
                    </button>
                    <button
                      className={`segment ${imageFormat === "jpeg" ? "active" : ""}`}
                      onClick={() => setImageFormat("jpeg")}
                      type="button"
                    >
                      JPG
                    </button>
                  </div>
                </div>
                <button className="primary" disabled={busy} onClick={generateImage} type="button">
                  {busy ? "Trabajando..." : "Crear imagen"}
                </button>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="video-model">Modelo de video</label>
                  <select id="video-model" value={videoPresetId} onChange={(event) => applyVideoPreset(event.target.value)}>
                    {videoPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label} · {preset.note}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid2">
                  <div className="field">
                    <label htmlFor="duration">Duracion</label>
                    <input id="duration" value={duration} onChange={(event) => setDuration(event.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="resolution">Resolucion</label>
                    <input id="resolution" value={resolution} onChange={(event) => setResolution(event.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Aspect ratio</label>
                  <div className="segments">
                    {aspectRatios.map((ratio) => (
                      <button
                        className={`segment ${aspectRatio === ratio ? "active" : ""}`}
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        type="button"
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="note">
                  <input checked={audio} onChange={(event) => setAudio(event.target.checked)} type="checkbox" /> Audio
                </label>
                {videoPreset.mode === "image" ? (
                  <div className="field">
                    <label htmlFor="image-input">Imagen base</label>
                    <input
                      id="image-url"
                      placeholder="https://... o data:image/..."
                      value={imageInput}
                      onChange={(event) => setImageInput(event.target.value)}
                    />
                    <input id="image-input" accept="image/*" onChange={(event) => pickFile(event, "image")} type="file" />
                  </div>
                ) : null}
                {videoPreset.mode === "video" ? (
                  <div className="field">
                    <label htmlFor="video-input">Video base</label>
                    <input
                      id="video-url"
                      placeholder="https://... o data:video/..."
                      value={videoInput}
                      onChange={(event) => setVideoInput(event.target.value)}
                    />
                    <input id="video-input" accept="video/*" onChange={(event) => pickFile(event, "video")} type="file" />
                  </div>
                ) : null}
                <div className="actions">
                  <button className="secondary" disabled={busy || polling} onClick={quoteVideo} type="button">
                    Cotizar
                  </button>
                  <button className="primary" disabled={busy || polling} onClick={queueVideo} type="button">
                    {polling ? "Procesando..." : "Crear video"}
                  </button>
                  <button className="secondary" disabled={busy || polling || !job} onClick={retrieveVideo} type="button">
                    Revisar job
                  </button>
                </div>
              </>
            )}

            {quote ? <div className="quote">{quote}</div> : null}
            {status ? <div className="quote">{status}</div> : null}
            {error ? <div className="error">{error}</div> : null}
            <p className="note">
              Default recomendado: Longcat Distilled para clips largos baratos; Grok Imagine Private para clips
              fotorealistas con audio.
            </p>
          </div>
        </aside>

        <section className="panel stage">
          {assets.length ? (
            <div className="gallery">
              {assets.map((asset, index) => (
                <article className="asset" key={`${asset.label}-${index}`}>
                  {asset.type === "image" ? (
                    <img alt={asset.label} src={asset.src} />
                  ) : (
                    <video controls src={asset.src} />
                  )}
                  <footer>
                    <span>{asset.label}</span>
                    <a download={`secret-books.${asset.extension || (asset.type === "image" ? "png" : "mp4")}`} href={asset.src}>
                      Descargar
                    </a>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <div>
                <strong>Atelier listo</strong>
                <span>Las imagenes y videos apareceran aqui.</span>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
