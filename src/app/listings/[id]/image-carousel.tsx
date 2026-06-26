"use client";

import { useState } from "react";

export function ImageCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  if (urls.length === 0) return <span style={{ fontSize: "4rem" }} aria-hidden>🧺</span>;

  const prev = () => setIdx((i) => (i - 1 + urls.length) % urls.length);
  const next = () => setIdx((i) => (i + 1) % urls.length);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urls[idx]} alt={`${alt} ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

      {urls.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            style={{
              position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%",
              width: "2rem", height: "2rem", cursor: "pointer", color: "#fff", fontSize: "1rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >‹</button>
          <button
            onClick={next}
            aria-label="Next image"
            style={{
              position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%",
              width: "2rem", height: "2rem", cursor: "pointer", color: "#fff", fontSize: "1rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >›</button>
          <div style={{
            position: "absolute", bottom: "0.5rem", left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: "0.35rem",
          }}>
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Image ${i + 1}`}
                style={{
                  width: "0.55rem", height: "0.55rem", borderRadius: "50%", border: "none",
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.45)", cursor: "pointer", padding: 0,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
