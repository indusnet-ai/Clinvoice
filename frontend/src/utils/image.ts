
export const getFileType = (file: File): string => {
  return file.type;
};

export const fileLimitCheck = (file: File, maxSizeInMb: number): Promise<boolean> => {
  const fileSizeInMB = file.size / 1024 / 1024;
  return new Promise((resolve, reject) => {
    if (fileSizeInMB > maxSizeInMb) {
      reject(new Error(`File must be smaller than ${maxSizeInMb}MB!`));
    } else {
      resolve(true);
    }
  });
};

export const toBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
  });
};

export const base64ToBlobUrl = (base64: string, type: string = "image/png"): string => {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([ab], { type });
  return URL.createObjectURL(blob);
};
