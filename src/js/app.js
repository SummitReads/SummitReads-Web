// 1. The Data: Easy to add new books here!
const trendingBooks = [
    {
        title: "Atomic Habits",
        author: "James Clear",
        category: "Psychology",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=60"
    },
    {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        category: "Finance",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df4?w=600&auto=format&fit=crop&q=60"
    },
    {
        title: "Deep Work",
        author: "Cal Newport",
        category: "Productivity",
        rating: "4.7",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60"
    },
    {
        title: "Thinking, Fast & Slow",
        author: "Daniel Kahneman",
        category: "Science",
        rating: "4.6",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=60"
    }
];

// 2. The Template: This builds the HTML for ONE card
function createCard(book) {
    return `
        <div class="card">
            <div class="card-image-container">
                <img src="${book.image}" alt="${book.title}" loading="lazy">
                <div class="card-overlay">
                    <button class="play-btn">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <h3>${book.title}</h3>
                <p class="author">${book.author}</p>
                <div class="card-meta">
                    <span class="tag">${book.category}</span>
                    <span class="rating">★ ${book.rating}</span>
                </div>
            </div>
        </div>
    `;
}

// 3. The Render Logic: Finds the grid and injects the cards
const gridContainer = document.getElementById('trending-grid');

if (gridContainer) {
    // Loop through data, create HTML, and join it all together
    gridContainer.innerHTML = trendingBooks.map(book => createCard(book)).join('');
}