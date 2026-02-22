import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecorder = ({ onTranscription, disabled }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>([20, 30, 25, 35, 20, 28, 22]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !recording) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);

    const bars = 7;
    const step = Math.floor(data.length / bars);
    const heights = Array.from({ length: bars }, (_, i) => {
      const val = data[i * step] || 0;
      return Math.max(8, (val / 255) * 48);
    });
    setBarHeights(heights);
    animFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [recording]);

  useEffect(() => {
    if (recording) {
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [recording, updateWaveform]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API for visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await transcribeAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      setTranscribedText("");

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionDenied(true);
      } else {
        toast.error("Could not access microphone");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setBarHeights([20, 30, 25, 35, 20, 28, 22]);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audio: base64, mimeType: blob.type },
      });

      if (error) throw error;
      const text = data?.text || "";
      setTranscribedText(text);
      onTranscription(text);
    } catch (err: any) {
      toast.error(err.message || "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const resetRecording = () => {
    setTranscribedText("");
    setRecordingTime(0);
    onTranscription("");
  };

  if (permissionDenied) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 text-center">
        <MicOff className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Microphone access needed for voice practice. You can still use text mode.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mic button + waveform */}
      <div className="flex flex-col items-center gap-4">
        {!recording && !transcribing && !transcribedText && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            disabled={disabled}
            className="relative h-20 w-20 rounded-full flex items-center justify-center bg-primary/20 border-2 border-primary transition-all duration-300"
            style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.4)" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Mic className="h-8 w-8 text-primary" />
          </motion.button>
        )}

        {recording && (
          <div className="flex flex-col items-center gap-3">
            {/* Waveform bars */}
            <div className="flex items-end gap-1 h-12">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  className="w-2 rounded-full bg-destructive"
                  animate={{ height: h }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>

            <span className="text-sm font-mono text-destructive">{formatTime(recordingTime)}</span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="h-16 w-16 rounded-full flex items-center justify-center bg-destructive/20 border-2 border-destructive"
              style={{ boxShadow: "0 0 25px hsl(var(--destructive) / 0.4)" }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-destructive"
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%" }}
              />
              <Square className="h-6 w-6 text-destructive" />
            </motion.button>
          </div>
        )}

        {transcribing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Transcribing...</span>
          </motion.div>
        )}
      </div>

      {/* Transcribed text */}
      <AnimatePresence>
        {transcribedText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="input-glow p-4">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{transcribedText}</p>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              {transcribedText.split(/\s+/).filter(Boolean).length} words
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetRecording}
              className="border-border/50 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-2 h-3 w-3" /> Record Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!recording && !transcribing && !transcribedText && (
        <p className="text-center text-xs text-muted-foreground">Tap the mic to start recording your answer</p>
      )}
    </div>
  );
};

export default VoiceRecorder;
