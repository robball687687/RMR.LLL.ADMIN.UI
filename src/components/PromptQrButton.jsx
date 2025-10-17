import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import QRCode from "react-qr-code";

/**
 * PromptQrButton
 * Props:
 *  - url: string (required)
 *  - label?: string (button tooltip/aria, default "Show QR")
 *  - size?: "small" | "medium" | "large" (IconButton size)
 *  - fileName?: string (download name, default "qr-code.jpg")
 *  - qrSize?: number (rendered size in dialog, default 240)
 *  - jpgSize?: number (exported size in pixels, default 600)
 *  - buttonVariant?: "icon" | "text" (default "icon")
 */
export default function PromptQrButton({
  url,
  label = "Show QR",
  size = "small",
  fileName = "qr-code.jpg",
  qrSize = 240,
  jpgSize = 600,
  buttonVariant = "icon",
}) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef(null);
  const safeUrl = (url || "").trim();

  const downloadJpg = async () => {
    try {
      const svg = hostRef.current?.querySelector("svg");
      if (!svg) return;

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgDataUri = "data:image/svg+xml;base64," + btoa(svgString);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = svgDataUri;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = jpgSize;
        canvas.height = jpgSize;
        const ctx = canvas.getContext("2d");

        // white background for good printer/reader contrast
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const link = document.createElement("a");
        link.download = fileName || "qr-code.jpg";
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.click();
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("QR download failed:", e);
    }
  };

  const Trigger =
    buttonVariant === "text" ? (
      <Button onClick={() => setOpen(true)} disabled={!safeUrl} size={size} startIcon={<QrCode2Icon />}>
        QR
      </Button>
    ) : (
      <Tooltip title={label}>
        <span>
          <IconButton onClick={() => setOpen(true)} disabled={!safeUrl} size={size}>
            <QrCode2Icon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    );

  return (
    <>
      {Trigger}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>QR Code</DialogTitle>
        <DialogContent dividers>
          <Box
            ref={hostRef}
            sx={{ p: 2, bgcolor: "#fff", display: "flex", justifyContent: "center" }}
          >
            {/* react-qr-code renders an SVG; we export that to JPG on download */}
            <QRCode value={safeUrl || "about:blank"} style={{ width: qrSize, height: qrSize }} />
          </Box>
          <Typography variant="body2" sx={{ mt: 1, wordBreak: "break-all" }}>
            {safeUrl || "Missing link"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={downloadJpg} disabled={!safeUrl}>
            Download JPG
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
