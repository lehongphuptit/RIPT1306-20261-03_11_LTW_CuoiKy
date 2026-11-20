import { useBackdropDismiss } from '../../journal/useBackdropDismiss.js';
import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { errorMessage, postService } from '../../services/postService';

const REASONS = [
  { value: 'spam', label: 'Spam / Quảng cáo rác' },
  { value: 'offensive', label: 'Nội dung phản cảm, xúc phạm' },
  { value: 'false_info', label: 'Thông tin du lịch sai sự thật' },
  { value: 'other', label: 'Lý do khác' },
];

export default function ReportDialog({ postId, isOpen, onClose }) {
  const [reason, setReason] = useState('spam');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const backdrop = useBackdropDismiss(() => { if (!loading && !success) onClose(); });
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postService.reportPost({ postId, reason, note: note.trim() });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNote('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(
        err?.response?.status === 409
          ? 'Bạn đã báo cáo bài viết này trước đó rồi.'
          : errorMessage(err),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div {...backdrop} className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1919]/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#DDE7E8]/95 dark:bg-[#162424]/95 backdrop-blur-xl border border-white/70 dark:border-white/15 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#162424] dark:text-[#e8f0f0]">
            <Flag className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold">Báo cáo bài viết</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 text-[#4a6363]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center text-emerald-700 dark:text-emerald-400 font-medium">
            Đã gửi báo cáo tới quản trị viên. Cảm ơn đóng góp của bạn!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#162424] dark:text-[#e8f0f0]">
                Chọn lý do vi phạm
              </label>
              {REASONS.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-[#182828]/80 cursor-pointer border border-white/50"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-[#1F3333]"
                  />
                  <span className="text-sm text-[#162424] dark:text-[#e8f0f0]">{item.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#162424] dark:text-[#e8f0f0] mb-1">
                Mô tả chi tiết (không bắt buộc)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập thêm thông tin giúp quản trị viên xem xét..."
                className="w-full rounded-2xl bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
              />
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/70 hover:bg-white text-[#162424]"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#1F3333] hover:bg-[#142222] text-white disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
