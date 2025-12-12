import seedrandom from "seedrandom";

import { drawGridPfp, drawVoronoiPfp, RENDER_ABORTED_ERROR } from "./pfp";

const usernameInput = document.querySelector(".username");
const canvas = document.querySelector(".pfp");
const imageSaver = document.querySelector(".image-saver");
const modeSelect = document.getElementById("mode");

const OUTPUT_RENDER_SIZE = 1000;
const QUICK_RENDER_SIZE = 100;
const SUPER_SAMPLE_RENDER_SIZE = 2000;
const SUPER_SAMPLE_DELAY_MS = 100;
const INPUT_DEBOUNCE_MS = 10;
const ASYNC_RENDER_THRESHOLD = 750;
const USE_ASYNC_FOR_SMALL_RENDERS = false;
const VORONOI_FRAME_BUDGET_MS = 16;

let mode = modeSelect.value;
let username = "";
let supersampleTimeout;
const RENDER_KEYS = {
	quick: "quick",
	supersample: "supersample",
};
const renderControllers = new Map();

modeSelect.addEventListener("change", () => {
	mode = modeSelect.value;
	updatePfp();
});

imageSaver.addEventListener("click", () => {
	imageSaver.href = canvas.toDataURL("image/png");
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

usernameInput.addEventListener("input", deounceUpdatePfp);
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

function shouldUseAsyncRendering(size) {
	if (size >= ASYNC_RENDER_THRESHOLD) {
		return true;
	}
	return USE_ASYNC_FOR_SMALL_RENDERS;
}

function cancelRender(key) {
	const controller = renderControllers.get(key);
	if (controller) {
		controller.abort();
		renderControllers.delete(key);
	}
}

function buildRenderOptions(size, controller) {
	return {
		asyncRender: shouldUseAsyncRendering(size),
		frameBudgetMs: VORONOI_FRAME_BUDGET_MS,
		signal: controller.signal,
	};
}

function createAbortController() {
	if (typeof AbortController === "undefined") {
		return {
			signal: { aborted: false },
			abort() {
				this.signal.aborted = true;
			},
		};
	}
	return new AbortController();
}

function isAbortError(error) {
	if (!error) {
		return false;
	}
	return error.name === RENDER_ABORTED_ERROR || error.name === "AbortError";
}

async function renderPfp(ctx, size, seed, selectedMode, renderOptions = {}) {
	const rng = seedrandom(seed);
	const params = [ctx, size, size, rng];

	if (selectedMode === "grid") {
		drawGridPfp(...params);
	} else if (selectedMode === "voronoi-euc") {
		await drawVoronoiPfp(...params, "euclidean", renderOptions);
	} else if (selectedMode === "voronoi-man") {
		await drawVoronoiPfp(...params, "nanhattan", renderOptions);
	}
}

function updatePfp() {
	cancelRender(RENDER_KEYS.quick);
	cancelRender(RENDER_KEYS.supersample);
	const seed = hashStr(username);
	canvas.width = OUTPUT_RENDER_SIZE;
	canvas.height = OUTPUT_RENDER_SIZE;

	if (mode === "grid") {
		renderToCanvas(OUTPUT_RENDER_SIZE, seed, RENDER_KEYS.quick).catch(
			(error) => {
				console.error("Grid render failed", error);
			}
		);
		clearTimeout(supersampleTimeout);
		supersampleTimeout = undefined;
		return;
	}

	renderToCanvas(QUICK_RENDER_SIZE, seed, RENDER_KEYS.quick).catch(
		(error) => {
			console.error("Quick render failed", error);
		}
	);

	clearTimeout(supersampleTimeout);
	supersampleTimeout = setTimeout(() => {
		renderToCanvas(SUPER_SAMPLE_RENDER_SIZE, seed, RENDER_KEYS.supersample)
			.then(() => {
				// noop
			})
			.catch((error) => {
				console.error("Supersample render failed", error);
			});
	}, SUPER_SAMPLE_DELAY_MS);
}

async function renderToCanvas(size, seed, renderKey) {
	const scratchCanvas = document.createElement("canvas");
	scratchCanvas.width = size;
	scratchCanvas.height = size;
	const scratchCtx = scratchCanvas.getContext("2d");
	const activeMode = mode;
	const activeUsername = username;
	cancelRender(renderKey);
	const controller = createAbortController();
	renderControllers.set(renderKey, controller);
	const renderOptions = buildRenderOptions(size, controller);

	try {
		await renderPfp(scratchCtx, size, seed, activeMode, renderOptions);
	} catch (error) {
		if (!isAbortError(error)) {
			throw error;
		}
		return;
	} finally {
		const trackedController = renderControllers.get(renderKey);
		if (trackedController === controller) {
			renderControllers.delete(renderKey);
		}
	}

	if (
		controller.signal.aborted ||
		activeMode !== mode ||
		activeUsername !== username
	) {
		return;
	}

	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(scratchCanvas, 0, 0, canvas.width, canvas.height);
	const shouldBlurPreview = activeMode !== "grid";
}
