import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import {
  FaHeart,
  FaGift,
  FaPlay,
  FaPause,
  FaMicrophone,
  FaInfinity,
} from 'react-icons/fa';

interface ThemeVoiceGiftProps {
  roomId?: string;
  orderData?: {
    sender_name: string;
    receiver_name: string;
    message: string;
    audio_url: string;
  };
}

type Screen = 'waiting' | 'interaction' | 'reveal' | 'play_audio';

export default function ThemeVoiceGift({ roomId: propRoomId, orderData: propOrderData }: ThemeVoiceGiftProps) {
  const [screen, setScreen] = useState<Screen>('waiting');
  const [sliderValue, setSliderValue] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const channelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const roomId = propRoomId || new URLSearchParams(window.location.search).get('room');

  const data = propOrderData || {
    sender_name: 'أحمد',
    receiver_name: 'سارة',
    message: 'من بين كل الناس، اختاريتج إنتِ.. أحبج اليوم وباجر وللأبد.',
    audio_url: '',
  };

  useEffect(() => {
    let mounted = true;
    let room: any = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    if (!roomId) {
      fallbackTimer = setTimeout(() => {
        if (mounted) {
          setScreen('interaction');
        }
      }, 1800);

      return () => {
        mounted = false;
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
      };
    }

    room = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: 'user_' + Math.random().toString(36).substring(2, 10),
        },
      },
    });

    channelRef.current = room;

    room.on('presence', { event: 'sync' }, () => {
      if (!mounted) return;
      const presenceState = room.presenceState();
      const usersCount = Object.keys(presenceState).length;

      setScreen((current) => {
        if (current === 'reveal' || current === 'play_audio') {
          return current;
        }
        return usersCount >= 2 ? 'interaction' : 'waiting';
      });
    });

    room.on('broadcast', { event: 'merged' }, () => {
      if (!mounted) return;
      setSliderValue(100);
      setScreen('reveal');
    });

    room.subscribe(async (status: string) => {
      if (status !== 'SUBSCRIBED') return;
      try {
        await room.track({ online_at: new Date().toISOString() });
      } catch (error) {
        console.error('Presence tracking error:', error);
      }
    });

    return () => {
      mounted = false;
      try {
        if (room) {
          room.untrack();
          room.unsubscribe();
        }
      } catch (error) {
        console.error('Room cleanup error:', error);
      }
      channelRef.current = null;
    };
  }, [roomId]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setSliderValue(value);

    if (value >= 100) {
      setScreen('reveal');
      const channel = channelRef.current;

      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'merged',
          payload: { success: true },
        }).catch((error: unknown) => {
          console.error('Broadcast error:', error);
        });
      }
    }
  };

  const handleSliderEnd = () => {
    if (sliderValue < 100) {
      setSliderValue(0);
    }
  };

  const openAudio = () => {
    setScreen('play_audio');
    window.setTimeout(() => {
      const audio = audioRef.current;
      if (!audio || !data.audio_url) return;

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error: unknown) => {
        console.warn('Audio autoplay was blocked:', error);
      });
    }, 250);
  };

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio || !data.audio_url) return;

    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error: unknown) => {
        console.error('Audio play error:', error);
      });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      const value = (audio.currentTime / audio.duration) * 100;
      setProgress(Math.min(100, Math.max(0, value)));
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="love-v2">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700;800;900&display=swap');

        .love-v2, .love-v2 * { box-sizing: border-box; }

        :global(body), :global(html) { margin: 0; padding: 0; width: 100%; height: 100%; }

        .love-v2 {
          --love-red: #e11d48;
          --love-red-dark: #be123c;
          --love-red-light: #fff1f3;
          --love-pink: #ffe4e9;
          --love-text: #171717;
          --love-muted: #777777;

          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw; height: 100vh;
          overflow: hidden; display: flex; align-items: center; justify-content: center;
          padding: 24px;
          background: radial-gradient(circle at 10% 10%, rgba(225, 29, 72, 0.12), transparent 30%),
                      radial-gradient(circle at 90% 90%, rgba(251, 113, 133, 0.16), transparent 32%),
                      linear-gradient(145deg, #ffffff 0%, #fffafb 48%, #fff2f4 100%);
          color: var(--love-text); direction: rtl; font-family: 'Tajawal', sans-serif;
          margin: 0;
        }

        .love-v2-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .love-v2-circle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(225, 29, 72, 0.10), rgba(225, 29, 72, 0)); filter: blur(5px); }
        .love-v2-circle-one { width: 380px; height: 380px; top: -190px; left: -120px; animation: loveFloatOne 12s ease-in-out infinite alternate; }
        .love-v2-circle-two { width: 450px; height: 450px; bottom: -240px; right: -170px; animation: loveFloatTwo 14s ease-in-out infinite alternate; }

        @keyframes loveFloatOne { from { transform: translate(0, 0); } to { transform: translate(55px, 35px); } }
        @keyframes loveFloatTwo { from { transform: translate(0, 0); } to { transform: translate(-45px, -30px); } }

        .love-v2-brand { position: absolute; top: 25px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; color: var(--love-red); font-size: 13px; font-weight: 900; white-space: nowrap; z-index: 20; }
        .love-v2-brand-icon { width: 29px; height: 29px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #ffffff; color: var(--love-red); box-shadow: 0 7px 22px rgba(225, 29, 72, 0.14); animation: loveHeartBeat 2.2s infinite; }

        @keyframes loveHeartBeat { 0%, 100% { transform: scale(1); } 12% { transform: scale(1.12); } 24% { transform: scale(1); } }

        .love-v2-card { position: relative; z-index: 5; width: min(100%, 470px); min-height: 450px; display: flex; align-items: center; justify-content: center; padding: 42px 30px 32px; background: rgba(255, 255, 255, 0.96); border: 1px solid rgba(225, 29, 72, 0.09); border-radius: 34px; box-shadow: 0 30px 80px rgba(190, 18, 60, 0.10), 0 8px 25px rgba(0, 0, 0, 0.035); overflow: hidden; }
        .love-v2-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, transparent, var(--love-red), #fb7185, var(--love-red), transparent); }
        .love-v2-content { width: 100%; text-align: center; animation: loveContentIn 0.55s ease both; }

        @keyframes loveContentIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .love-v2-couple { display: flex; align-items: center; justify-content: center; gap: 13px; margin-bottom: 30px; }
        .love-v2-name { color: #222222; font-size: 14px; font-weight: 800; }
        .love-v2-heart { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 50%; background: linear-gradient(135deg, var(--love-red), var(--love-red-dark)); color: #ffffff; box-shadow: 0 9px 25px rgba(225, 29, 72, 0.25); animation: loveHeartBeat 2.2s infinite; }

        .love-v2-big-heart { width: 105px; height: 105px; margin: 0 auto 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(145deg, #ffffff, var(--love-red-light)); border: 1px solid var(--love-pink); color: var(--love-red); font-size: 32px; box-shadow: 0 18px 45px rgba(225, 29, 72, 0.13); animation: loveWaitingPulse 2.5s infinite; }
        @keyframes loveWaitingPulse { 0%, 100% { transform: scale(1); box-shadow: 0 18px 45px rgba(225, 29, 72, 0.12); } 50% { transform: scale(1.035); box-shadow: 0 22px 55px rgba(225, 29, 72, 0.20); } }

        .love-v2-title { margin: 0 0 9px; color: #111111; font-size: 28px; font-weight: 900; }
        .love-v2-subtitle { margin: 0; color: var(--love-muted); font-size: 14px; font-weight: 500; line-height: 1.9; }

        .love-v2-dots { display: flex; justify-content: center; gap: 6px; margin-top: 24px; }
        .love-v2-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--love-red); animation: loveDot 1.4s infinite; }
        .love-v2-dot:nth-child(2) { animation-delay: 0.18s; }
        .love-v2-dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes loveDot { 0%, 70%, 100% { opacity: 0.25; transform: scale(0.8); } 35% { opacity: 1; transform: scale(1.15); } }

        .love-v2-online { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; margin-bottom: 17px; border-radius: 30px; background: var(--love-red-light); border: 1px solid var(--love-pink); color: var(--love-red-dark); font-size: 12px; font-weight: 900; }
        .love-v2-online-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.10); }

        .love-v2-interaction-title { margin: 0 0 8px; color: #111111; font-size: 27px; font-weight: 900; }
        .love-v2-interaction-text { margin: 0; color: var(--love-muted); font-size: 14px; line-height: 1.9; }

        .love-v2-slider { position: relative; width: 100%; height: 74px; margin-top: 30px; }
        .love-v2-track { position: absolute; top: 50%; left: 14px; right: 14px; height: 5px; transform: translateY(-50%); border-radius: 10px; background: #f5d9de; }
        
        /* 🌟 التعديل السحري هنا: جعلنا التعبئة تبدأ من اليسار (left) لتطابق حركة الزر من اليسار لليمين */
        .love-v2-fill { position: absolute; top: 50%; left: 14px; height: 5px; transform: translateY(-50%); border-radius: 10px; background: linear-gradient(90deg, var(--love-red), #fb7185); box-shadow: 0 0 16px rgba(225, 29, 72, 0.25); z-index: 1; transition: width 0.08s linear; }
        
        .love-v2-slider input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; appearance: none; -webkit-appearance: none; background: transparent; outline: none; z-index: 3; cursor: grab; }
        .love-v2-slider input:active { cursor: grabbing; }
        
        .love-v2-slider input::-webkit-slider-thumb { 
          appearance: none; -webkit-appearance: none; width: 55px; height: 55px; border-radius: 50%; 
          border: 4px solid #ffffff; 
          background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' fill='%23ffffff'%3E%3Cpath d='M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z'/%3E%3C/svg%3E") center/45% no-repeat,
                      linear-gradient(135deg, var(--love-red), var(--love-red-dark)); 
          box-shadow: 0 9px 25px rgba(225, 29, 72, 0.30); cursor: grab; 
        }
        .love-v2-slider input::-moz-range-thumb {
          width: 47px; height: 47px; border-radius: 50%; border: 4px solid #ffffff; 
          background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' fill='%23ffffff'%3E%3Cpath d='M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z'/%3E%3C/svg%3E") center/45% no-repeat,
                      linear-gradient(135deg, var(--love-red), var(--love-red-dark)); 
          box-shadow: 0 9px 25px rgba(225, 29, 72, 0.30); cursor: grab;
        }

        .love-v2-gift { width: 105px; height: 105px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border-radius: 30px; background: linear-gradient(135deg, var(--love-red), var(--love-red-dark)); color: #ffffff; font-size: 34px; box-shadow: 0 20px 45px rgba(225, 29, 72, 0.25); animation: loveGiftFloat 3s ease-in-out infinite; }
        @keyframes loveGiftFloat { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-7px) rotate(1deg); } }

        .love-v2-from-to { margin-bottom: 17px; color: #999999; font-size: 13px; font-weight: 800; }
        .love-v2-from-to strong { color: var(--love-red-dark); }
        .love-v2-message { max-width: 400px; margin: 0 auto 28px; color: #171717; font-family: 'Amiri', serif; font-size: 30px; font-weight: 700; line-height: 1.85; }

        .love-v2-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-width: 185px; padding: 15px 28px; border: none; border-radius: 50px; background: linear-gradient(135deg, var(--love-red), var(--love-red-dark)); color: #ffffff; font-size: 16px; font-weight: 900; cursor: pointer; box-shadow: 0 12px 30px rgba(225, 29, 72, 0.25); transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .love-v2-button:hover { transform: translateY(-2px); box-shadow: 0 17px 36px rgba(225, 29, 72, 0.30); }
        .love-v2-button:active { transform: scale(0.96); }

        .love-v2-mic { width: 90px; height: 90px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(135deg, var(--love-red), var(--love-red-dark)); color: #ffffff; font-size: 28px; box-shadow: 0 18px 42px rgba(225, 29, 72, 0.24); animation: loveAudioPulse 2.2s infinite; }
        @keyframes loveAudioPulse { 0%, 100% { box-shadow: 0 18px 42px rgba(225, 29, 72, 0.22); } 50% { box-shadow: 0 18px 58px rgba(225, 29, 72, 0.36); } }

        .love-v2-audio-title { margin: 0 0 5px; color: #111111; font-size: 22px; font-weight: 900; }
        .love-v2-audio-subtitle { margin: 0 0 24px; color: #999999; font-size: 13px; font-weight: 700; }
        
        .love-v2-player { width: 100%; padding: 15px; display: flex; align-items: center; gap: 14px; border: 1px solid #f1dfe3; border-radius: 24px; background: #ffffff; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.045); }
        .love-v2-play { width: 53px; height: 53px; flex: 0 0 53px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: linear-gradient(135deg, var(--love-red), var(--love-red-dark)); color: #ffffff; cursor: pointer; box-shadow: 0 8px 20px rgba(225, 29, 72, 0.22); }
        
        .love-v2-audio-info { flex: 1; min-width: 0; text-align: right; }
        .love-v2-audio-name { margin-bottom: 10px; color: #222222; font-size: 13px; font-weight: 900; }
        .love-v2-audio-track { width: 100%; height: 5px; overflow: hidden; border-radius: 10px; background: #f3e4e7; }
        .love-v2-audio-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, var(--love-red), #fb7185); transition: width 0.1s linear; }

        .love-v2-footer { margin-top: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #aaaaaa; font-size: 11px; font-weight: 700; }
        .love-v2-footer svg { color: var(--love-red); }

        @media (max-width: 520px) {
          .love-v2 { padding: 16px; }
          .love-v2-brand { top: 17px; }
          .love-v2-card { width: 100%; min-height: 430px; padding: 38px 21px 28px; border-radius: 29px; }
          .love-v2-title { font-size: 25px; }
          .love-v2-interaction-title { font-size: 24px; }
          .love-v2-message { font-size: 27px; }
        }
      `}</style>

      <div className="love-v2-bg">
        <div className="love-v2-circle love-v2-circle-one" />
        <div className="love-v2-circle love-v2-circle-two" />
      </div>

      <div className="love-v2-brand">
        <div className="love-v2-brand-icon"><FaHeart size={11} /></div>
        لحظتنا
      </div>

      <main className="love-v2-card">
        {screen === 'waiting' && (
          <div className="love-v2-content" key="waiting">
            <div className="love-v2-couple">
              <span className="love-v2-name">{data.sender_name}</span>
              <div className="love-v2-heart"><FaHeart size={14} /></div>
              <span className="love-v2-name">{data.receiver_name}</span>
            </div>
            <div className="love-v2-big-heart"><FaHeart /></div>
            <h1 className="love-v2-title">لحظتكم تنتظر</h1>
            <p className="love-v2-subtitle">ننتظر الطرف الآخر حتى تبدأ<br />المفاجأة بينكما</p>
            <div className="love-v2-dots"><span className="love-v2-dot" /><span className="love-v2-dot" /><span className="love-v2-dot" /></div>
            <div className="love-v2-footer"><FaHeart size={9} /><span>لحظة لا تكتمل إلا بكما</span><FaHeart size={9} /></div>
          </div>
        )}

        {screen === 'interaction' && (
          <div className="love-v2-content" key="interaction">
            <div className="love-v2-couple">
              <span className="love-v2-name">{data.sender_name}</span>
              <div className="love-v2-heart"><FaHeart size={14} /></div>
              <span className="love-v2-name">{data.receiver_name}</span>
            </div>
            <div className="love-v2-online"><span className="love-v2-online-dot" /> الطرفان متصلان</div>
            <h2 className="love-v2-interaction-title">اكتملت اللحظة ❤️</h2>
            <p className="love-v2-interaction-text">الآن أنتما معًا<br />اسحب القلب لفتح المفاجأة</p>
            <div className="love-v2-slider">
              <div className="love-v2-track" />
              <div className="love-v2-fill" style={{ width: `${sliderValue}%` }} />
              <input type="range" min="0" max="100" value={sliderValue} onChange={handleSliderChange} onMouseUp={handleSliderEnd} onTouchEnd={handleSliderEnd} dir="ltr" />
            </div>
          </div>
        )}

        {screen === 'reveal' && (
          <div className="love-v2-content" key="reveal">
            <div className="love-v2-gift"><FaGift /></div>
            <div className="love-v2-from-to">من <strong>{data.sender_name}</strong>  ♡  إلى <strong>{data.receiver_name}</strong></div>
            <div className="love-v2-message">"{data.message}"</div>
            <button type="button" className="love-v2-button" onClick={openAudio}><FaGift size={15} /> افتح الهدية</button>
            <div className="love-v2-footer"><FaHeart size={9} /><span>شيء صغير من قلب إلى قلب</span><FaHeart size={9} /></div>
          </div>
        )}

        {screen === 'play_audio' && (
          <div className="love-v2-content" key="play_audio">
            <div className="love-v2-mic"><FaMicrophone /></div>
            <h2 className="love-v2-audio-title">رسالة صوتية لك</h2>
            <p className="love-v2-audio-subtitle">من {data.sender_name}  ♡  إلى {data.receiver_name}</p>
            <div className="love-v2-player">
              <button type="button" className="love-v2-play" onClick={toggleAudio}>
                {isPlaying ? <FaPause size={15} /> : <FaPlay size={15} />}
              </button>
              <div className="love-v2-audio-info">
                <div className="love-v2-audio-name">الهدية الصوتية 🎵</div>
                <div className="love-v2-audio-track"><div className="love-v2-audio-fill" style={{ width: `${progress}%` }} /></div>
              </div>
            </div>
            <div className="love-v2-footer"><FaInfinity size={10} /><span>للحظات التي تستحق أن تبقى</span><FaInfinity size={10} /></div>
          </div>
        )}
      </main>

      <audio ref={audioRef} src={data.audio_url || undefined} preload="metadata" onTimeUpdate={handleAudioTimeUpdate} onEnded={handleAudioEnded} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />
    </div>
  );
}