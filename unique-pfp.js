import sha256 from 'crypto-js/sha256';
import seedrandom from 'seedrandom';

const usernameInput = document.querySelector('.username');
const canvas = document.querySelector('.pfp');
const imageSaver = document.querySelector('.image-saver');

imageSaver.addEventListener('click', () => {
  imageSaver.href = canvas.toDataURL('image/png');
});

function debounce(func, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, arguments);
    }, delay);
  };
}
const deounceUpdatePfp = debounce(() => updatePfp(usernameInput.value), 200);

usernameInput.addEventListener('input', deounceUpdatePfp);
updatePfp('');

function updatePfp(username) {
  const hash = sha256(username);

  const hashNumber = parseInt(hash.toString(), 16);

  const rng = seedrandom(hashNumber);

  drawPfp(canvas, rng);
}

function drawPfp(canvas, rng) {
  function genColor() {
    return [Math.floor(rng() * 255), Math.floor(rng() * 255), Math.floor(rng() * 255)];
  }

  const paletteSize = 3;
  const palette = Array.from({ length: paletteSize }, () => genColor());

  function genPaletteColor() {
    return palette[Math.floor(rng() * palette.length)];
  }

  const rows = 8;
  const cols = 8;

  const cellWidth = Math.ceil(canvas.width / cols);
  const cellHeight = Math.ceil(canvas.height / rows);

  const ctx = canvas.getContext('2d');

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const color = genPaletteColor();

      ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
      ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
  }
}
