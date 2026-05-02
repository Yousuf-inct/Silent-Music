import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7MyV7nysiXC9DlswqDziEtuLUuSuBQPc",
    authDomain: "silentmusicc.firebaseapp.com",
    projectId: "silentmusicc",
    storageBucket: "silentmusicc.firebasestorage.app",
    messagingSenderId: "835192407422",
    appId: "1:835192407422:web:c342bdc56b206aa91d5f2f"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const audio = new Audio();
let playlist = [];
let currentIndex = 0;

// Elements
const songGrid = document.getElementById('song-grid');
const playPauseBtn = document.getElementById('play-pause');
const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume-bar');

// 1. AUTH LOGIC
document.getElementById('login-google').onclick = () => {
    signInWithPopup(auth, new GoogleAuthProvider());
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('greeting').innerText = `Welcome, ${user.displayName.split(' ')[0]}`;
        document.getElementById('login-google').innerText = "Logged In";
    }
});

// 2. FETCH SONGS
async function fetchSongs() {
    const querySnapshot = await getDocs(collection(db, "songs"));
    playlist = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderSongs();
}

function renderSongs() {
    songGrid.innerHTML = playlist.map((song, index) => `
        <div class="song-card bg-zinc-900/50 p-4 rounded-lg hover:bg-zinc-800 transition group cursor-pointer" onclick="playSong(${index})">
            <div class="relative mb-4">
                <img src="${song.coverURL}" class="w-full aspect-square object-cover rounded shadow-2xl">
                <div class="play-btn absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 translate-y-2 transition-all shadow-xl group-hover:opacity-100 group-hover:translate-y-0">
                    <i class="fa-solid fa-play text-black text-xl"></i>
                </div>
            </div>
            <h4 class="font-bold truncate">${song.title}</h4>
            <p class="text-sm text-gray-400 truncate">${song.artist}</p>
        </div>
    `).join('');
}

// 3. PLAYER CONTROLS
window.playSong = (index) => {
    currentIndex = index;
    const song = playlist[index];
    audio.src = song.fileURL;
    audio.play();
    
    document.getElementById('player-title').innerText = song.title;
    document.getElementById('player-artist').innerText = song.artist;
    document.getElementById('player-cover').src = song.coverURL;
    updatePlayIcon(true);
};

playPauseBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        updatePlayIcon(true);
    } else {
        audio.pause();
        updatePlayIcon(false);
    }
};

function updatePlayIcon(playing) {
    const icon = playPauseBtn.querySelector('i');
    icon.className = playing ? "fa-solid fa-pause text-black" : "fa-solid fa-play text-black";
}

// 4. PROGRESS & VOLUME
audio.ontimeupdate = () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.value = percent || 0;
    document.getElementById('current-time').innerText = formatTime(audio.currentTime);
    document.getElementById('duration-time').innerText = formatTime(audio.duration);
};

progressBar.oninput = () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
};

volumeBar.oninput = () => {
    audio.volume = volumeBar.value / 100;
};

document.getElementById('next').onclick = () => {
    currentIndex = (currentIndex + 1) % playlist.length;
    playSong(currentIndex);
};

document.getElementById('prev').onclick = () => {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playSong(currentIndex);
};

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

fetchSongs();

// Search Functionality
const searchInput = document.createElement('input'); 
// (Assume you add a search input with id 'search-bar' in your HTML)

const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    const filteredSongs = playlist.filter(song => 
        song.title.toLowerCase().includes(term) || 
        song.artist.toLowerCase().includes(term)
    );
    renderFilteredSongs(filteredSongs);
};

function renderFilteredSongs(songs) {
    songGrid.innerHTML = songs.map((song, index) => `
        <div class="song-card bg-zinc-900/50 p-4 rounded-lg hover:bg-zinc-800 transition group cursor-pointer" onclick="playSpecificSong('${song.id}')">
            <!-- Card Content Same as Before -->
        </div>
    `).join('');
}

// Global Play by ID
window.playSpecificSong = (id) => {
    const index = playlist.findIndex(s => s.id === id);
    if (index !== -1) playSong(index);
};

let isShuffle = false;
let isRepeat = false;

const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');

shuffleBtn.onclick = () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('text-green-500', isShuffle);
};

repeatBtn.onclick = () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('text-green-500', isRepeat);
};

// Autoplay next song logic
audio.onended = () => {
    if (isRepeat) {
        audio.play();
    } else if (isShuffle) {
        let nextIndex = Math.floor(Math.random() * playlist.length);
        playSong(nextIndex);
    } else {
        currentIndex = (currentIndex + 1) % playlist.length;
        playSong(currentIndex);
    }
};

// Add to app.js
window.toggleLike = async (songId) => {
    const user = auth.currentUser;
    if (!user) return alert("Please login to like songs!");

    const likeRef = doc(db, "likes", `${user.uid}_${songId}`);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        document.getElementById(`like-${songId}`).classList.replace('fa-solid', 'fa-regular');
    } else {
        await setDoc(likeRef, { userId: user.uid, songId: songId });
        document.getElementById(`like-${songId}`).classList.replace('fa-regular', 'fa-solid');
    }
};

async function getRecommendations(currentGenre) {
    const q = query(collection(db, "songs"), where("genre", "==", currentGenre), limit(5));
    const querySnapshot = await getDocs(q);
    const recs = querySnapshot.docs.map(doc => doc.data());
    
    const recContainer = document.getElementById('recommendations');
    recContainer.innerHTML = recs.map(song => `
        <div class="flex items-center gap-3 p-2 hover:bg-white/10 rounded cursor-pointer">
            <img src="${song.coverURL}" class="w-10 h-10 rounded">
            <div>
                <p class="text-sm font-medium">${song.title}</p>
                <p class="text-xs text-zinc-400">${song.artist}</p>
            </div>
        </div>
    `).join('');
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 64;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    
    const bars = document.querySelectorAll('.eq-bar');
    bars.forEach((bar, i) => {
        const height = dataArray[i] / 2;
        bar.style.height = `${height}px`;
    });
}

