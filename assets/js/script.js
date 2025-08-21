document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const audioPlayer = document.getElementById('audio-player');
    const visualizerCanvas = document.getElementById('visualizer');
    const nowPlayingTitle = document.getElementById('track-title');
    const playlistDiv = document.getElementById('playlist');
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    let audioContext;
    let analyser;
    let source;
    let bufferLength;
    let dataArray;
    let canvasCtx;

    // --- Smooth Scrolling for Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - document.querySelector('header').offsetHeight, // Adjust for fixed header
                    behavior: 'smooth'
                });
            }

            // Update active class for navigation
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Set initial active link based on URL hash or default to home
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        const initialLink = document.querySelector(`nav ul li a[href="#${initialHash}"]`);
        if (initialLink) {
            initialLink.classList.add('active');
        }
    } else {
        document.querySelector('nav ul li a[href="#home"]').classList.add('active');
    }

    // --- Audio Player and Visualizer ---
    const playlist = [
        { title: 'Melodic Voyage', src: 'assets/audio/melodic-voyage-by-dj-nacho-pereira.mp3' },
        { title: 'Cybernetic Dreams', src: 'assets/audio/cybernetic-dreams.mp3' },
        { title: 'Neon Pulse', src: 'assets/audio/neon-pulse.mp3' },
        { title: 'Cyberpunk Plattforms', src: 'assets/audio/cyberpunk-plattforms.mp3' }
    ];

    function initializeAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; // Fast Fourier Transform size
            bufferLength = analyser.frequencyBinCount; // Half of fftSize
            dataArray = new Uint8Array(bufferLength);

            source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            canvasCtx = visualizerCanvas.getContext('2d');
            drawVisualizer();
        }
    }

    function renderPlaylist() {
        playlistDiv.innerHTML = '';
        playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.classList.add('playlist-item');
            item.dataset.index = index;
            item.innerHTML = `<span>${track.title}</span>`;
            playlistDiv.appendChild(item);

            item.addEventListener('click', () => {
                loadTrack(index);
                audioPlayer.play();
            });
        });
    }

    function loadTrack(index) {
        const selectedTrack = playlist[index];
        audioPlayer.src = selectedTrack.src;
        audioPlayer.load(); // Explicitly load the audio
        console.log('Loading track:', selectedTrack.title, 'from:', selectedTrack.src);
        nowPlayingTitle.textContent = selectedTrack.title;

        // Update active class in playlist
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.playlist-item[data-index="${index}"]`).classList.add('active');

        // Initialize audio context only when user interacts
        initializeAudioContext();
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);

        if (!analyser) return; // Ensure analyser is initialized

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i];

            // Gradient for bars
            const gradient = canvasCtx.createLinearGradient(0, visualizerCanvas.height, 0, 0);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${barHeight / 255})`); // Cyan
            gradient.addColorStop(1, `rgba(255, 0, 255, ${barHeight / 255})`); // Magenta
            canvasCtx.fillStyle = gradient;

            canvasCtx.fillRect(x, visualizerCanvas.height - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1; // Add a small gap between bars
        }
    }

    // Resize canvas when window resizes
    function resizeCanvas() {
        visualizerCanvas.width = visualizerCanvas.offsetWidth;
        visualizerCanvas.height = visualizerCanvas.offsetHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial resize

    // Load the first track by default
    if (playlist.length > 0) {
        renderPlaylist();
        loadTrack(0);
        console.log('Playlist rendered and first track loaded. Click a playlist item to play.');
    }

    // --- Contact Form Submission ---
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formStatus.textContent = 'Sending...';
        formStatus.style.color = 'var(--accent-color-blue)';

        const formData = new FormData(contactForm);
        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                formStatus.textContent = "Message sent successfully! I'll get back to you soon.";
                formStatus.style.color = 'var(--accent-color-magenta)';
                contactForm.reset();
            } else {
                const data = await response.json();
                if (Object.hasOwnProperty.call(data, 'errors')) {
                    formStatus.textContent = data.errors.map(error => error.message).join(', ');
                } else {
                    formStatus.textContent = 'Oops! There was a problem sending your message.';
                }
                formStatus.style.color = 'red';
            }
        } catch (error) {
            formStatus.textContent = 'Network error. Please try again later.';
            formStatus.style.color = 'red';
            console.error('Form submission error:', error);
        }
    });
});
