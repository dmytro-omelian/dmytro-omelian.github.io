import BooksYearSection from './BooksYearSection';

const books = [
    { year: 2023, title: 'Напролом', author: 'Раян Голідей' },
    { year: 2023, title: 'Розгадка геніальності', author: 'Рон Фрідман' },
    { year: 2023, title: 'Creative personal branding', author: 'Jürgen Salenbacher' },
    { year: 2023, title: '🔥 Нові Стоїки', author: 'Массімо Пільюччі та Ґреґорі Лопес' },
    { year: 2023, title: 'Дар', author: 'Едіт Еґер' },
    { year: 2023, title: 'Зелене світло', author: 'Метью Макконагі' },
    { year: 2023, title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson' },
    { year: 2023, title: '🔥 Квіти для Елджернона', author: 'Деніел Кіз' },
    { year: 2023, title: 'Measure What Matters: How Google, Bono, and the Gates Foundation Rock the World with OKRs', author: 'John Doerr' },
    { year: 2023, title: 'Мізері', author: 'Стівен Кінг' },
    { year: 2023, title: '🔥 Аеропорт', author: 'Сергій Лойко' },
    { year: 2023, title: '🔥 Бог завжди подорожує інкогніто', author: 'Лоран Гунель' },
    { year: 2023, title: 'Син терориста', author: 'Зак Ебрагім' },
    { year: 2023, title: '🔥 Есенціалізм', author: 'Ґреґ Маккеон' },
    { year: 2023, title: 'Приховані малюнки', author: 'Джейсон Рекулак' },
    { year: 2023, title: 'Гвинтові сходи', author: 'Етель Ліна Вайт' },
];

function BooksList2023() {
    return <BooksYearSection year="2023" books={books} />;
}

export default BooksList2023;
