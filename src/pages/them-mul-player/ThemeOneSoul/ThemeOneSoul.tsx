import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FaHeart, FaMusic, FaMicrophone, FaWindowMaximize } from 'react-icons/fa';
import { supabase } from '../../.././supabase';
import './ThemeOneSoul.css';

export interface ThemeOneSoulProps {
  roomId?: string;
  role?: 'sender' | 'receiver';
  orderData?: {
    sender_name: string;
    receiver_name: string;
    message: string;
    audio_url: string;
  };
}

type Role = 'sender' | 'receiver';
type Stage =
  | 'waiting'
  | 'sleeping'
  | 'awake'
  | 'walking'
  | 'at_window'
  | 'window_open'
  | 'meeting'
  | 'thread'
  | 'flash'
  | 'message'
  | 'complete'
  | 'music';

type Action =
  | 'awake'
  | 'walk'
  | 'at_window'
  | 'open_window'
  | 'ready'
  | 'music';

type Peer = { role: Role; action: Action; at: number; presence_ref?: string };

const DEFAULT_DATA = {
  sender_name: 'الزوج',
  receiver_name: 'الزوجة',
  message: 'بعض الأرواح لا تحتاج أن تلتقي كثيراً… يكفي أنها تعرف طريقها إلى بعضها.',
  audio_url: '',
};

function useRoom(
  roomId: string | null,
  role: Role,
  onStage: (stage: Stage) => void
) {
  const channelRef = useRef<any>(null);
  const [peerAction, setPeerAction] = useState<Action | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setConnected(true);
      return;
    }

    const channel = supabase.channel(`one-soul-3d-${roomId}`, {
      config: { presence: { key: `${role}-${crypto.randomUUID()}` } },
    });
    channelRef.current = channel;

    const publish = (action: Action) => {
      channel.send({
        type: 'broadcast',
        event: 'one_soul_action',
        payload: { role, action, at: Date.now() },
      }).catch((e: unknown) => console.warn('One Soul broadcast:', e));
    };

    const handleBroadcast = (payload: any) => {
      const data = payload?.payload;
      if (!data || data.role === role) return;
      if (typeof data.action !== 'string') return;
      setPeerAction(data.action as Action);
    };

    channel.on('broadcast', { event: 'one_soul_action' }, handleBroadcast);

    channel.on('presence', { event: 'sync' }, () => {
      setConnected(Object.keys(channel.presenceState()).length >= 2);
    });

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        await channel.track({ role, action: 'awake', at: Date.now() });
      }
    });

    (channel as any).__oneSoulPublish = publish;

    return () => {
      try { channel.untrack(); } catch {}
      try { channel.unsubscribe(); } catch {}
      channelRef.current = null;
    };
  }, [roomId, role]);

  useEffect(() => {
    if (!peerAction) return;
    if (peerAction === 'awake') onStage('awake');
    if (peerAction === 'walk') onStage('walking');
    if (peerAction === 'at_window') onStage('at_window');
    if (peerAction === 'open_window') onStage('window_open');
    if (peerAction === 'ready') onStage('meeting');
    if (peerAction === 'music') onStage('music');
  }, [peerAction, onStage]);

  const send = (action: Action) => {
    const ch: any = channelRef.current;
    if (ch?.__oneSoulPublish) ch.__oneSoulPublish(action);
  };

  return { send, connected };
}

function RoomSet({ role, stage, windowOpen }: { role: Role; stage: Stage; windowOpen: boolean }) {
  const rain = useMemo(() => Array.from({ length: 900 }, (_, i) => ({
    x: (Math.random() - .5) * 24,
    y: Math.random() * 14,
    z: (Math.random() - .5) * 18,
    s: .7 + Math.random() * 1.8,
    speed: 4 + Math.random() * 5,
    id: i,
  })), []);

  return (
    <>
      <color attach="background" args={['#07111f']} />
      <fog attach="fog" args={['#07111f', 9, 28]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[-4, 7, 5]} intensity={1.2} color="#9fb7ff" />
      <pointLight position={[0, 3, 1]} intensity={2.2} distance={10} color="#ffd8a8" />

      <Stars radius={60} depth={30} count={1400} factor={2.1} saturation={0} fade speed={0.25} />
      <Moon />

      <group position={[0, -1.5, 0]}>
        <RoomShell role={role} windowOpen={windowOpen} />
        <Bed position={[-2.1, 0.15, 1.7]} />
        <NightStand position={[-0.35, 0.1, 1.8]} />
        <Window position={[2.5, 1.7, -1.25]} open={windowOpen} />
        <Character role={role} stage={stage} />
      </group>

      <Rain drops={rain} />

      <group position={[0, -1.5, -7]}>
        <OppositeHouse role={role} stage={stage} />
      </group>
    </>
  );
}

function Moon() {
  return (
    <group position={[7, 7, -14]}>
      <mesh>
        <sphereGeometry args={[1.55, 48, 48]} />
        <meshStandardMaterial color="#f7f1d1" emissive="#fff5c7" emissiveIntensity={1.5} roughness={1} />
      </mesh>
      <pointLight intensity={2.5} distance={40} color="#b9ccff" />
    </group>
  );
}

function RoomShell({ role, windowOpen }: { role: Role; windowOpen: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[10, .35, 8]} />
        <meshStandardMaterial color="#4a4050" roughness={.9} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[10, .3, 8]} />
        <meshStandardMaterial color="#25212b" roughness={1} />
      </mesh>
      <mesh position={[-5, 1.2, 0]}>
        <boxGeometry args={[.3, 4, 8]} />
        <meshStandardMaterial color="#332c39" roughness={.85} />
      </mesh>
      <mesh position={[5, 1.2, 0]}>
        <boxGeometry args={[.3, 4, 8]} />
        <meshStandardMaterial color="#332c39" roughness={.85} />
      </mesh>
      <mesh position={[0, 1.2, 4]}>
        <boxGeometry args={[10, 4, .3]} />
        <meshStandardMaterial color={role === 'receiver' ? '#51343c' : '#343b55'} roughness={.85} />
      </mesh>
      <mesh position={[-1.9, 1.1, -4]}>
        <boxGeometry args={[6.2, 3.8, .3]} />
        <meshStandardMaterial color="#2a2631" roughness={1} />
      </mesh>
      <mesh position={[2.7, 1.3, -3.82]}>
        <planeGeometry args={[4.2, 3.1]} />
        <meshStandardMaterial color={windowOpen ? '#12233b' : '#172030'} emissive="#0d1d33" emissiveIntensity={.8} roughness={.3} />
      </mesh>
      <mesh position={[2.7, 1.3, -3.6]}>
        <boxGeometry args={[4.5, 3.45, .08]} />
        <meshBasicMaterial color="#d7b98b" wireframe />
      </mesh>
    </group>
  );
}

function Bed({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, .45, 0]}>
        <boxGeometry args={[3.6, .65, 2.4]} />
        <meshStandardMaterial color="#5b5360" roughness={.95} />
      </mesh>
      <mesh position={[0, .83, -.05]}>
        <boxGeometry args={[3.35, .25, 2.18]} />
        <meshStandardMaterial color="#efe9e3" roughness={.9} />
      </mesh>
      <mesh position={[0, 1.02, .55]}>
        <boxGeometry args={[3.1, .35, 1.25]} />
        <meshStandardMaterial color="#c9bfc3" roughness={1} />
      </mesh>
      <mesh position={[-1.35, 1.06, -.7]}>
        <boxGeometry args={[1.15, .28, .65]} />
        <meshStandardMaterial color="#f5f1ed" roughness={.9} />
      </mesh>
    </group>
  );
}

function NightStand({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, .55, 0]}>
        <boxGeometry args={[.9, 1.1, .8]} />
        <meshStandardMaterial color="#3b3030" roughness={.8} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[.28, .2, .55, 24]} />
        <meshStandardMaterial color="#d8c4ad" emissive="#ffb66e" emissiveIntensity={1.1} />
      </mesh>
      <pointLight position={[0, 1.35, 0]} intensity={1.4} distance={4} color="#ffb36b" />
    </group>
  );
}

function Window({ position, open }: { position: [number, number, number]; open: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, -.05]}>
        <boxGeometry args={[4.7, 3.6, .18]} />
        <meshStandardMaterial color="#221c25" roughness={.6} />
      </mesh>
      <mesh position={[-1.08, 0, .08]} rotation={[0, open ? -.32 : 0, 0]}>
        <boxGeometry args={[.12, 3.35, 2.1]} />
        <meshStandardMaterial color="#b9a49a" roughness={.75} />
      </mesh>
      <mesh position={[1.08, 0, .08]} rotation={[0, open ? .32 : 0, 0]}>
        <boxGeometry args={[.12, 3.35, 2.1]} />
        <meshStandardMaterial color="#b9a49a" roughness={.75} />
      </mesh>
      <mesh position={[0, 0, .08]}>
        <boxGeometry args={[.1, 3.35, .1]} />
        <meshStandardMaterial color="#b9a49a" />
      </mesh>
      <mesh position={[0, 0, .08]}>
        <boxGeometry args={[4.45, .1, .1]} />
        <meshStandardMaterial color="#b9a49a" />
      </mesh>
    </group>
  );
}

function Character({ role, stage }: { role: Role; stage: Stage }) {
  const ref = useRef<THREE.Group>(null);
  const target = stage === 'sleeping' ? new THREE.Vector3(-2.1, .9, 1.6)
    : stage === 'walking' || stage === 'awake' ? new THREE.Vector3(1.5, .9, -.8)
    : new THREE.Vector3(1.65, .9, -2.35);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.lerp(target, 1 - Math.pow(.001, delta));
    const bob = stage === 'walking' ? Math.sin(performance.now() / 110) * .035 : 0;
    ref.current.position.y += bob;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, stage === 'walking' ? .25 : 0, .08);
  });

  const hair = role === 'receiver';

  return (
    <group ref={ref} position={[-2.1, .9, 1.6]}>
      <mesh position={[0, 1.55, 0]}>
        <capsuleGeometry args={[.24, .75, 10, 18]} />
        <meshStandardMaterial color="#f7f7f5" roughness={.7} />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <sphereGeometry args={[.33, 28, 28]} />
        <meshStandardMaterial color="#fff" roughness={.75} />
      </mesh>
      <mesh position={[-.18, .92, 0]} rotation={[0, 0, .03]}>
        <capsuleGeometry args={[.12, .7, 8, 14]} />
        <meshStandardMaterial color="#fafafa" roughness={.8} />
      </mesh>
      <mesh position={[.18, .92, 0]} rotation={[0, 0, -.03]}>
        <capsuleGeometry args={[.12, .7, 8, 14]} />
        <meshStandardMaterial color="#fafafa" roughness={.8} />
      </mesh>
      {hair && (
        <group position={[0, 2.1, -.05]}>
          <mesh>
            <sphereGeometry args={[.42, 28, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={.8} />
          </mesh>
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} position={[(i - 3) * .11, -.34 - Math.abs(i - 3) * .03, .02]}>
              <capsuleGeometry args={[.075, .75 + Math.abs(i - 3) * .08, 7, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={.82} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function OppositeHouse({ role, stage }: { role: Role; stage: Stage }) {
  const other = role === 'receiver' ? 'sender' : 'receiver';
  const visible = ['window_open', 'meeting', 'thread', 'flash', 'message', 'complete', 'music'].includes(stage);
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[8, 4.5, 3.5]} />
        <meshStandardMaterial color="#403e49" roughness={1} />
      </mesh>
      <mesh position={[0, 4.25, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[5.8, 5.8, 3.6]} />
        <meshStandardMaterial color="#2c2c38" roughness={1} />
      </mesh>
      <mesh position={[0, 1.7, 1.8]}>
        <boxGeometry args={[2.8, 2.3, .12]} />
        <meshStandardMaterial color={visible ? '#e7c48b' : '#151c29'} emissive={visible ? '#ffbd6e' : '#09111e'} emissiveIntensity={visible ? 1.5 : .2} />
      </mesh>
      {visible && <Character role={other} stage="at_window" />}
    </group>
  );
}

function Rain({ drops }: { drops: { x:number;y:number;z:number;s:number;speed:number;id:number }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, delta) => {
    if (!ref.current) return;
    drops.forEach((d, i) => {
      d.y -= d.speed * delta;
      if (d.y < -2) d.y = 12;
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.z = -.16;
      dummy.scale.set(.015, d.s, .015);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, drops.length]}>
      <cylinderGeometry args={[1, 1, 1, 5]} />
      <meshBasicMaterial color="#b9d7ff" transparent opacity={.34} />
    </instancedMesh>
  );
}

function RedThread({ active }: { active: boolean }) {
  const ref = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null);
  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    ref.current.material.opacity = .45 + Math.sin(clock.elapsedTime * 5) * .35;
  });
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8, 2.6, -1.8),
      new THREE.Vector3(-.6, 3.8, -3),
      new THREE.Vector3(0, 4.8, -4),
      new THREE.Vector3(.7, 3.8, -5),
      new THREE.Vector3(1.8, 2.6, -6),
    ]);
    return curve.getPoints(70);
  }, []);
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return active ? (
// @ts-ignore
<line ref={ref} geometry={geo}>
    <lineBasicMaterial color="#ff173f" linewidth={3} transparent opacity={1} />
    </line>
  ) : null;
}

function WhiteFlash({ active, onDone }: { active: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [active, onDone]);
  return active ? <div className="one-soul-flash" /> : null;
}

function CameraDirector({ stage }: { stage: Stage }) {
  const { camera } = useThree();
  useFrame(() => {
    const targets: Record<string, [number, number, number]> = {
      sleeping: [0, 1.1, 8],
      awake: [0, 1.25, 7],
      walking: [1.1, 1.35, 6],
      at_window: [2.2, 1.5, 5.5],
      window_open: [2.2, 1.5, 5],
      meeting: [0, 2, 8],
      thread: [0, 2.8, 9],
    };
    const t = targets[stage] || targets.at_window;
    camera.position.lerp(new THREE.Vector3(...t), .025);
    camera.lookAt(1, 1.2, -1.5);
  });
  return null;
}

export default function ThemeOneSoul({
  roomId: propRoomId,
  role: propRole,
  orderData: propOrderData,
}: ThemeOneSoulProps) {
  const params = new URLSearchParams(window.location.search);
  const roomId = propRoomId || params.get('room');
  const role: Role = propRole || (params.get('role') === 'sender' ? 'sender' : 'receiver');
  const data = propOrderData || DEFAULT_DATA;

  const [stage, setStage] = useState<Stage>('sleeping');
  const [windowOpen, setWindowOpen] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [started, setStarted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const safeStage = (next: Stage) => setStage((current) => {
    const order: Stage[] = ['waiting','sleeping','awake','walking','at_window','window_open','meeting','thread','flash','message','complete','music'];
    return order.indexOf(next) >= order.indexOf(current) ? next : current;
  });

  const { send, connected } = useRoom(roomId, role, safeStage);

  const wake = () => {
    setStarted(true);
    safeStage('awake');
    send('awake');
  };

  const walk = () => {
    safeStage('walking');
    send('walk');
  };

  const openWindow = () => {
    setWindowOpen(true);
    safeStage('window_open');
    send('open_window');
  };

  useEffect(() => {
    if (stage !== 'window_open') return;
    const t = window.setTimeout(() => {
      safeStage('meeting');
      send('ready');
    }, 900);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'meeting') return;
    const t = window.setTimeout(() => {
      safeStage('thread');
      window.setTimeout(() => {
        setShowFlash(true);
        safeStage('flash');
      }, 2200);
    }, 900);
    return () => clearTimeout(t);
  }, [stage]);

  const finishFlash = () => {
    setShowFlash(false);
    safeStage('message');
  };

  const playMusic = () => {
    const audio = audioRef.current;
    if (!audio || !data.audio_url) {
      safeStage('music');
      send('music');
      return;
    }
    audio.play().then(() => {
      setAudioPlaying(true);
      safeStage('music');
      send('music');
    }).catch(() => {
      safeStage('music');
    });
  };

  const prompt =
    stage === 'sleeping' ? 'ليلة هادئة…' :
    stage === 'awake' ? 'انهض من السرير' :
    stage === 'walking' ? 'توجّه إلى نافذتك' :
    stage === 'at_window' ? 'أنت عند النافذة' :
    stage === 'window_open' ? 'افتح النافذة' :
    stage === 'meeting' ? 'هناك شخص ينتظرك…' :
    stage === 'thread' ? 'بعض الأرواح تعرف طريقها' :
    '';

  return (
    <div className="one-soul">
      <Canvas shadows dpr={[1, 1.75]}>
        <PerspectiveCamera makeDefault fov={46} position={[0, 1.5, 8]} />
        <Suspense fallback={null}>
          <RoomSet role={role} stage={stage} windowOpen={windowOpen} />
          <RedThread active={stage === 'thread' || stage === 'flash'} />
          <CameraDirector stage={stage} />
          <Environment preset="night" background={false} />
        </Suspense>
      </Canvas>

      <div className="one-soul-hud">
        <div className="one-soul-top">
          <span className="one-soul-brand"><FaHeart /> الروح الواحدة</span>
          <span className="one-soul-status">
            <i className={connected ? 'online' : ''} />
            {connected ? 'متصلان' : 'بانتظار الطرف الآخر'}
          </span>
        </div>

        {stage !== 'message' && stage !== 'complete' && stage !== 'music' && (
          <div className="one-soul-prompt">{prompt}</div>
        )}

        {!started && stage === 'sleeping' && (
          <button className="one-soul-action" onClick={wake}>
            استيقظ <span>✦</span>
          </button>
        )}

        {started && stage === 'awake' && (
          <button className="one-soul-action" onClick={walk}>
            <span>↑</span> توجّه إلى النافذة
          </button>
        )}

        {stage === 'walking' && (
          <div className="one-soul-hint">امشِ نحو النافذة…</div>
        )}

        {stage === 'at_window' && !windowOpen && (
          <button className="one-soul-action" onClick={openWindow}>
            <FaWindowMaximize /> افتح النافذة
          </button>
        )}

        {(stage === 'message' || stage === 'complete' || stage === 'music') && (
          <div className="one-soul-letter">
            <div className="letter-mark"><FaHeart /></div>
            <div className="letter-names">{data.sender_name} <span>♡</span> {data.receiver_name}</div>
            <p>{data.message}</p>
            {stage !== 'music' && (
              <button className="one-soul-music" onClick={playMusic}>
                <FaMusic /> {data.audio_url ? 'استمع إلى الأغنية' : 'استمع إلى الرسالة'}
              </button>
            )}
            {stage === 'music' && <div className="playing"><FaMicrophone /> {audioPlaying ? 'تُعزف الآن…' : 'رسالتكما محفوظة هنا'}</div>}
          </div>
        )}

        <WhiteFlash active={showFlash} onDone={finishFlash} />
      </div>

      <audio
        ref={audioRef}
        src={data.audio_url || undefined}
        onEnded={() => setAudioPlaying(false)}
        preload="metadata"
      />
    </div>
  );
}
