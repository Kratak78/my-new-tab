document.querySelector("#search").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = document.querySelector("#q").value.trim();
  if (q) window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
});