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
dropZone.ondragover = (e) => e.preventDefault();
dropZone.ondrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  fileInfo.textContent = `${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
  uploadBtn.disabled = false;
}

uploadBtn.onclick = async () => {
  if (!selectedFile) return;
  loading.classList.remove('hidden');
  result.classList.add('hidden');
  uploadBtn.disabled = true;

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const text = await res.text(); // read as text first to catch HTML errors
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(text.slice(0,200)); }

    if (!res.ok) throw new Error(data.error || 'Upload failed');

    linkInput.value = data.url;
    result.classList.remove('hidden');
  } catch (err) {
    alert('ERROR: ' + err.message);
    console.error(err);
  } finally {
    loading.classList.add('hidden');
    uploadBtn.disabled = false;
  }
};

document.getElementById('copyBtn').onclick = () => {
  navigator.clipboard.writeText(linkInput.value);
  document.getElementById('copyBtn').textContent = 'Copied!';
};
