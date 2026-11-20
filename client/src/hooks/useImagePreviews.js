import { useEffect, useState } from 'react';

export function useImagePreviews(files) {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const objectUrls = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(objectUrls);

    return () => {
      objectUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [files]);

  return previews;
}