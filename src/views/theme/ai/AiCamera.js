import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./ai.scss"
const AiCamera = () => {
  const videoRef = useRef(null);
  const [currentExpression, setCurrentExpression] = useState("Waiting for detection...");

  useEffect(() => {
    const loadModels = async () => {
      console.log("Loading models...");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),// TinyFaceDetector: A lightweight face detection model. It’s fast and suitable for real-time applications.
        faceapi.nets.faceExpressionNet.loadFromUri("/models"), // FaceExpressionNet: Used for detecting facial expressions such as happiness, sadness, anger, etc.
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"), // FaceExpressionNet: Used for detecting facial expressions such as happiness, sadness, anger, etc.

      ])

      console.log("Models loaded successfully");

      startVideo();
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true, mirror: true })
        .then((stream) => {
          const videoElement = document.querySelector('video');
          videoElement.srcObject = stream;
          videoElement.style.transform = 'scaleX(-1)';

          console.log("Video is playing");
        })
        .catch((err) => {
          console.error("Error accessing video stream:", err);
        });
    };

    loadModels();
  }, []);

  const detectExpressions = async (displaySize, canvas) => {
    if (!videoRef.current) return;

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.6 });

    // Use detectSingleFace instead of detectAllFaces
    const detection = await faceapi
      .detectSingleFace(videoRef.current, options).withFaceLandmarks()
      .withFaceExpressions();
    console.log(detection, "ll")
    if (!detection) {
      // No face detected, set expression to "No face detected"
      setCurrentExpression("No face detected");
      return;
    }
    const resizedDetections = faceapi.resizeResults([detection], displaySize)
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas,resizedDetections)
    const expressions = detection.expressions;
    console.log(detection, "Object.keys(expressions)")
    const highestExpression = Object.keys(expressions).reduce((a, b) =>
      expressions[a] > expressions[b] ? a : b
    );

    setCurrentExpression(highestExpression);


  };

  useEffect(() => {
    document.querySelector("video").addEventListener("play", () => {
      //  let videoElement=document.querySelector("video")
      let canvas = faceapi?.createCanvasFromMedia(videoRef.current)
      document.getElementById("videoWrapper").append(canvas)
      let displaySize = { width: videoRef.current.width, height: videoRef.current.height }
      faceapi.matchDimensions(canvas, displaySize)
      const interval = setInterval(() => {
        detectExpressions(displaySize, canvas);
      }, 500); // Detect every 500ms

      return () => clearInterval(interval); // Cleanup interval on component unmount

    })
  }, [videoRef.current]);

  return (
    <div id="videoWrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="640"
        height="480"

      />
      <div
        style={{
          marginTop: "10px",
          fontSize: "18px",
          fontWeight: "bold",
          color: "white",
        }}
      >
        Expression: {currentExpression}
      </div>
    </div>
  );
};

export default AiCamera;
