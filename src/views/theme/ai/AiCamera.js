import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const AiCamera = () => {
  const videoRef = useRef(null);
  const [currentExpression, setCurrentExpression] = useState("Waiting for detection...");

  useEffect(() => {
    const loadModels = async () => {
      console.log("Loading models...");
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      console.log("Models loaded successfully");

      startVideo();
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          console.log("Video is playing");
        })
        .catch((err) => {
          console.error("Error accessing video stream:", err);
        });
    };

    loadModels();
  }, []);

  const detectExpressions = async () => {
    if (!videoRef.current) return;

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

    const detections = await faceapi
      .detectAllFaces(videoRef.current, options)
      .withFaceExpressions();

    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      const highestExpression = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );

      setCurrentExpression(highestExpression);

      // Draw detections
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear the existing canvas
      const existingCanvas = document.getElementById("overlay");
      if (existingCanvas) existingCanvas.remove();

      // Add a new canvas
      canvas.id = "overlay";
      document.body.append(canvas);

      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      detectExpressions();
    }, 500); // Detect every 500ms

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <video ref={videoRef} autoPlay playsInline width="640" height="480" style={{ border: "1px solid #ccc" }} />
      <div
        style={{
          marginTop: "10px",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        Expression: {currentExpression}
      </div>
    </div>
  );
};

export default AiCamera;
