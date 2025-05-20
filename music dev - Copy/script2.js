// Key mappings from keyboard keys to piano note labels
const keyMappings = {
  'a': 'C', 's': 'D', 'd': 'E', 'f': 'F',
  'g': 'G', 'h': 'A', 'j': 'B', 'k': 'C2',
  'l': 'D2', ';': 'E2', 'z': 'F2', 'x': 'G2',
  'c': 'A2', 'v': 'B2', 'b': 'C3', 'n': 'D3',
  'm': 'E3', ',': 'F3', '.': 'G3',
  '`': 'C#', '1': 'D#', '2': 'F#', '3': 'G#',
  '4': 'A#', '5': 'C#2', '6': 'D#2', '7': 'F#2',
  '8': 'G#2', '9': 'A#2', '0': 'C#3', '-': 'D#3',
  '=': 'F#3'
};

// Frequencies (A4 = 440Hz reference)
const noteFrequencies = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63,
  'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00,
  'A#': 466.16, 'B': 493.88,

  'C2': 523.25, 'C#2': 554.37, 'D2': 587.33, 'D#2': 622.25, 'E2': 659.25,
  'F2': 698.46, 'F#2': 739.99, 'G2': 783.99, 'G#2': 830.61, 'A2': 880.00,
  'A#2': 932.33, 'B2': 987.77,

  'C3': 1046.50, 'C#3': 1108.73, 'D3': 1174.66, 'D#3': 1244.51, 'E3': 1318.51,
  'F3': 1396.91, 'F#3': 1479.98, 'G3': 1567.98, 'G#3': 1661.22, 'A3': 1760.00,
  'A#3': 1864.66, 'B3': 1975.53,

  'C4': 2093.00, 'C#4': 2217.46, 'D4': 2349.32, 'D#4': 2489.02, 'E4': 2637.02,
  'F4': 2793.83, 'F#4': 2959.96, 'G4': 3135.96, 'G#4': 3322.44, 'A4': 3520.00,
  'A#4': 3729.31, 'B4': 3951.07,

  'C5': 4186.01, 'C#5': 4434.92, 'D5': 4698.63, 'D#5': 4978.03, 'E5': 5274.04,
  'F5': 5587.65, 'F#5': 5919.91, 'G5': 6271.93
};


// Audio context and destination
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const destination = audioContext.createMediaStreamDestination();
let micStream = null;
let mediaRecorder;
let chunks = [];

const micToggle = document.getElementById("micToggle");
const startRecBtn = document.getElementById("startRec");
const stopRecBtn = document.getElementById("stopRec");
const recordingIndicator = document.getElementById("recording-indicator");

// Visual note display
function updateNoteDisplay(note) {
  const display = document.getElementById("note-display");
  if (display) display.textContent = `🎵 ${note}`;
}

// Play tone + connect to destination (for recording)
function playSound(note) {
  const freq = noteFrequencies[note];
  if (!freq) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioContext.destination);
  gain.connect(destination);

  gain.gain.setValueAtTime(1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);

  osc.start();
  osc.stop(audioContext.currentTime + 1);
}

// Visual animation of pressed key
function setActiveKey(note) {
  const el = document.querySelector(`.key[data-note="${note}"]`);
  if (el) {
    el.classList.add("pressed");
    setTimeout(() => el.classList.remove("pressed"), 150);
  }
}

// Mouse click
document.querySelectorAll(".key").forEach(key => {
  key.addEventListener("mousedown", () => {
    const note = key.dataset.note;
    playSound(note);
    setActiveKey(note);
    updateNoteDisplay(note);
  });
});

// Keyboard press
document.addEventListener("keydown", (e) => {
  const note = keyMappings[e.key.toLowerCase()];
  if (note) {
    playSound(note);
    setActiveKey(note);
    updateNoteDisplay(note);
  }
});

// Dark mode toggle
const toggle = document.getElementById("darkToggle");
const darkMessage = document.getElementById("dark-mode-message");

toggle?.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  if (darkMessage) {
    darkMessage.style.display = toggle.checked ? "block" : "none";
  }
});

// 🎙 Start Recording (with optional mic)
startRecBtn?.addEventListener("click", async () => {
  chunks = [];

  if (micToggle?.checked) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
    } catch (err) {
      alert("Microphone permission denied.");
      console.error("Mic error:", err);
      return;
    }
  }

  mediaRecorder = new MediaRecorder(destination.stream);

  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.webm";
    a.click();

    chunks = [];
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }
    if (recordingIndicator) recordingIndicator.style.display = 'none';
  };

  mediaRecorder.start();
  if (recordingIndicator) recordingIndicator.style.display = 'inline-block';
});

// 🛑 Stop Recording
stopRecBtn?.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
});
