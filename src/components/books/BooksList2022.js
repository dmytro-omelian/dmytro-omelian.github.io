import React from 'react';
import './BooksList.css';

const books = [
    { year: 2022, title: '🔥 Мовчазна пацієнтка', author: 'Алекс Майклідіс' },
    { year: 2022, title: '🔥 Справа про Гаррі Квеберта', author: 'Жоель Діккер' },
    { year: 2022, title: '🔥 Тривожні люди', author: 'Фредерік Бакман' },
    { year: 2022, title: 'One of us is lying', author: 'Karen M. McManus' },
    { year: 2022, title: 'Знайти час', author: 'Джейк Кнапп, Джон Зерацкі' },
    { year: 2022, title: 'Клуб убивств по четвергах', author: 'Річард Осман' },
    { year: 2022, title: 'Острів Дума', author: 'Стівен Кінг' },
];

function BooksList2022() {
    return (
        <div>
            <div className="books-by-year">
                <h3>2022</h3>
                <ul>
                    {books.slice().reverse().map((book, index) => (
                        <li key={index}>
                            <span className="book-title">{book.title}</span> by {book.author}
                        </li>
                    ))}
                </ul>
            </div>
            {/* You can add more years and books as needed */}
        </div>
    );
}

export default BooksList2022;
