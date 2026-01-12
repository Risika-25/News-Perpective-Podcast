speechSynthesis.cancel();
const api_key = '92afbf99edcf4f67ab3cd30b845f737d'
const news_api_url = 'https://newsapi.org/v2/everything';

const searchInput = document.querySelector('#searchInput');
const searchBtn = document.querySelector('#searchBtn');
const loading = document.querySelector('#loading');
const error = document.querySelector('#error');
const articlesContainer = document.querySelector('#articlesContainer');
const audioControls = document.querySelector('#audioControls');
const playAllBtn = document.querySelector('#playAllBtn');
const stopBtn = document.querySelector('#stopBtn');
const currentlyPlaying = document.querySelector('#currentlyPlaying');


let articles=[];
let isplaying = false;
let currentindex = 0;

searchBtn.addEventListener("click",searchnews);
searchInput.addEventListener("keypress",(e)=>{
    if(e.key == 'Enter'){
        searchnews();
    }
});

playAllBtn.addEventListener("click",playall);
stopBtn.addEventListener("click",stopaudio);

async function searchnews() {
    const query = searchInput.value.trim();
    
    if(!query){
        showError('Please enter a search topic!');
        return;
    }
     speechSynthesis.cancel();
    isplaying = false;
    currentArticleIndex = 0;
    
    if (currentlyPlaying) {
        currentlyPlaying.textContent = '';
    }
    if (playAllBtn) {
        playAllBtn.disabled = false;
        playAllBtn.style.opacity = '1';
    }
    
    document.querySelectorAll('.article-card').forEach(card => {
        card.classList.remove('playing');
    });

    loading.classList.remove('hidden');
    error.classList.add('hidden');
    articlesContainer.innerHTML = '';
    audioControls.classList.add('hidden');

    try{
       const url = `${news_api_url}?qInTitle=${encodeURIComponent(query)}&apiKey=${api_key}&pageSize=30&language=en&sortBy=publishedAt`;
        const response = await fetch(url);
        const data = await response.json();

        loading.classList.add('hidden');

        if(data.status == 'error'){
            showError(`API ERROR: ${data.message}`);
            return;
        }
        if(!data.articles || data.articles.length == 0){
            showError('Sorry! No articles found. Try a different topic!');
            return;
        }

        const diverseArticles = getTopArticlesFromDifferentSources(data.articles, 3);
        if (diverseArticles.length === 0) {
            showError('No articles with descriptions found. Try a different topic!');
            return;
        }
        articles = diverseArticles;
        displayArticles(articles);

        audioControls.classList.remove('hidden');
    }
    catch(err){
        loading.classList.add('hidden');
        showError('Failed to fetch news. Check your Internet Connection!');
        console.error('Error:',err);
    }
}
function getTopArticlesFromDifferentSources(articles,count){
    const uniqueSources = [];
    const selectedArticles = [];
    for(let article of articles){
        if(uniqueSources.includes(article.source.name)){
            continue;
        }
        if (!article.description || article.description.trim() === '') {
            continue;
        }
        if (article.title === '[Removed]') {
            continue;
        }
        uniqueSources.push(article.source.name);
        selectedArticles.push(article);
        if (selectedArticles.length >= count) {
            break;
        }
    }
    return selectedArticles;
}

function displayArticles(articles){
    articlesContainer.innerHTML='';
    articles.forEach((article,index) => {
        const articleCard = document.createElement('div');
        articleCard.className = 'article-card';
        articleCard.id = `article-${index}`;

        articleCard.innerHTML=`
            <div class="source-name">${article.source.name}</div>
            ${article.urlToImage ? `<img src="${article.urlToImage}" alt="Article image" class="article-image" onerror="this.style.display='none'">` : ''}
            <h3 class="article-title">${article.title}</h3>
            <p class="article-description">${article.description || 'No description available.'}</p>
            <a href="${article.url}" target="_blank" class="article-link">Read Full Article →</a>
        `;
        articlesContainer.appendChild(articleCard);
    });
}

function playall(){
    if(articles.length === 0) return;
    speechSynthesis.cancel();
    isplaying= true;
    currentindex=0;

    playAllBtn.disabled = true;
    playAllBtn.style.opacity = '0.5';

    playnext();
}

function playnext(){
    if(!isplaying || currentindex>=articles.length){
        stopaudio();
        return;
    }
    const article = articles[currentindex];

    document.querySelectorAll('.article-card').forEach(card => {
        card.classList.remove('playing');
    });
    document.getElementById(`article-${currentindex}`).classList.add('playing');
    
    currentlyPlaying.textContent = `🔊 Now playing: ${article.source.name}'s perspective`;
    
    const text = `According to ${article.source.name}: ${article.title}. ${article.description || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        utterance.voice = voices[currentindex % voices.length];
    }
    
    
    utterance.rate = 1.0; 
    utterance.pitch = 1.0; 
    utterance.volume = 1.0; 
    
    
    utterance.onend = () => {
        currentindex++;
        setTimeout(() => playnext(), 1000); 
    };
    
    utterance.onerror = (e) => {
        console.error('Speech error:', e);
        currentindex++;
        playnext();
    };
    
    speechSynthesis.speak(utterance);
}

function stopaudio(){
    speechSynthesis.cancel();
    isplaying= false;
    currentindex=0;

    currentlyPlaying.textContent='';
    playAllBtn.disabled=false;
    playAllBtn.style.opacity='1';
    document.querySelectorAll('.article-card').forEach(card => {
        card.classList.remove('playing');
    });
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
}

speechSynthesis.getVoices();
window.speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
};
window.addEventListener('beforeunload', () => {
    speechSynthesis.cancel();
});


console.log('🎙️ News Perspective Podcast is ready!');