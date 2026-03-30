// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('.filters button');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalVideoLink = document.getElementById('modalVideoLink');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const spaceFactText = document.getElementById('spaceFactText');
const modalTransitionMs = 180;

let closeModalTimer;

// NASA provides a public demo API key for beginner projects.
const apiKey = 'BjrIovAuWLX8yb13RxSMdKWTLeNOHEVO9YwlDVgz';

const spaceFacts = [
	'More energy from the Sun reaches Earth in one hour than humanity uses in a full year.',
	'A day on Venus is longer than a year on Venus because it spins very slowly.',
	'Neutron stars are so dense that a teaspoon of their material would weigh about a billion tons on Earth.',
	'Jupiter is so large that more than 1,300 Earths could fit inside it.',
	'Saturn would float in water because its average density is lower than water.',
	'One million Earths could fit inside the Sun.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
	'The footprints left by Apollo astronauts on the Moon can last for millions of years.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Convert YYYY-MM-DD to a friendly format like "April 16, 2025"
function formatDate(dateString) {
	return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

function showRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

// Show loading cards so students can see where images will appear.
function renderLoadingPlaceholders(count) {
	gallery.innerHTML = '';

	const loadingMessage = document.createElement('p');
	loadingMessage.className = 'loading-message';
	loadingMessage.textContent = '\uD83D\uDD04 Loading space photos...';
	gallery.appendChild(loadingMessage);

	for (let index = 0; index < count; index += 1) {
		const card = document.createElement('article');
		card.className = 'gallery-item loading-card';
		card.innerHTML = `
			<div class="image-placeholder"></div>
			<div class="text-placeholder title-placeholder"></div>
			<div class="text-placeholder date-placeholder"></div>
		`;

		gallery.appendChild(card);
	}
}

// If no images are available, keep the page friendly with a message.
function renderEmptyMessage(message) {
	closeModal();

	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🔭</div>
			<p>${message}</p>
		</div>
	`;
}

function renderGalleryCards(items) {
	if (items.length === 0) {
		renderEmptyMessage('No space posts were found for this date range. Try different dates.');
		return;
	}

	gallery.innerHTML = '';

	items.forEach((item) => {
		const card = document.createElement('article');
		card.className = 'gallery-item';
		card.setAttribute('tabindex', '0');
		card.setAttribute('role', 'button');
		card.setAttribute('aria-label', `Open details for ${item.title}`);

		const previewImage = item.media_type === 'video'
			? item.thumbnail_url || 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001294/GSFC_20171208_Archive_e001294~small.jpg'
			: item.url;
		const mediaTag = item.media_type === 'video'
			? '<span class="media-tag">VIDEO</span>'
			: '';

		card.innerHTML = `
			<div class="gallery-media-wrap">
				<img src="${previewImage}" alt="${item.title}" loading="lazy" />
				${mediaTag}
			</div>
			<h2>${item.title}</h2>
			<p class="gallery-date">${formatDate(item.date)}</p>
		`;

		// Open a larger view with NASA's full description text.
		card.addEventListener('click', () => {
			openModal(item);
		});

		// Support keyboard users: Enter or Space opens the same modal.
		card.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				openModal(item);
			}
		});

		gallery.appendChild(card);
	});
}

// Convert common video URLs (like YouTube) into embeddable URLs.
function getVideoEmbedUrl(videoUrl) {
	if (!videoUrl) {
		return '';
	}

	try {
		const url = new URL(videoUrl);

		if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
			const videoId = url.hostname.includes('youtu.be')
				? url.pathname.replace('/', '')
				: url.searchParams.get('v') || url.pathname.split('/').pop();

			if (!videoId) {
				return '';
			}

			return `https://www.youtube-nocookie.com/embed/${videoId}`;
		}

		if (url.pathname.includes('/embed/')) {
			return videoUrl;
		}
	} catch (error) {
		return '';
	}

	return '';
}

function openModal(item) {
	clearTimeout(closeModalTimer);
	imageModal.classList.remove('hidden');

	// Wait one frame so CSS can animate from hidden to visible.
	requestAnimationFrame(() => {
		imageModal.classList.add('show');
	});

	const isVideo = item.media_type === 'video';
	const embedUrl = getVideoEmbedUrl(item.url);

	if (isVideo) {
		modalImage.classList.add('is-hidden');
		modalImage.src = '';

		if (embedUrl) {
			modalVideo.src = embedUrl;
			modalVideo.classList.remove('is-hidden');
		} else {
			modalVideo.classList.add('is-hidden');
			modalVideo.src = '';
		}

		modalVideoLink.href = item.url;
		modalVideoLink.classList.remove('is-hidden');
	} else {
		modalVideo.classList.add('is-hidden');
		modalVideo.src = '';
		modalVideoLink.classList.add('is-hidden');
		modalVideoLink.href = '#';

		modalImage.src = item.hdurl || item.url;
		modalImage.alt = item.title;
		modalImage.classList.remove('is-hidden');
	}

	modalTitle.textContent = item.title;
	modalDate.textContent = formatDate(item.date);
	modalExplanation.textContent = item.explanation || 'No explanation is available for this image.';
	document.body.classList.add('modal-open');
}

function closeModal() {
	if (imageModal.classList.contains('hidden')) {
		return;
	}

	imageModal.classList.remove('show');
	document.body.classList.remove('modal-open');

	closeModalTimer = setTimeout(() => {
		imageModal.classList.add('hidden');
		modalImage.src = '';
		modalVideo.src = '';
	}, modalTransitionMs);
}

async function fetchSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		renderEmptyMessage('Choose both dates before loading space images.');
		return;
	}

	if (startDate > endDate) {
		renderEmptyMessage('Start date must be before end date.');
		return;
	}

	const start = new Date(startDate);
	const end = new Date(endDate);
	const millisecondsPerDay = 1000 * 60 * 60 * 24;
	const numberOfDays = Math.floor((end - start) / millisecondsPerDay) + 1;

	renderLoadingPlaceholders(numberOfDays);

	const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;

	try {
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error('Could not reach NASA API');
		}

		const data = await response.json();

		// Keep cards in date order from oldest to newest.
		const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

		renderGalleryCards(sortedData);
	} catch (error) {
		renderEmptyMessage('Something went wrong while loading images. Please try again.');
	}
}

getImagesButton.addEventListener('click', fetchSpaceImages);

closeModalButton.addEventListener('click', closeModal);

imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !imageModal.classList.contains('hidden')) {
		closeModal();
	}
});

showRandomSpaceFact();

// Load the default date range on first page visit.
fetchSpaceImages();
