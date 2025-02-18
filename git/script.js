document.getElementById('uploadBtn').addEventListener('click', async () => {
  const output = document.getElementById('output');
  output.innerHTML = '📤 Uploading videos...';

  try {
    const response = await fetch('/upload-videos');
    const result = await response.json();

    if (response.ok) {
      output.innerHTML = '✅ Videos uploaded successfully!';
    } else {
      output.innerHTML = `❌ Error: ${result.error}`;
    }
    console.log(result);
  } catch (error) {
    output.innerHTML = `❌ Error: ${error.message}`;
    console.error(error);
  }
});