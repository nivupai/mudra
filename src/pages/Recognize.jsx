import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import {
  loadModel,
  predict,
  landmarksToVec,
  orderHands,
} from "../data/mudraClassifier";
import { getMudra } from "../data/mudras";
import "./Recognize.css";

const BASE = import.meta.env.BASE_URL;

export default function Recognize() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const modelsRef = useRef(null);
  const rafRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading | ready | running | error
  const [error, setError] = useState(null);
  const [ranked, setRanked] = useState([]);
  const [handCount, setHandCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `${BASE}models/hand_landmarker.task`,
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
        });
        const [single, double] = await Promise.all([
          loadModel("single", BASE),
          loadModel("double", BASE),
        ]);
        if (cancelled) return;
        landmarkerRef.current = landmarker;
        modelsRef.current = { single, double };
        setStatus("ready");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e.message || String(e));
          setStatus("error");
        }
      }
    }
    init();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close?.();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus("running");
      loop();
    } catch (e) {
      setError("Couldn't access the camera: " + e.message);
      setStatus("error");
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((t) => t.stop());
    setStatus("ready");
    setRanked([]);
    setHandCount(0);
  }

  function loop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const result = landmarker.detectForVideo(video, performance.now());
    const hands = result.landmarks || [];
    setHandCount(hands.length);

    drawHands(ctx, hands, canvas.width, canvas.height);

    if (hands.length === 1) {
      const vec = landmarksToVec(hands[0]);
      setRanked(predict(modelsRef.current.single, vec).slice(0, 3));
    } else if (hands.length === 2) {
      const ordered = orderHands(hands);
      const vec = [...landmarksToVec(ordered[0]), ...landmarksToVec(ordered[1])];
      setRanked(predict(modelsRef.current.double, vec).slice(0, 3));
    } else {
      setRanked([]);
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  const topMatch = ranked[0] ? getMudra(ranked[0].label) : null;

  return (
    <div className="container recognize-page">
      <h1 className="section-title">Mudra Recognition</h1>
      <p className="section-sub">
        Hold up a single-hand or double-hand mudra to your webcam. Hand pose
        is tracked locally with MediaPipe and matched against a small model
        trained on the dataset's hand landmarks — nothing leaves your browser.
      </p>

      {status === "error" && (
        <div className="recognize-card">
          <p className="recognize-error">{error}</p>
        </div>
      )}

      {status !== "error" && (
        <div className="recognize-layout">
          <div className="recognize-video-wrap">
            <video ref={videoRef} className="recognize-video" playsInline muted />
            <canvas ref={canvasRef} className="recognize-canvas" />
            {status === "loading" && <div className="recognize-overlay">Loading model…</div>}
            {status === "ready" && (
              <div className="recognize-overlay">
                <button className="btn gold" onClick={startCamera}>
                  Start camera
                </button>
              </div>
            )}
          </div>

          <div className="recognize-results">
            {status === "running" && (
              <>
                <p className="recognize-hand-count">
                  {handCount === 0 && "No hand detected"}
                  {handCount === 1 && "1 hand — matching single-hand mudras"}
                  {handCount === 2 && "2 hands — matching double-hand mudras"}
                </p>
                {ranked.length > 0 ? (
                  <ul className="recognize-ranked">
                    {ranked.map((r, i) => {
                      const m = getMudra(r.label);
                      return (
                        <li key={r.label} className={i === 0 ? "top" : ""}>
                          <span className="recognize-rank-name">{m?.name || r.label}</span>
                          <span className="recognize-rank-pct">{Math.round(r.prob * 100)}%</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="recognize-hint">Show one or two hands to the camera.</p>
                )}
                {topMatch && (
                  <Link to={`/archive/${topMatch.slug}`} className="btn secondary recognize-view-link">
                    View {topMatch.name} in the archive
                  </Link>
                )}
                <button className="btn secondary" onClick={stopCamera}>
                  Stop camera
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function drawHands(ctx, hands, width, height) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#d4a94a";
  ctx.fillStyle = "#6d1b2c";
  for (const hand of hands) {
    for (const [a, b] of CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(hand[a].x * width, hand[a].y * height);
      ctx.lineTo(hand[b].x * width, hand[b].y * height);
      ctx.stroke();
    }
    for (const p of hand) {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}
