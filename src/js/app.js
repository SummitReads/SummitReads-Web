// Wait for the HTML to load completely before running scripts
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Search Functionality ---
    const searchInput = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Get the typed value and convert to lowercase for case-insensitive matching
            const searchTerm = e.target.value.toLowerCase().trim();

            cards.forEach(card => {
                // Find the title and author text within each card
                const titleElement = card.querySelector('.title');
                const authorElement = card.querySelector('.author');

                // Safety check: ensure elements exist before reading text
                if (titleElement && authorElement) {
                    const title = titleElement.textContent.toLowerCase();
                    const author = authorElement.textContent.toLowerCase();

                    // Check if the search term is found in the title OR the author
                    if (title.includes(searchTerm) || author.includes(searchTerm)) {
                        // Show card (using 'flex' to maintain original styling)
                        card.style.display = 'flex'; 
                    } else {
                        // Hide card
                        card.style.display = 'none';
                    }
                }
            });
        });
    }

    // --- 2. Filter Pills Interactivity ---
    // Currently visual only. Clicking a pill highlights it and un-highlights the others.
    const pills = document.querySelectorAll('.pill');
    
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Remove 'active' class from all pills
            pills.forEach(p => p.classList.remove('active'));
            
            // Add 'active' class to the clicked pill
            pill.classList.add('active');
            
            console.log(`Category selected: ${pill.textContent}`);
        });
    });

    // --- 3. Button Interactivity (Optional) ---
    // Adds a quick console log when buttons are clicked, just to test they work
    const buttons = document.querySelectorAll('.btn-card');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent default behavior if it's a link
            e.preventDefault();
            
            // Find the title of the book associated with this button
            const card = e.target.closest('.card');
            if (card) {
                const bookTitle = card.querySelector('.title').textContent;
                console.log(`Action clicked for book: ${bookTitle}`);
            }
        });
    });

});