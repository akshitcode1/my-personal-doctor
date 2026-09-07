import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, Mic, MicOff, Volume2, Activity } from 'lucide-react'
import { useVoiceStore, VoiceStatus } from '../../stores/voiceStore'

interface Props {
  onExit: () => void
}

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle:       'Connecting…',
  listening:  'Listening…',
  processing: 'Transcribing…',
  thinking:   'Doctors consulting…',
  speaking:   'Doctor speaking',
}

const PALETTE: Record<VoiceStatus, { glow: string; orb: string; accent: string }> = {
  idle:       { glow: '#4a7bff', orb: 'linear-gradient(135deg,#4a7bff,#2248cc)', accent: '#4a7bff' },
  listening:  { glow: '#34d399', orb: 'linear-gradient(135deg,#34d399,#059669)', accent: '#34d399' },
  processing: { glow: '#fbbf24', orb: 'linear-gradient(135deg,#fbbf24,#d97706)', accent: '#fbbf24' },
  thinking:   { glow: '#a78bfa', orb: 'linear-gradient(135deg,#a78bfa,#7c3aed)', accent: '#a78bfa' },
  speaking:   { glow: '#60a5fa', orb: 'linear-gradient(135deg,#60a5fa,#2563eb)', accent: '#60a5fa' },
}

function useCallTimer() {
  const [s, setS] = useState(0)
  useEffect(() => { const id = setInterval(() => setS((v) => v + 1), 1000); return () => clearInterval(id) }, [])
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

function Waveform({ color }: { color: string }) {
  const bars = [0.4,0.8,1.2,0.6,1,0.5,1.3,0.7,0.9,0.4,1.1,0.6,0.8,0.5]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3, height:28 }}>
      {bars.map((h,i) => (
        <motion.div key={i}
          style={{ width:3, borderRadius:3, background:color, originY:0.5 }}
          animate={{ scaleY:[h*0.25, h, h*0.25] }}
          transition={{ duration:0.5+i*0.03, delay:i*0.05, repeat:Infinity, ease:'easeInOut' }}
          initial={{ height:24 }}
        />
      ))}
    </div>
  )
}

function SoundRings({ color }: { color: string }) {
  return <>
    {[0,1,2].map(i => (
      <motion.div key={i} style={{
        position:'absolute', borderRadius:'50%',
        border:`1px solid ${color}`,
        width: 80+i*28, height: 80+i*28,
        top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        pointerEvents:'none',
      }}
        animate={{ scale:[1,1.1,1], opacity:[0.7,0,0.7] }}
        transition={{ duration:1.8, delay:i*0.35, repeat:Infinity, ease:'easeInOut' }}
      />
    ))}
  </>
}

export default function VoiceConversationOverlay({ onExit }: Props) {
  const { voiceMode, voiceStatus, liveTranscript } = useVoiceStore()
  const timer = useCallTimer()
  const pal = PALETTE[voiceStatus]
  const isListening = voiceStatus === 'listening'
  const isSpeaking  = voiceStatus === 'speaking'
  const isThinking  = voiceStatus === 'thinking' || voiceStatus === 'processing'

  // Tiny canvas: floating dust inside the card
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    const pts = Array.from({length:28},()=>({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25,
      r:Math.random()*1.2+.4, o:Math.random()*.35+.08,
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      for(const p of pts){
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(160,200,255,${p.o})`; ctx.fill()
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=W; if(p.x>W)p.x=0
        if(p.y<0)p.y=H; if(p.y>H)p.y=0
      }
      raf=requestAnimationFrame(draw)
    }
    draw(); return()=>cancelAnimationFrame(raf)
  }, [voiceMode])

  return (
    <AnimatePresence>
      {voiceMode === 'conversation' && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onExit}
            style={{
              position:'fixed', inset:0, zIndex:9998,
              background:'rgba(4,8,20,0.55)',
              backdropFilter:'blur(4px)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
          {/* Glass popup card */}
          <motion.div
            initial={{ opacity:0, scale:0.88, y:24 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.88, y:24 }}
            transition={{ type:'spring', stiffness:340, damping:28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width:340,

              /* Liquid glass */
              background:'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
              backdropFilter:'blur(32px) saturate(180%)',
              WebkitBackdropFilter:'blur(32px) saturate(180%)',
              border:'1px solid rgba(255,255,255,0.14)',
              borderRadius:28,
              boxShadow:`
                0 0 0 1px rgba(255,255,255,0.06) inset,
                0 32px 80px rgba(0,0,0,0.55),
                0 0 60px ${pal.glow}22
              `,
              overflow:'hidden',
              display:'flex', flexDirection:'column', alignItems:'center',
              padding:'28px 24px 28px',
              gap:0,
            }}
          >
            {/* Particle canvas inside card */}
            <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.5, pointerEvents:'none' }} />

            {/* Glow accent behind orb */}
            <motion.div
              animate={{ opacity:[0.5,0.85,0.5] }}
              transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
              style={{
                position:'absolute', top:20, width:200, height:200, borderRadius:'50%',
                background:`radial-gradient(circle, ${pal.glow}33 0%, transparent 70%)`,
                filter:'blur(20px)', pointerEvents:'none',
              }}
            />

            {/* Header row */}
            <div style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Activity size={12} color={pal.accent} />
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                  Voice Call
                </span>
              </div>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontVariantNumeric:'tabular-nums', letterSpacing:'0.05em' }}>
                {timer}
              </span>
            </div>

            {/* Orb */}
            <div style={{ position:'relative', width:88, height:88, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
              {isListening && <SoundRings color={pal.glow} />}

              {/* Outer glow ring */}
              <motion.div style={{
                position:'absolute', width:88, height:88, borderRadius:'50%',
                border:`1px solid ${pal.glow}55`,
              }}
                animate={isListening||isSpeaking ? {scale:[1,1.08,1],opacity:[1,0.4,1]} : {scale:1,opacity:0.5}}
                transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut' }}
              />

              {/* Core */}
              <motion.div style={{
                width:68, height:68, borderRadius:'50%',
                background:pal.orb,
                boxShadow:`0 0 32px ${pal.glow}66, 0 0 64px ${pal.glow}33`,
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative', overflow:'hidden',
              }}
                animate={
                  isThinking  ? { rotate:360 } :
                  isListening ? { scale:[1,1.06,1] } :
                  isSpeaking  ? { scale:[1,1.04,0.97,1.04,1] } :
                  { scale:1 }
                }
                transition={
                  isThinking ? { duration:2, repeat:Infinity, ease:'linear' } :
                  { duration:1.4, repeat:Infinity, ease:'easeInOut' }
                }
              >
                {/* Shimmer */}
                <motion.div style={{
                  position:'absolute', inset:0, borderRadius:'50%',
                  background:'linear-gradient(130deg,rgba(255,255,255,0.22) 0%,transparent 55%)',
                }}
                  animate={{ rotate:[0,360] }}
                  transition={{ duration:3.5, repeat:Infinity, ease:'linear' }}
                />
                <span style={{ fontSize:26, position:'relative' }}>🩺</span>
              </motion.div>
            </div>

            {/* Doctor name */}
            <p style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.92)', marginBottom:4, position:'relative' }}>
              AI Medical Council
            </p>

            {/* Status */}
            <motion.div key={voiceStatus} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              style={{ position:'relative', textAlign:'center', marginBottom: isSpeaking ? 10 : 16 }}>
              <p style={{ fontSize:12, color:pal.accent, fontWeight:600, letterSpacing:'0.03em' }}>
                {STATUS_LABEL[voiceStatus]}
              </p>
            </motion.div>

            {/* Waveform (speaking) */}
            {isSpeaking && (
              <div style={{ marginBottom:12, position:'relative' }}>
                <Waveform color={pal.accent} />
              </div>
            )}

            {/* Live transcript */}
            <AnimatePresence>
              {liveTranscript && (
                <motion.div
                  initial={{opacity:0,y:6,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:0.97}}
                  style={{
                    width:'100%', padding:'10px 14px', marginBottom:16,
                    background:'rgba(255,255,255,0.06)',
                    border:'1px solid rgba(255,255,255,0.09)',
                    borderRadius:14,
                    fontSize:12, color:'rgba(255,255,255,0.65)',
                    lineHeight:1.55, textAlign:'center', position:'relative',
                  }}
                >
                  "{liveTranscript}"
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div style={{ width:'100%', height:1, background:'rgba(255,255,255,0.07)', marginBottom:20, position:'relative' }} />

            {/* Controls */}
            <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative' }}>
              {/* Mic status */}
              <div style={{
                width:44, height:44, borderRadius:'50%',
                background: isListening ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                border:`1px solid ${isListening ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {isListening
                  ? <Mic size={17} color="#34d399" />
                  : <MicOff size={17} color="rgba(255,255,255,0.3)" />
                }
              </div>

              {/* End call */}
              <motion.button
                onClick={onExit}
                whileHover={{ scale:1.07 }} whileTap={{ scale:0.93 }}
                style={{
                  width:56, height:56, borderRadius:'50%',
                  background:'linear-gradient(145deg,#ef4444,#b91c1c)',
                  border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 6px 24px rgba(239,68,68,0.5)',
                }}
              >
                <PhoneOff size={22} color="#fff" />
              </motion.button>

              {/* Speaker status */}
              <div style={{
                width:44, height:44, borderRadius:'50%',
                background: isSpeaking ? 'rgba(74,123,255,0.15)' : 'rgba(255,255,255,0.06)',
                border:`1px solid ${isSpeaking ? 'rgba(74,123,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Volume2 size={17} color={isSpeaking ? '#60a5fa' : 'rgba(255,255,255,0.3)'} />
              </div>
            </div>

            {/* Bottom hint */}
            <p style={{ marginTop:16, fontSize:10, color:'rgba(255,255,255,0.2)', position:'relative' }}>
              All specialists active · Full response in chat
            </p>
          </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  )
}
