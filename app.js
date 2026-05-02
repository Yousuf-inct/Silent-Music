import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7MyV7nysiXC9DlswqDziEtuLUuSuBQPc",
    authDomain: "silentmusicc.firebaseapp.com",
    projectId: "silentmusicc",
    storageBucket: "silentmusicc.firebasestorage.app",
    messagingSenderId: "835192407422",
    appId: "1:835192407422:web:c342bdc56b206aa91d5f2f"
};

class SilentApp {
    constructor() {
        this.firebase = initializeApp(firebaseConfig);
        this.db = getFirestore(this.firebase);
        this.auth = getAuth(this.firebase);
        this.audio = new Audio();
        
        // State
        this.currentQueue = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        
        this.init();
    }

    async init() {
        this.registerEventListeners();
        await this.loadInitialContent();
        this.setupAuthObserver();
    }

    registerEventListeners() {
        // Play/Pause
        document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayback());
        
        // Auth
        document.getElementById('auth-trigger').addEventListener('click', () => this.handleAuth());

        // Audio Engine Events
        this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.audio.addEventListener('ended', () => this.playNext());

        // Progress Bar
        const seekSlider = document.getElementById('seek-slider');
        seekSlider.addEventListener('click', (e) => {
            const rect = seekSlider.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = pos * this.audio.duration;
        });
    }

    async loadInitialContent() {
        const songsRef = collection(this.db, "songs");
        const q = query(songsRef, limit(10));
        const snapshot = await getDocs(q);
        
        const featuredShelf = document.getElementById('featured-shelf');
        featuredShelf.innerHTML = ''; // Clear Skeletons

        snapshot.forEach(doc => {
            const song = { id: doc.id, ...doc.data() };
            this.currentQueue.push(song);
            featuredShelf.appendChild(this.createMediaCard(song));
        });
    }

    createMediaCard(song) {
        const card = document.createElement('div');
        card.className = 'song-card'; // Add .song-card styling in CSS
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${song.coverURL}" alt="${song.title}">
                <button class="play-overlay"><i class="fa-solid fa-play"></i></button>
            </div>
            <div class="card-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>
        `;
        card.addEventListener('click', () => this.loadTrack(song));
        return card;
    }

    loadTrack(song) {
        this.audio.src = song.fileURL;
        document.getElementById('track-title').textContent = song.title;
        document.getElementById('track-artist').textContent = song.artist;
        document.getElementById('track-art').src = song.coverURL;
        
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayButton();
    }

    togglePlayback() {
        if (!this.audio.src) return;
        this.isPlaying ? this.audio.pause() : this.audio.play();
        this.isPlaying = !this.isPlaying;
        this.updatePlayButton();
    }

    updatePlayButton() {
        const icon = document.querySelector('#play-pause-btn i');
        icon.className = this.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }

    handleTimeUpdate() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        document.getElementById('seek-progress').style.width = `${progress}%`;
        document.getElementById('current-time').textContent = this.formatTime(this.audio.currentTime);
        document.getElementById('total-time').textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Auth Implementation
    async handleAuth() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(this.auth, provider);
            console.log("Logged in:", result.user.displayName);
        } catch (error) {
            console.error("Auth failed:", error);
        }
    }

    setupAuthObserver() {
        this.auth.onAuthStateChanged(user => {
            const label = document.getElementById('user-display-name');
            label.textContent = user ? user.displayName : "Sign In";
        });
    }
}

// Start Application
const app = new SilentApp();
