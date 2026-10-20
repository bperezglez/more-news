import { ImageResponse } from "next/og";

/** Icono de la app como PNG (generado en build para no versionar binarios). */
export function renderAppIcon(size: number) {
  const unit = size / 512;
  const bar = (width: number, top: number) => (
    <div
      style={{
        position: "absolute",
        left: 128 * unit,
        top: top * unit,
        width: width * unit,
        height: 32 * unit,
        background: "#ffffff",
      }}
    />
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#171717",
        }}
      >
        {bar(256, 144)}
        {bar(256, 240)}
        {bar(176, 336)}
        <div
          style={{
            position: "absolute",
            left: 352 * unit,
            top: 328 * unit,
            width: 80 * unit,
            height: 80 * unit,
            borderRadius: "50%",
            background: "#2563eb",
          }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
