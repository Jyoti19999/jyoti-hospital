import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Eye, Stethoscope, Clock, Users, ArrowRightLeft } from 'lucide-react';
import QRCode from 'qrcode';

/* ── Constants ── */
const DISPLAY_IMAGES = [
  '/display/ddisplay1.png',
  '/display/ddisplay2.png',
  '/display/ddisplay3.png',
  '/display/ddisplay4.png',
  '/display/ddisplay5.png',
  '/display/ddisplay6.png',
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const SOCKET_URL = API_URL.replace('/api/v1', '');
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

const STATUS_COLORS = {
  WAITING: 'bg-amber-500/90',
  CALLED: 'bg-emerald-500/90',
  IN_PROGRESS: 'bg-blue-500/90',
};
const STATUS_LABELS = {
  WAITING: 'Waiting',
  CALLED: 'Called',
  IN_PROGRESS: 'In Progress',
};
const PRIORITY_COLORS = {
  EMERGENCY: 'bg-red-600', PRIORITY: 'bg-orange-500', CHILDREN: 'bg-sky-500',
  SENIORS: 'bg-emerald-600', ROUTINE: 'bg-slate-500', FOLLOWUP: 'bg-violet-500',
  PREPOSTOP: 'bg-pink-500', REFERRAL: 'bg-teal-500', LONGWAIT: 'bg-yellow-600',
};

/* ── Font helpers (inline styles) ── */
const fontDisplay = { fontFamily: '"Space Grotesk", sans-serif' };
const fontBody    = { fontFamily: '"Outfit", sans-serif' };

/* ── Waiting room notices ── */
const NOTICES = [
  'Please maintain silence in the waiting area.',
  'Kindly keep your mobile phone on silent mode.',
  'Please be seated and wait for your token to be called.',
  'Children must be accompanied by a guardian at all times.',
  'Food and beverages are not permitted in the examination rooms.',
  'Drinking water is available at the reception counter.',
  'If you were given eye drops, please avoid touching your eyes.',
  'Do not drive after dilation — bring someone to assist you.',
  'Please keep your appointment slip and ID ready for verification.',
  'Feeling unwell? Inform reception before seeing the doctor.',
  'Priority assistance is available for seniors and differently-abled patients.',
  'Hand sanitiser is available at the entrance. Please use it.',
];

/* ── Helpers ── */
function formatWaitTime(joinedAt) {
  if (!joinedAt) return '--';
  const diff = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 60000);
  if (diff < 1) return '<1m';
  if (diff >= 60) return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  return `${diff}m`;
}

function capitalize(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/* ── Animated card wrapper ── */
const PatientCard = ({ patient, isFirst, idx }) => {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const prevIdRef = useRef(patient.queueEntryId || patient.id);

  useEffect(() => {
    // trigger enter animation
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Detect when the patient ID changes (removal/replacement)
  useEffect(() => {
    const curId = patient.queueEntryId || patient.id;
    if (prevIdRef.current && prevIdRef.current !== curId) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        prevIdRef.current = curId;
      }, 400);
      return () => clearTimeout(t);
    }
    prevIdRef.current = curId;
  }, [patient.queueEntryId, patient.id]);

  const rawName = patient.patient?.fullName
    || `${patient.patient?.firstName || patient.firstName || ''} ${patient.patient?.lastName || patient.lastName || ''}`.trim()
    || patient.name
    || 'Patient';
  const name = capitalize(rawName);
  const token = patient.appointment?.tokenNumber || patient.token || `#${patient.queueNumber}`;

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        exiting ? 'dd-card-exit' : mounted ? 'dd-card-enter' : 'dd-card-init'
      } ${
        isFirst
          ? 'bg-white/[0.18] border-yellow-400/60 ring-2 ring-yellow-400/30'
          : 'bg-white/[0.08] border-white/[0.08]'
      }`}
      style={{ transitionDelay: `${idx * 80}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Queue number */}
        <div
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 ${
            isFirst ? 'bg-yellow-400 text-slate-900 dd-pulse-soft' : 'bg-white/15 text-white'
          }`}
          style={{ ...fontDisplay, fontWeight: 800, fontSize: '1.25rem' }}
        >
          {patient.queueNumber || idx + 1}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-white truncate"
            style={{ ...fontBody, fontWeight: 500, fontSize: '1.1rem', letterSpacing: '0.02em' }}
          >
            {name}
          </p>
          {/* <p className="text-blue-200/80 mt-0.5" style={{ ...fontBody, fontWeight: 300, fontSize: '0.85rem', letterSpacing: '0.06em' }}>
            TOKEN&ensp;<span className="text-white/90" style={{ fontWeight: 500 }}>{token}</span>
          </p> */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-[10px] uppercase font-bold px-2 py-[3px] rounded-full text-white tracking-wider ${STATUS_COLORS[patient.status] || 'bg-slate-500/80'}`}
              style={fontBody}
            >
              {STATUS_LABELS[patient.status] || patient.status}
            </span>
            {patient.priorityLabel && patient.priorityLabel !== 'ROUTINE' && (
              <span
                className={`text-[10px] uppercase font-bold px-2 py-[3px] rounded-full text-white tracking-wider ${PRIORITY_COLORS[patient.priorityLabel] || 'bg-slate-500'}`}
                style={fontBody}
              >
                {patient.priorityLabel}
              </span>
            )}
          </div>
        </div>

        {/* Wait time */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-yellow-300">
            <Clock className="h-4 w-4" />
            <span style={{ ...fontDisplay, fontWeight: 600, fontSize: '0.85rem' }}>
              {formatWaitTime(patient.joinedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
const DigitalDisplayPage = () => {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [fadeImage, setFadeImage] = useState(true);
  const [activeQueue, setActiveQueue] = useState('optometrist');
  const [optometristQueue, setOptometristQueue] = useState([]);
  const [ophthalmologistQueue, setOphthalmologistQueue] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [noticeIdx, setNoticeIdx] = useState(0);
  const [noticeFade, setNoticeFade] = useState(true);
  const socketRef = useRef(null);

  // ── Clock ──
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Rotating notices (every 5s) ──
  useEffect(() => {
    const t = setInterval(() => {
      setNoticeFade(false);
      setTimeout(() => {
        setNoticeIdx((prev) => (prev + 1) % NOTICES.length);
        setNoticeFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // ── Background image rotation (7s) ──
  useEffect(() => {
    const t = setInterval(() => {
      setFadeImage(false);
      setTimeout(() => {
        setCurrentImageIdx((prev) => (prev + 1) % DISPLAY_IMAGES.length);
        setFadeImage(true);
      }, 600);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // ── Generate QR code once ──
  useEffect(() => {
    const selfCheckinUrl = `${BASE_URL}/self-checkin`;
    QRCode.toDataURL(selfCheckinUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl).catch(console.error);
  }, []);

  // ── Flash QR overlay every 30s for 6s ──
  useEffect(() => {
    const show = () => {
      setShowQR(true);
      setTimeout(() => setShowQR(false), 6000);
    };
    const initial = setTimeout(show, 10000);
    const interval = setInterval(show, 30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);

  // ── Fetch queues ──
  const fetchOptometristQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/display/queue/optometrist`);
      const json = await res.json();
      if (json.success) setOptometristQueue(json.data?.queueEntries || []);
    } catch (e) { console.error('Failed to fetch optometrist queue', e); }
  }, []);

  const fetchOphthalmologistQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/display/queue/ophthalmologist`);
      const json = await res.json();
      if (json.success) setOphthalmologistQueue(json.data?.queueEntries || []);
    } catch (e) { console.error('Failed to fetch ophthalmologist queue', e); }
  }, []);

  useEffect(() => {
    fetchOptometristQueue();
    fetchOphthalmologistQueue();
  }, [fetchOptometristQueue, fetchOphthalmologistQueue]);

  // ── WebSocket ──
  useEffect(() => {
    const s = io(SOCKET_URL, {
      autoConnect: true, reconnection: true,
      reconnectionDelay: 2000, reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = s;

    const joinRooms = () => {
      s.emit('queue:join-optometrist');
      s.emit('queue:join-ophthalmologist');
    };
    const refetchAll = () => { fetchOptometristQueue(); fetchOphthalmologistQueue(); };

    s.on('connect', () => { console.log('📺 Display socket connected:', s.id); joinRooms(); });
    s.on('queue:updated', refetchAll);
    s.on('queue:reordered', refetchAll);
    s.on('queue:patient-assigned', refetchAll);
    s.on('queue:patient-removed', refetchAll);
    s.on('queue:patient-on-hold', refetchAll);
    s.on('queue:patient-available', refetchAll);
    s.on('queue:patient-processed', refetchAll);
    s.on('reconnect', () => { joinRooms(); refetchAll(); });

    return () => { s.disconnect(); };
  }, [fetchOptometristQueue, fetchOphthalmologistQueue]);

  // ── Next-in-line ──
  const getNextPatients = useCallback((queue) => {
    return queue
      .filter((p) => p.status === 'WAITING' || p.status === 'CALLED' || p.status === 'IN_PROGRESS')
      .sort((a, b) => {
        const order = { IN_PROGRESS: 0, CALLED: 1, WAITING: 2 };
        const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
        if (diff !== 0) return diff;
        return (a.queueNumber || 999) - (b.queueNumber || 999);
      })
      .slice(0, 3);
  }, []);

  const displayQueue = activeQueue === 'optometrist' ? optometristQueue : ophthalmologistQueue;
  const nextPatients = useMemo(() => getNextPatients(displayQueue), [displayQueue, getNextPatients]);
  const waitingCount = displayQueue.filter((p) => p.status === 'WAITING').length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* ── Scoped Styles ── */}
      <style>{`
        /* ── Card spring animations ── */
        .dd-card-init {
          opacity: 0;
          transform: translateY(24px) scaleY(0.92);
        }
        .dd-card-enter {
          opacity: 1;
          transform: translateY(0) scaleY(1);
          transition: opacity 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
                      transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .dd-card-exit {
          opacity: 0;
          transform: translateX(40px) scaleX(0.88) scaleY(0.94);
          transition: opacity 0.35s ease-out,
                      transform 0.4s cubic-bezier(0.6, -0.28, 0.74, 0.05);
        }

        /* gentle pulsing glow for #1 */
        .dd-pulse-soft {
          animation: ddPulse 2.2s ease-in-out infinite;
        }
        @keyframes ddPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(250,204,21,0.45); }
          50%      { box-shadow: 0 0 18px 4px rgba(250,204,21,0.25); }
        }

        /* QR overlay entrance */
        .dd-qr-in  { animation: ddQrIn  0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
        .dd-qr-bg  { animation: ddFadeIn 0.5s ease both; }
        @keyframes ddQrIn  { from { opacity:0; transform:scale(0.8) translateY(30px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes ddFadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* ── Background Image ── */}
      <img
        src={DISPLAY_IMAGES[currentImageIdx]}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${fadeImage ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-black/20" />

      {/* ── Right Panel ── */}
      <div
        className="absolute right-0 top-0 h-full w-[35%] min-w-[340px] flex flex-col"
        style={{
          background: 'rgba(10, 18, 36, 0.6)',
          backdropFilter: 'blur(22px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.5)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {activeQueue === 'optometrist'
                ? <Stethoscope className="h-5 w-5 text-cyan-400" />
                : <Eye className="h-5 w-5 text-violet-400" />
              }
              <h2
                className="text-white uppercase tracking-[0.12em]"
                style={{ ...fontBody, fontWeight: 600, fontSize: '1.05rem' }}
              >
                {activeQueue === 'optometrist' ? 'Optometrist Queue' : 'Ophthalmologist Queue'}
              </h2>
            </div>
            <div
              className="text-yellow-300 tracking-[0.15em]"
              style={{ ...fontDisplay, fontWeight: 700, fontSize: '1.35rem' }}
            >
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <Users className="h-3.5 w-3.5 text-blue-300/70" />
            <span
              className="text-blue-200/70 uppercase tracking-[0.1em]"
              style={{ ...fontBody, fontWeight: 400, fontSize: '0.75rem' }}
            >
              {waitingCount} Waiting
            </span>
          </div>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-hidden px-5 py-5 space-y-3">
          {nextPatients.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/40" style={{ ...fontBody, fontWeight: 300, fontSize: '1.1rem', letterSpacing: '0.08em' }}>
                No Patients In Queue
              </p>
            </div>
          )}
          {nextPatients.map((patient, idx) => (
            <PatientCard
              key={patient.queueEntryId || patient.id || idx}
              patient={patient}
              isFirst={idx === 0}
              idx={idx}
            />
          ))}
        </div>

        {/* Notice ticker */}
        <div className="px-5 pb-3">
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p
              className="text-blue-100/90 leading-snug text-center"
              style={{
                ...fontBody,
                fontWeight: 500,
                fontSize: '0.85rem',
                letterSpacing: '0.04em',
                opacity: noticeFade ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              {NOTICES[noticeIdx]}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="px-5 pb-5 pt-0">
          <button
            onClick={() => setActiveQueue((q) => q === 'optometrist' ? 'ophthalmologist' : 'optometrist')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white transition-all
              bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.1] active:scale-[0.97]"
            style={{ ...fontBody, fontWeight: 500, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            <ArrowRightLeft className="h-4 w-4" />
            {activeQueue === 'optometrist' ? 'View Ophthalmologist Queue' : 'View Optometrist Queue'}
          </button>
        </div>
      </div>

      {/* ── QR Overlay ── */}
      {showQR && qrDataUrl && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center dd-qr-bg"
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
        >
          <div className="text-center space-y-7 px-4 dd-qr-in">
            <h2
              className="text-white leading-tight max-w-lg mx-auto"
              style={{ ...fontBody, fontWeight: 600, fontSize: '2.4rem', letterSpacing: '0.03em' }}
            >
              Already Have An Appointment?
            </h2>
            <p
              className="text-blue-200/90"
              style={{ ...fontBody, fontWeight: 300, fontSize: '1.25rem', letterSpacing: '0.06em' }}
            >
              Scan the QR to do a Self Check-In
            </p>
            <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl">
              <img src={qrDataUrl} alt="Self Check-in QR" className="w-52 h-52" />
            </div>
            <p
              className="text-blue-300/60 animate-pulse"
              style={{ ...fontDisplay, fontWeight: 400, fontSize: '0.75rem', letterSpacing: '0.14em' }}
            >
              CLOSING AUTOMATICALLY
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalDisplayPage;
