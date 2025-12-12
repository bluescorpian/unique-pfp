import seedrandom from 'seedrandom';

import { drawGridPfp, drawVoronoiPfp } from './pfp';

const usernameInput = document.querySelector('.username');
const canvas = document.querySelector('.pfp');
const imageSaver = document.querySelector('.image-saver');
const modeSelect = document.getElementById('mode');

const OUTPUT_RENDER_SIZE = 1000;
const QUICK_RENDER_SIZE = 250;
const SUPER_SAMPLE_RENDER_SIZE = 2000; // 2x downsampling to 1000px output
const SUPER_SAMPLE_DELAY_MS = 500;
const INPUT_DEBOUNCE_MS = 50;

let mode = modeSelect.value;
let username = '';
let supersampleTimeout;

modeSelect.addEventListener('change', () => {
	mode = modeSelect.value;
	updatePfp();
});

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
const deounceUpdatePfp = debounce(() => {
	username = usernameInput.value;
	updatePfp();
}, INPUT_DEBOUNCE_MS);

usernameInput.addEventListener('input', deounceUpdatePfp);
updatePfp(); // default profile

function hashStr(str) {
	let hash = 0;
	if (str.length === 0) {
		return hash;
	}
	for (let i = 0; i < str.length; i++) {
		let char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash;
}

function renderPfp(ctx, size, seed) {
        const rng = seedrandom(seed);
        const params = [ctx, size, size, rng];

	if (mode === 'grid') {
		drawGridPfp(...params);
	} else if (mode === 'voronoi-euc') {
		drawVoronoiPfp(...params, 'euclidean');
	} else if (mode === 'voronoi-man') {
		drawVoronoiPfp(...params, 'nanhattan');
	}
}

function updatePfp() {
        const seed = hashStr(username);
        canvas.width = OUTPUT_RENDER_SIZE;
        canvas.height = OUTPUT_RENDER_SIZE;

        renderToCanvas(QUICK_RENDER_SIZE, seed);

        clearTimeout(supersampleTimeout);
        supersampleTimeout = setTimeout(() => {
                renderToCanvas(SUPER_SAMPLE_RENDER_SIZE, seed);
        }, SUPER_SAMPLE_DELAY_MS);
}

function renderToCanvas(size, seed) {
        const scratchCanvas = document.createElement('canvas');
        scratchCanvas.width = size;
        scratchCanvas.height = size;
        const scratchCtx = scratchCanvas.getContext('2d');

        renderPfp(scratchCtx, size, seed);

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(scratchCanvas, 0, 0, canvas.width, canvas.height);
}
