import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import ImageUploader from '../components/posts/ImageUploader';
import VisibilityPicker from '../components/posts/VisibilityPicker';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { errorMessage, postService } from '../services/postService';

export default function PostFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [tripDate, setTripDate] = useState('');
  const [cost, setCost] = useState('');
  const [visibility, setVisibility] = useState('public');

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [loadingInit, setLoadingInit] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const debouncedLocation = useDebounce(locationInput, 400);

  useEffect(() => {
    if (!isEditMode || !user) return;
    (async () => {
      try {
        const res = await postService.getPostById(id);
        const post = res.post || res;
        setTitle(post.title || '');
        setContent(post.content || '');
        setLocationInput(post.location?.name || '');
        setSelectedPlace(post.location || null);
        setTripDate(post.tripDate ? post.tripDate.slice(0, 10) : '');
        setCost(post.cost !== undefined && post.cost !== null ? String(post.cost) : '');
        setVisibility(post.visibility || 'public');
        setExistingImages(post.images || []);
      } catch {
        alert('Không tìm thấy bài viết hoặc bạn không có quyền sửa.');
        navigate('/');
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [id, isEditMode, navigate, user]);

  useEffect(() => {
    if (!debouncedLocation || debouncedLocation.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (selectedPlace && selectedPlace.name === debouncedLocation) return;

    let active = true;
    (async () => {
      try {
        const data = await postService.autocompletePlaces(debouncedLocation.trim());
        if (active) {
          setSuggestions(Array.isArray(data) ? data : data.predictions || data.items || []);
          setShowSuggestions(true);
        }
      } catch {
        if (active) setSuggestions([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [debouncedLocation, selectedPlace]);

  if (authLoading) {
    return <div className="max-w-3xl mx-auto py-12 text-center text-[#4a6363]">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'member') {
    return <Navigate to="/" replace />;
  }

  const handleChooseSuggestion = async (item) => {
    const label = item.name || item.description;
    setLocationInput(label);
    setShowSuggestions(false);

    setSelectedPlace({...item,name:label});
  };

  const validate = () => {
    const nextErrors = {};
    if (title.trim().length < 5 || title.trim().length > 120) {
      nextErrors.title = 'Tiêu đề phải từ 5 đến 120 kí tự.';
    }
    if (!content.trim() || content.trim().length > 5000) {
      nextErrors.content = 'Nội dung bắt buộc nhập và tối đa 5000 kí tự.';
    }
    if (!locationInput.trim()) {
      nextErrors.location = 'Vui lòng nhập hoặc chọn địa điểm chuyến đi.';
    }
    if (!tripDate) nextErrors.tripDate='Vui lòng chọn ngày đi.';
    else if (new Date(tripDate) > new Date()) {
      nextErrors.tripDate = 'Ngày đi không được lớn hơn ngày hiện tại.';
    }
    if (cost !== '' && Number(cost) < 0) {
      nextErrors.cost = 'Chi phí phải lớn hơn hoặc bằng 0.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('visibility', visibility);

      const locationPayload =
        selectedPlace && selectedPlace.name === locationInput.trim()
          ? selectedPlace
          : { name: locationInput.trim() };
      formData.append('location', JSON.stringify(locationPayload));

      if (tripDate) formData.append('tripDate', tripDate);
      formData.append('cost',String(Number(cost)||0));

      if (isEditMode) {
        formData.append('keepImageIds',JSON.stringify(existingImages.map(img=>img.publicId)));
      }

      newFiles.forEach((file) => {
        formData.append('images', file);
      });

      const res = isEditMode
        ? await postService.updatePost(id, formData)
        : await postService.createPost(formData);

      const savedPost = res.post || res;
      navigate(`/posts/${savedPost._id || id}`);
    } catch (err) {
      setErrors({ submit: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) {
    return <div className="max-w-3xl mx-auto py-12 text-center text-[#4a6363]">Đang tải dữ liệu bài viết...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-3xl bg-white/75 dark:bg-[#162424]/85 backdrop-blur-xl border border-white/70 dark:border-white/15 p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-[#162424] dark:text-[#e8f0f0] mb-6">
          {isEditMode ? 'Chỉnh sửa nhật ký chuyến đi' : 'Đăng bài nhật ký mới'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: 3 ngày khám phá phố cổ Hội An..."
              className="w-full rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
              Nội dung câu chuyện * (gõ #hashtag để gắn thẻ)
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kể lại trải nghiệm đáng nhớ, lịch trình, món ngon... #hoian #dulich"
              className="w-full rounded-2xl bg-white dark:bg-[#182828] p-4 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
            {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
                Địa điểm *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#4a6363] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setSelectedPlace(null);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Hội An, Quảng Nam"
                  className="w-full rounded-full bg-white dark:bg-[#182828] pl-9 pr-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
                />
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full rounded-2xl bg-white dark:bg-[#182828] shadow-lg border border-black/10 overflow-hidden">
                  {suggestions.map((item, index) => (
                    <li key={item.placeId || item.place_id || index}>
                      <button
                        type="button"
                        onClick={() => handleChooseSuggestion(item)}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#DDE7E8]/60 dark:hover:bg-white/10"
                      >
                        {item.name || item.description}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
                Ngày đi
              </label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
              />
              {errors.tripDate && <p className="text-xs text-red-600 mt-1">{errors.tripDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
                Chi phí (đ)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="3200000"
                className="w-full rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
              />
              {errors.cost && <p className="text-xs text-red-600 mt-1">{errors.cost}</p>}
            </div>
          </div>

          <ImageUploader
            existingImages={existingImages}
            onRemoveExisting={(publicId) =>
              setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId))
            }
            newFiles={newFiles}
            onChangeNewFiles={setNewFiles}
          />

          <VisibilityPicker value={visibility} onChange={setVisibility} />

          {errors.submit && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-medium text-red-600">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-full text-sm font-medium bg-white/80 hover:bg-white text-[#162424] border border-white/60"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2.5 rounded-full text-sm font-semibold bg-[#1F3333] hover:bg-[#142222] text-white shadow-md disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : isEditMode ? 'Cập nhật bài' : 'Đăng bài'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
