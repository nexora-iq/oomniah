// src/pos/POSDashboard.tsx
import React, { useState, useEffect } from 'react';
import { POSStorage, type MessageTemplate, type SongTemplate, type Draft } from './posStorage';
import { FaCopy, FaCheck, FaTrash, FaPlus, FaYoutube, FaPen, FaFolderOpen, FaLink } from 'react-icons/fa';
import { Toast } from '../../toast';

type Tab = 'drafts' | 'messages' | 'songs' | 'today';

export default function POSDashboard({ onClose, onSelectData, todayLinks }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [messages, setMessages] = useState<MessageTemplate[]>([]);
  const [songs, setSongs] = useState<SongTemplate[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // حالات الإضافة الجديدة
  const [newMsg, setNewMsg] = useState('');
  const [msgCategory, setMsgCategory] = useState('عام');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [newSongStart, setNewSongStart] = useState<number>(0);

  const [activeFilter, setActiveFilter] = useState('الكل');

  useEffect(() => {
    setMessages(POSStorage.getMessages());
    setSongs(POSStorage.getSongs());
    setDrafts(POSStorage.getDrafts());
  }, []);

  const handleAddMessage = () => {
    if (!newMsg) return;
    POSStorage.saveMessage({ text: newMsg, category: msgCategory });
    setMessages(POSStorage.getMessages());
    setNewMsg(''); Toast.fire({ icon: 'success', title: 'تم حفظ الرسالة' });
  };

  const handleAddSong = () => {
    if (!newSongTitle || !newSongUrl) return;
    POSStorage.saveSong({ title: newSongTitle, url: newSongUrl, start: newSongStart });
    setSongs(POSStorage.getSongs());
    setNewSongTitle(''); setNewSongUrl(''); setNewSongStart(0);
    Toast.fire({ icon: 'success', title: 'تم حفظ الأغنية' });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px', direction: 'rtl', fontFamily: 'Tajawal' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        
        {/* الهيدر والتبويبات */}
        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '900' }}>لوحة الموظف 💼</h2>
            <button onClick={onClose} style={{ background: '#e2e8f0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
            {[
              { id: 'messages', label: 'الرسائل الجاهزة' },
              { id: 'songs', label: 'الأغاني المحفوظة' },
              { id: 'drafts', label: 'مسوداتي' },
              { id: 'today', label: 'روابط اليوم' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} style={{ padding: '10px 15px', borderRadius: '12px', border: 'none', background: activeTab === tab.id ? '#dc2626' : 'transparent', color: activeTab === tab.id ? '#fff' : '#64748b', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* المحتوى */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fcfcfc' }}>
          
          {/* تبويب الرسائل */}
          {activeTab === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '16px' }}>
                <textarea placeholder="اكتب رسالة جديدة لحفظها..." value={newMsg} onChange={e=>setNewMsg(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', height: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px', resize: 'none', fontFamily: 'Tajawal' }} />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select value={msgCategory} onChange={e=>setMsgCategory(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1, fontFamily: 'Tajawal' }}>
                    <option>عام</option><option>أنثى</option><option>ذكر</option><option>حب</option><option>اعتذار</option><option>عيد ميلاد</option>
                  </select>
                  <button onClick={handleAddMessage} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><FaPlus/> حفظ</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['الكل', 'عام', 'أنثى', 'ذكر', 'حب', 'اعتذار', 'عيد ميلاد'].map(c => (
                  <button key={c} onClick={()=>setActiveFilter(c)} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', background: activeFilter === c ? '#1e293b' : '#fff', color: activeFilter === c ? '#fff' : '#475569', fontSize: '12px', cursor: 'pointer' }}>{c}</button>
                ))}
              </div>

              {messages.filter(m => activeFilter === 'الكل' || m.category === activeFilter).map(m => (
                <div key={m.id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', position: 'relative' }}>
                  <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '10px', color: '#64748b', fontWeight: 'bold' }}>{m.category}</span>
                  <p style={{ fontSize: '14px', color: '#1e293b', margin: '10px 0', lineHeight: '1.6' }}>{m.text}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { onSelectData({ message: m.text }); Toast.fire({icon:'success', title:'تم إدراج الرسالة'}); onClose(); }} style={{ flex: 1, padding: '8px', background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إدراج بالفورم</button>
                    <button onClick={() => { POSStorage.deleteMessage(m.id); setMessages(POSStorage.getMessages()); }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}><FaTrash/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تبويب الأغاني */}
          {activeTab === 'songs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="اسم الأغنية (مثال: شيرين - كدابين)" value={newSongTitle} onChange={e=>setNewSongTitle(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', fontFamily: 'Tajawal' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="رابط يوتيوب" value={newSongUrl} onChange={e=>setNewSongUrl(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1, fontFamily: 'Tajawal' }} />
                  <input type="number" placeholder="ثواني" value={newSongStart} onChange={e=>setNewSongStart(Number(e.target.value))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '70px', fontFamily: 'Tajawal' }} />
                </div>
                <button onClick={handleAddSong} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><FaPlus/> حفظ الرابط</button>
              </div>

              {songs.map(s => (
                <div key={s.id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#1e293b' }}><FaYoutube style={{ color: '#dc2626' }}/> {s.title}</h4>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>يبدأ من: {s.start}s</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { onSelectData({ song_url: s.url, song_start_seconds: s.start }); Toast.fire({icon:'success', title:'تم إدراج الأغنية'}); onClose(); }} style={{ padding: '8px 15px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إدراج</button>
                    <button onClick={() => { POSStorage.deleteSong(s.id); setSongs(POSStorage.getSongs()); }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><FaTrash/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تبويب المسودات */}
          {activeTab === 'drafts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drafts.length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>لا توجد مسودات محفوظة</div> : null}
              {drafts.map(d => (
                <div key={d.id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#1e293b' }}><FaFolderOpen color="#0ea5e9"/> {d.title}</h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{d.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { onSelectData(d.data); Toast.fire({icon:'success', title:'تم استرجاع المسودة'}); onClose(); }} style={{ padding: '8px 15px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>استرجاع</button>
                    <button onClick={() => { POSStorage.deleteDraft(d.id); setDrafts(POSStorage.getDrafts()); }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><FaTrash/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تبويب روابط اليوم */}
          {activeTab === 'today' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               {(!todayLinks || todayLinks.length === 0) ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>لم يتم توليد أي رابط اليوم.</div> : null}
               {todayLinks?.map((link: any) => (
                 <div key={link.id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>الزبون: {link.sender_name || 'غير معروف'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>السعر: {link.price.toLocaleString()} د.ع</div>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${link.themes?.slug || 'gift'}/${link.short_id}`); Toast.fire({icon:'success', title:'تم نسخ الرابط'}); }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaCopy/> نسخ
                    </button>
                 </div>
               ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}