import React, { useState, ChangeEvent } from "react";

type FileUploaderProps = {
  onUploaded: (url: string) => void;
};

type UploadFile = {
  file: File;
  progress: number;
  error?: string;
};

const FileUploader: React.FC<FileUploaderProps> = ({ onUploaded }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const uploadFile = (fileObj: UploadFile) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("files", fileObj.file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileObj.file ? { ...f, progress } : f
          )
        );
      }
    };

    xhr.onload = () => {
      console.log("XHR response:", xhr.responseText);
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const fileUrl = response.uploaded?.[0];
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileObj.file ? { ...f, progress: 100 } : f
          )
        );
        onUploaded(fileUrl);
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileObj.file
              ? { ...f, error: "Ошибка загрузки" }
              : f
          )
        );
      }
    };

    xhr.onerror = () => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === fileObj.file ? { ...f, error: "Ошибка сети" } : f
        )
      );
    };

    xhr.open("POST", "https://26.234.138.233:3006/upload");
    xhr.send(formData);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    // Проверка типа и размера (например, max 10MB)
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    const maxSize = 10 * 1024 * 1024;

    const filteredFiles = selectedFiles.filter(
      (file) =>
        allowedTypes.includes(file.type) && file.size <= maxSize
    );

    const newFiles = filteredFiles.map((file) => ({
      file,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach(uploadFile);
  };

  return (
    <div>
      <input type="file" multiple onChange={onChange} />
      <ul>
        {/* {files.map(({ file, progress, error }) => (
          <li key={file.name}>
            {file.name} - {progress}%
            {error && <span style={{ color: "red" }}> ({error})</span>}
            {file.type.startsWith("image/") && progress === 100 && !error && (
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={{ maxWidth: 100, display: "block", marginTop: 5 }}
              />
            )}
          </li>
        ))} */}
      </ul>
    </div>
  );
};

export default FileUploader;
