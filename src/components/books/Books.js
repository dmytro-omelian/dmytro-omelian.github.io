import BooksList2025 from './BooksList2025';
import BooksList2024 from './BooksList2024';
import BooksList2023 from './BooksList2023';
import BooksList2022 from './BooksList2022';

import './BooksList.css';

function Books() {
    return (
        // <div className="markdown-container" dangerouslySetInnerHTML={{ __html: markdown }} />
        <div className="books-list-container">
            <h2 className='books-container-title'>An incomplete list of books that I've been reading lately...</h2>

            <BooksList2025 />
            <BooksList2024 />
            <BooksList2023 />
            <BooksList2022 />
        </div>
    );
}

export default Books;
