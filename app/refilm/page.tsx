'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/Container';
import { getSession } from '@/lib/session';
import { uploadSelfie, uploadVideo, getCurrentUser } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

type Mode = 'select' | 'photo' | 'video-record' | 'video-upload';

export default function RefilmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<Mode>('select');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Video recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/onboarding');
      return;
    }
    
    // CRITICAL SECURITY: Check payment status before allowing profile edits
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
    
    fetch(`${API_BASE}/payment/status`, {
      headers: { 'Authorization': `Bearer ${session.sessionToken}` },
    })
      .then(res => res.json())
      .then(paymentData => {
        // CRITICAL: Check if email verification is pending
        if (paymentData.pendingEmail && !paymentData.emailVerified) {
          console.log('[Refilm] Email verification pending - redirecting to onboarding');
          router.push('/onboarding');
          return;
        }
        
        const hasPaid = paymentData.paidStatus === 'paid' || paymentData.paidStatus === 'qr_verified' || paymentData.paidStatus === 'qr_grace_period';
        
        if (!hasPaid) {
          console.warn('[Refilm] Unpaid user attempted access - redirecting to waitlist');
          router.push('/waitlist');
          return;
        }
        
        // User has paid, fetch current user data
        getCurrentUser(session.sessionToken)
          .then((data) => {
            setCurrentUser(data);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Failed to fetch user:', err);
            setLoading(false);
          });
      })
      .catch(err => {
        console.error('[Refilm] Payment check failed:', err);
        router.push('/onboarding');
      });
  }, [router]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Front camera for selfies
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied');
    }
  };

  const capturePhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // CRITICAL: Mirror the image (flip horizontally) to match preview
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0);
      ctx.restore();
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          setUploading(true);
          try {
            const session = getSession();
            if (session) {
              await uploadSelfie(session.sessionToken, blob);
              // Stop camera and clear stream
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
                console.log('[Refilm] Camera stopped after photo capture');
              }
              setCapturedPhoto(null); // Clear preview
              setMode('select');
              setSuccess('Photo updated successfully!');
              setTimeout(() => setSuccess(''), 3000);
              // Refresh user data
              const userData = await getCurrentUser(session.sessionToken);
              setCurrentUser(userData);
            }
          } catch (err: any) {
            setError(err.message);
          } finally {
            setUploading(false);
          }
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const startVideoRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      let mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported('video/webm') && MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopVideoRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError('Camera/microphone access denied');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    // Stop camera stream when recording stops
    if (stream) {
      console.log('[Refilm] Stopping camera stream after recording');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    try {
      const session = getSession();
      if (session) {
        await uploadVideo(session.sessionToken, file);
        setMode('select');
        setSuccess('Video updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        // Refresh user data
        const userData = await getCurrentUser(session.sessionToken);
        setCurrentUser(userData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, { 
        type: mediaRecorderRef.current?.mimeType || 'video/webm' 
      });

      setUploading(true);
      const session = getSession();
      if (session) {
        uploadVideo(session.sessionToken, blob)
          .then(async () => {
            // Stop camera and clear stream after video upload
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              setStream(null);
              console.log('[Refilm] Camera stopped after video upload');
            }
            setMode('select');
            setSuccess('Video updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
            // Refresh user data
            const userData = await getCurrentUser(session.sessionToken);
            setCurrentUser(userData);
          })
          .catch((err) => setError(err.message))
          .finally(() => setUploading(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordedChunks, isRecording]);

  useEffect(() => {
    if (mode === 'photo') {
      startCamera();
    } else if (mode === 'video-record') {
      // Video recording starts camera separately via startVideoRecording()
    } else {
      // Clean up camera when switching to other modes (select, video-upload)
      if (stream) {
        console.log('[Refilm] Stopping camera stream on mode change to:', mode);
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (stream) {
        console.log('[Refilm] Stopping camera stream on unmount');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="text-[#eaeaf0]">Loading...</div>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen bg-[#0a0a0c] py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl space-y-8 motion-reduce:opacity-100 motion-reduce:translate-y-0"
        >
          <div className="flex items-center justify-between">
            <h1 className="font-playfair text-4xl font-bold text-[#eaeaf0] sm:text-5xl">
              Profile
            </h1>
            <Link
              href="/main"
              className="focus-ring rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-[#eaeaf0] transition-all hover:bg-white/20"
            >
              ← Back
            </Link>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-green-500/20 p-4 text-center text-sm text-green-300"
            >
              {success}
            </motion.div>
          )}

          {mode === 'select' && currentUser && (
            <>
              {/* User Information */}
              <div className="rounded-2xl border border-[#ffc46a]/30 bg-[#ffc46a]/10 p-6">
                <h2 className="mb-4 font-playfair text-2xl font-bold text-[#ffc46a]">
                  Your Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 text-[#eaeaf0]/90">
                  <div>
                    <span className="text-sm text-[#eaeaf0]/60">Name:</span>
                    <p className="font-bold">{currentUser.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[#eaeaf0]/60">Gender:</span>
                    <p className="font-bold capitalize">{currentUser.gender}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[#eaeaf0]/60">Account Type:</span>
                    <p className="font-bold capitalize">{currentUser.accountType}</p>
                  </div>
                  {currentUser.email && (
                    <div>
                      <span className="text-sm text-[#eaeaf0]/60">Email:</span>
                      <p className="font-bold">{currentUser.email}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-[#eaeaf0]/60">Total Call Time:</span>
                    <p className="font-bold">
                      {Math.floor((currentUser.timerTotalSeconds || 0) / 60)}m {(currentUser.timerTotalSeconds || 0) % 60}s
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-[#eaeaf0]/60">Total Sessions:</span>
                    <p className="font-bold">{currentUser.sessionCount || 0} calls</p>
                  </div>
                  <div>
                    <span className="text-sm text-[#eaeaf0]/60">User ID:</span>
                    <p className="font-mono text-xs">{currentUser.userId.substring(0, 16)}...</p>
                  </div>
                  <div>
                    <span className="text-sm text-[#eaeaf0]/60">Member Since:</span>
                    <p className="text-sm">{new Date(currentUser.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <p className="text-lg text-[#eaeaf0]/70">
                Your current profile
              </p>

              {/* Current Profile Preview */}
              <div className="flex justify-center">
                {/* Current Photo - Centered */}
                <div className="rounded-2xl bg-white/5 p-6 shadow-inner w-full max-w-md">
                  <h3 className="mb-4 font-playfair text-xl font-bold text-[#eaeaf0] text-center">
                    Profile Photo
                  </h3>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                    {currentUser.selfieUrl ? (
                      <Image
                        src={currentUser.selfieUrl}
                        alt="Your profile photo"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">
                        👤
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-lg text-[#eaeaf0]/70 text-center">
                Update your profile photo
              </p>

              <div className="flex justify-center">
                <button
                  onClick={() => setMode('photo')}
                  className="focus-ring group rounded-2xl bg-[#ffc46a]/10 border-2 border-[#ffc46a]/30 p-8 text-center shadow-inner transition-all hover:scale-105 hover:bg-[#ffc46a]/20 max-w-md w-full"
                >
                  <div className="mb-4 text-5xl">📸</div>
                  <h3 className="mb-2 font-playfair text-xl font-bold text-[#ffc46a]">
                    Update Photo
                  </h3>
                  <p className="text-sm text-[#eaeaf0]/70">
                    Camera only (no uploads)
                  </p>
                </button>
              </div>
            </>
          )}

          {mode === 'photo' && (
            <div className="space-y-6">
              {/* Photo Preview or Live Camera */}
              {capturedPhoto ? (
                <>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-black shadow-inner">
                    <img 
                      src={capturedPhoto} 
                      alt="Captured" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  {error && (
                    <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                      {error}
                    </div>
                  )}
                  
                  {uploading && (
                    <div className="text-center text-sm text-[#ffc46a]">
                      Uploading photo...
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setCapturedPhoto(null);
                        setError('');
                        // Restart camera
                        startCamera();
                      }}
                      disabled={uploading}
                      className="focus-ring flex-1 rounded-xl bg-white/10 px-6 py-3 font-medium text-[#eaeaf0] transition-all hover:bg-white/20 disabled:opacity-50"
                    >
                      Retake
                    </button>
                    <button
                      onClick={async () => {
                        if (!capturedPhoto) return;
                        
                        setUploading(true);
                        setError('');
                        
                        try {
                          const session = getSession();
                          if (!session) {
                            setError('Not logged in');
                            return;
                          }
                          
                          // Convert data URL to blob
                          const res = await fetch(capturedPhoto);
                          const blob = await res.blob();
                          
                          // Upload
                          await uploadSelfie(session.sessionToken, blob);
                          
                          console.log('[Refilm] ✅ Photo uploaded successfully');
                          
                          // Clear state
                          setCapturedPhoto(null);
                          setMode('select');
                          setSuccess('Photo updated successfully!');
                          setTimeout(() => setSuccess(''), 3000);
                          
                          // Refresh user data
                          const userData = await getCurrentUser(session.sessionToken);
                          setCurrentUser(userData);
                        } catch (err: any) {
                          console.error('[Refilm] Upload error:', err);
                          setError(err.message || 'Upload failed');
                        } finally {
                          setUploading(false);
                        }
                      }}
                      disabled={uploading}
                      className="focus-ring flex-1 rounded-xl bg-[#ffc46a] px-6 py-3 font-medium text-[#0a0a0c] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Use This Photo'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-black shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  {error && (
                    <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        stream?.getTracks().forEach(track => track.stop());
                        setMode('select');
                      }}
                      className="focus-ring flex-1 rounded-xl bg-white/10 px-6 py-3 font-medium text-[#eaeaf0] transition-all hover:bg-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Capture to preview first
                        if (!canvasRef.current || !videoRef.current) return;
                        const canvas = canvasRef.current;
                        const video = videoRef.current;
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(video, 0, 0);
                          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                          setCapturedPhoto(dataUrl);
                          // Stop camera after capture
                          stream?.getTracks().forEach(track => track.stop());
                          setStream(null);
                        }
                      }}
                      disabled={!stream}
                      className="focus-ring flex-1 rounded-xl bg-[#ffc46a] px-6 py-3 font-medium text-[#0a0a0c] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      Capture Photo
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Video recording mode removed - photo only */}
          {mode === 'video-record' && false && (
            <div className="space-y-6">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                    <span className="font-mono text-sm font-medium text-white">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')} / 1:00
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {!isRecording && recordedChunks.length === 0 && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setMode('select')}
                    className="focus-ring flex-1 rounded-xl bg-white/10 px-6 py-3 font-medium text-[#eaeaf0] transition-all hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startVideoRecording}
                    disabled={uploading}
                    className="focus-ring flex-1 rounded-xl bg-[#ffc46a] px-6 py-3 font-medium text-[#0a0a0c] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Start recording
                  </button>
                </div>
              )}

                  {isRecording && (
                    <button
                      onClick={stopVideoRecording}
                      disabled={recordingTime < 5}
                      className={`focus-ring w-full rounded-xl px-6 py-3 font-medium shadow-sm transition-opacity ${
                        recordingTime < 5 
                          ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed opacity-50'
                          : 'bg-red-500 text-white hover:opacity-90'
                      }`}
                    >
                      {recordingTime < 5 
                        ? `Keep recording... (${5 - recordingTime}s minimum)` 
                        : 'Stop recording'}
                    </button>
                  )}

              {uploading && (
                <div className="text-center text-sm text-[#eaeaf0]/70">
                  Uploading video...
                </div>
              )}
            </div>
          )}
        </motion.div>
      </Container>
    </main>
  );
}
