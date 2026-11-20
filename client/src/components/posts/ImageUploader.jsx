import JournalImage from '../../journal/JournalImage.jsx';
import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useImagePreviews } from '../../hooks/useImagePreviews';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 6;

export default function ImageUploader({
  existingImages = [],
  onRemoveExisting,
  newFiles = [],
  onChangeNewFiles,
}) {
  const inputRef = useRef(null);
  const [fileError, setFileError] = useState('');
  const newPreviews = useImagePreviews(newFiles);

  const totalCount = existingImages.length + newFiles.length;

  const handleSelectFiles = (e) => {
    setFileError('');
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    if (totalCount + selected.length > MAX_IMAGES) {
      setFileError(`Mỗi bài chỉ được đăng tối đa ${MAX_IMAGES} ảnh.`);
      e.target.value = '';
      return;
    }

    const validFiles = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError('Chỉ chấp nhận định dạng JPG, PNG hoặc WebP.');
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setFileError(`Ảnh "${file.name}" vượt quá dung lượng 5 MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChangeNewFiles([...newFiles, ...validFiles]);
    }
    e.target.value = '';
  };

  const handleRemoveNew = (index) => {
    setFileError('');
    onChangeNewFiles(newFiles.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[#162424] dark:text-[#e8f0f0]">
          Ảnh chuyến đi ({totalCount}/{MAX_IMAGES})
        </label>
        <span className="text-xs text-[#4a6363] dark:text-[#9eb7b8]">
          JPG, PNG, WebP · Tối đa 5 MB/ảnh
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {existingImages.map((img) => (
          <div
            key={img.publicId}
            className="relative aspect-square rounded-2xl overflow-hidden border border-white/60 shadow-sm group"
          >
            <JournalImage src={img.url} alt="Ảnh đã đăng" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(img.publicId)}
              title="Xoá ảnh này"
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#1F3333]/85 text-white flex items-center justify-center hover:bg-red-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {newPreviews.map((item, idx) => (
          <div
            key={item.url}
            className="relative aspect-square rounded-2xl overflow-hidden border border-white/60 shadow-sm"
          >
            <img src={item.url} alt="Xem trước" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemoveNew(idx)}
              title="Bỏ chọn ảnh"
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#1F3333]/85 text-white flex items-center justify-center hover:bg-red-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {totalCount < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-[#4a6363]/40 hover:border-[#1F3333] bg-white/50 dark:bg-[#182828]/60 flex flex-col items-center justify-center gap-1 text-[#4a6363] dark:text-[#9eb7b8] hover:text-[#1F3333] transition"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-xs font-medium">+ Thêm</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleSelectFiles}
        className="hidden"
      />

      {fileError && <p className="text-xs font-medium text-red-600">{fileError}</p>}
    </div>
  );
}