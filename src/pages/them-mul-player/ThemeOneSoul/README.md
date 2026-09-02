# One Soul — 3D Cinematic Theme

هذه النسخة تحول One Soul إلى مشهد 3D تفاعلي داخل المتصفح باستخدام React Three Fiber + Three.js.

## التثبيت

الحزم المطلوبة:
- three
- @react-three/fiber
- @react-three/drei
- @types/three

## الدمج

ضع:
- ThemeOneSoul.tsx
- ThemeOneSoul.css

داخل:
src/pages/them-mul-player/ThemeOneSoul/

ثم استورد:
import ThemeOneSoul from './ThemeOneSoul/ThemeOneSoul';

## الأدوار

يمكن تمرير:
<ThemeOneSoul roomId={roomId} role="sender" orderData={data} />

أو:
role="receiver"

كما يمكن استخدام:
?room=ROOM_ID&role=sender
?room=ROOM_ID&role=receiver

## التسلسل

sleeping
→ awake
→ walking
→ at_window
→ window_open
→ meeting
→ thread
→ white flash
→ message
→ music

## ملاحظة الجرافيك

هذه النسخة تحتوي على بيئة 3D إجرائية قابلة للتشغيل مباشرة، وليست موديلات فوتوغرافية جاهزة. للوصول إلى مستوى لعبة/فيلم AAA يجب استبدال RoomShell/Character/OppositeHouse بموديلات GLB/GLTF سينمائية أصلية أو مرخصة. المحرك جاهز لاستقبالها.

## الصوت

audio_url يشغل الملف المرسل إليه. المتصفح قد يمنع autoplay، لذلك التشغيل مرتبط بزر المستخدم.
