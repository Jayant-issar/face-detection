"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceDetectionApp = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState('');
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [expressions, setExpressions] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        setIsModelLoading(true);
        Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]).then(() => {
          setIsModelLoading(false);
          startVideo();
        }).catch((err) => {
          setError('Failed to load models: ' + err.message);
          console.error('Error loading models:', err);
        });
      } catch (err) {
        setError('Failed to initialize face detection: ' + err.message);
        console.error('Error initializing:', err);
      }
    };

    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 480,
          height: 360,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Failed to access camera: ' + err.message);
      console.error('Error accessing camera:', err);
    }
  };

  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.width;
    canvas.height = video.height;

    const detect = async () => {
      if (video.paused || video.ended) return;

      try {
        const detections = await faceapi
          .detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 512,
              scoreThreshold: 0.5
            })
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        // Update detected faces count
        setDetectedFaces(detections.length);

        // Update expressions
        if (detections.length > 0) {
          const dominantExpression = Object.entries(detections[0].expressions)
            .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
          setExpressions(detections[0].expressions);
        } else {
          setExpressions(null);
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const dims = faceapi.matchDimensions(canvas, {
          width: video.width,
          height: video.height
        }, true);

        const resizedDetections = faceapi.resizeResults(detections, dims);

        // Draw with custom colors
        faceapi.draw.drawDetections(canvas, resizedDetections, {
          boxColor: '#4CAF50',
          boxLineWidth: 2,
          drawLandmarks: true,
          drawExpressions: true
        });

        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections, {
          lineWidth: 2,
          pointSize: 2,
          pointColor: '#FF4081'
        });

        requestAnimationFrame(detect);
      } catch (err) {
        console.error('Detection error:', err);
      }
    };

    detect();
  };

  const renderExpressionBars = () => {
    if (!expressions) return null;

    return Object.entries(expressions)
      .sort(([, a], [, b]) => b - a)
      .map(([expression, confidence]) => (
        <div key={expression} className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="capitalize">{expression}</span>
            <span>{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      ));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Face Detection Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Video Feeds */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Camera Feed</h2>
              <div className="relative inline-block">
                {isModelLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg z-10">
                    <div className="text-white text-lg font-semibold">
                      Loading face detection models...
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 rounded-lg z-10">
                    <div className="text-white text-lg font-semibold p-4 text-center">
                      {error}
                    </div>
                  </div>
                )}
                <div className=' flex'>
                        <video
                        ref={videoRef}
                        className="rounded-lg shadow-md border-2 border-red-600"
                        autoPlay
                        playsInline
                        muted
                        onPlay={handleVideoPlay}
                        width="480"
                        height="360"
                        />
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Detection Preview</h2>
                    <canvas
                        ref={canvasRef}
                        className="rounded-lg shadow-md"
                        width="480"
                        height="360"
                    />
                        </div>
                
            </div>
              </div>
            </div>

            
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Detection Stats</h2>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Detected Faces</span>
                  <span className="text-2xl font-bold text-blue-600">{detectedFaces}</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-gray-700">Expression Analysis</h3>
              <div className="space-y-2">
                {renderExpressionBars()}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Instructions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Make sure you're in a well-lit environment</li>
                <li>Position your face within the camera frame</li>
                <li>Try different expressions to see the analysis</li>
                <li>Multiple faces can be detected simultaneously</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceDetectionApp;