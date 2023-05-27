function genColor(rng) {
	const color = [Math.floor(rng() * 255), Math.floor(rng() * 255), Math.floor(rng() * 255)];
	color.rgb = `rgb(${color[0]},${color[1]},${color[2]})`;

	return color;
}

class Palette {
	constructor(rng, paletteSize = 3) {
		this.rng = rng;
		this.palette = Array.from({ length: paletteSize }, () => genColor(this.rng));
	}
	genColor() {
		return this.palette[Math.floor(this.rng() * this.palette.length)];
	}
}

export function drawGridPfp(ctx, height, width, rng) {
	const palette = new Palette(rng, 3);

	const cols = 8;
	const rows = 8;

	const cellHeight = Math.ceil(height / rows);
	const cellWidth = Math.ceil(width / cols);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const color = palette.genColor();

			ctx.fillStyle = color.rgb;
			ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
		}
	}
}

export function drawVoronoiPfp(ctx, height, width, rng, mode = 'euclidean') {
	const palette = new Palette(rng, 6);

	const points = new Set();

	// generate points
	for (let i = 0; i < rng() * 30 + 30; i++) {
		const point = {
			x: rng() * width,
			y: rng() * height,
			color: palette.genColor(),
		};

		points.add(point);
	}

	const imageData = ctx.createImageData(width, height);
	const data = new Uint8Array(imageData.data.buffer);

	// draw voronoi
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			// find closest point
			let closestPoint = null;
			let closestPointDistance = null;
			for (const point of points) {
				let distance;
				if (mode === 'euclidean') {
					distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
				} else {
					distance = Math.abs(x - point.x) + Math.abs(y - point.y);
				}

				if (!closestPointDistance || distance < closestPointDistance) {
					closestPoint = point;
					closestPointDistance = distance;
				}
			}

			if (closestPoint) {
				// draw pixel at place.
				const color = closestPoint.color;
				const pixelIndex = (y * width + x) * 4;
				data[pixelIndex] = color[0];
				data[pixelIndex + 1] = color[1];
				data[pixelIndex + 2] = color[2];
				data[pixelIndex + 3] = 255;
			}
		}
	}

	ctx.putImageData(imageData, 0, 0);
}
