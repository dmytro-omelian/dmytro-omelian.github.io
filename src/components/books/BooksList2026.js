import BooksYearSection from './BooksYearSection';

const books = [
    { year: 2026, title: 'Outliers', author: 'Malcolm Gladwell' },
    { year: 2026, title: '🔥 House of Huawei', author: 'Eva Dou' },
    {
        year: 2026,
        title: '🔥 The Nvidia Way: Jensen Huang and the Making of a Tech Giant',
        author: 'Tae Kim',
        relatedPostSlug: 'about-nvidia-way',
        relatedPostLabel: 'blog post',
    },
    {
        year: 2026,
        title: '🔥 The Art of Learning',
        author: 'Josh Waitzkin',
        slug: 'the-art-of-learning',
        summary: [
            'In Feb, I read an amazing book, The Art of Learning, by Josh Waitzkin.',
            '',
            'He is an 8-time U.S. National Chess Champion, a 2-time World Champion in Tai Chi Chuan Push Hands, and a Brazilian Jiu-Jitsu black belt.',
            '',
            'A few quotes from the book I love:',
            '',
            '1. "I could spend hours at a chessboard and stand up from the experience on fire with insight about chess, basketball, the ocean, psychology, love, art."',
            '',
            '2. "Growth comes at the expense of previous comfort or safety."',
            '',
            '3. "When uncomfortable, my instinct is not to avoid the discomfort but to become at peace with it."',
            '',
            '4. "Sickness is the most potent ambassador for healthy living."',
            '',
            '5. "If I were ready, I would learn."',
            '',
            '6. "We have to be able to do something slowly before we can have any hope of doing it correctly with speed."',
            '',
            '7. "Thirty-minute visualization exercise" and "then I lay in bed visualizing until 3 A.M."',
            '',
            'and much more',
            '',
            'P.S. Unexpected coincidence from this book: I am back to playing chess 🥳 if you are interested in playing, ping me :)',
        ].join('\n'),
    },
];

function BooksList2026() {
    return <BooksYearSection year="2026" books={books} />;
}

export default BooksList2026;
