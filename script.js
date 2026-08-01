const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const uploadBtn = document.getElementById('uploadBtn');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const linkInput = document.getElementById('linkInput');
let selectedFile = null;

browseBtn.onclick = (e) => { e.stopPropagation(); fileInput.click(); };
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFile(e.target.files[0]);
dropZone.ondragover = (e) => { e.preventDefault(); };
dropZone.ondrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  fileInfo.textContent = `${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
  uploadBtn.disabled = false;
}

uploadBtn.onclick = async () => {
  loading.classList.remove('hidden');
  result.classList.add('hidden');
  const formData = new FormData();
  formData.append('file', selectedFile);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  loading.classList.add('hidden');
  if (data.url) {
    linkInput.value = data.url;
    result.classList.remove('hidden');
  } else alert(data.error);
};

document.getElementById('copyBtn').onclick = () => {
  navigator.clipboard.writeText(linkInput.value);
  document.getElementById('copyBtn').textContent = 'Copied!';
};
