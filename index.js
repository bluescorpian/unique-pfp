import seedrandom from 'seedrandom';

import { drawGridPfp, drawVoronoiPfp } from './pfp';

const usernameInput = document.querySelector('.username');
const canvas = document.querySelector('.pfp');
const imageSaver = document.querySelector('.image-saver');
const modeSelect = document.getElementById('mode');

let mode = modeSelect.value;
let username = '';

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
}, 200);

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

function updatePfp() {
	const hash = hashStr(username);

	const rng = seedrandom(hash);

	const ctx = canvas.getContext('2d');

	const params = [ctx, canvas.height, canvas.width, rng];

	if (mode === 'grid') {
		drawGridPfp(...params);
	} else if (mode === 'voronoi-euc') {
		drawVoronoiPfp(...params, 'euclidean');
	} else if (mode === 'voronoi-man') {
		drawVoronoiPfp(...params, 'nanhattan');
	}
}
