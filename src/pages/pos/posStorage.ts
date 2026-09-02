// src/pos/posStorage.ts

export type MessageTemplate = { id: string; text: string; category: string };
export type SongTemplate = { id: string; title: string; url: string; start: number };
export type Draft = { id: string; date: string; title: string; data: any };

export const POSStorage = {
  // --- إدارة الرسائل الجاهزة ---
  getMessages: (): MessageTemplate[] => JSON.parse(localStorage.getItem('pos_messages') || '[]'),
  saveMessage: (msg: Omit<MessageTemplate, 'id'>) => {
    const messages = POSStorage.getMessages();
    messages.push({ ...msg, id: Date.now().toString() });
    localStorage.setItem('pos_messages', JSON.stringify(messages));
  },
  deleteMessage: (id: string) => {
    const msgs = POSStorage.getMessages().filter(m => m.id !== id);
    localStorage.setItem('pos_messages', JSON.stringify(msgs));
  },

  // --- إدارة الأغاني الجاهزة ---
  getSongs: (): SongTemplate[] => JSON.parse(localStorage.getItem('pos_songs') || '[]'),
  saveSong: (song: Omit<SongTemplate, 'id'>) => {
    const songs = POSStorage.getSongs();
    songs.push({ ...song, id: Date.now().toString() });
    localStorage.setItem('pos_songs', JSON.stringify(songs));
  },
  deleteSong: (id: string) => {
    const songs = POSStorage.getSongs().filter(s => s.id !== id);
    localStorage.setItem('pos_songs', JSON.stringify(songs));
  },

  // --- إدارة المسودات ---
  getDrafts: (): Draft[] => JSON.parse(localStorage.getItem('pos_drafts') || '[]'),
  saveDraft: (title: string, data: any) => {
    const drafts = POSStorage.getDrafts();
    drafts.unshift({ id: Date.now().toString(), date: new Date().toLocaleString('ar-EG'), title, data });
    localStorage.setItem('pos_drafts', JSON.stringify(drafts));
  },
  deleteDraft: (id: string) => {
    const drafts = POSStorage.getDrafts().filter(d => d.id !== id);
    localStorage.setItem('pos_drafts', JSON.stringify(drafts));
  }
};