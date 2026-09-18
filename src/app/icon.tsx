import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same caramel-to-coffee gradient as .bg-gradient-brand in globals.css —
// kept as literal hex here rather than importing the CSS class, since this
// runs as its own isolated route handler (ImageResponse), not a normal page
// that can pull in Tailwind classes.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8a6a4f, #6b4c3a, #5c4433)",
          borderRadius: "7px",
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        I
      </div>
    ),
    { ...size }
  );
}
