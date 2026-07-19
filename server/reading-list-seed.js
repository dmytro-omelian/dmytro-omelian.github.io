function slugifyReadingListValue(input) {
  return String(input ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createSeedEntries(year, books) {
  return books.map((book, index, collection) => ({
    year,
    title: book.title,
    author: book.author,
    slug: book.slug || null,
    summaryMarkdown: book.summaryMarkdown || null,
    relatedPostSlug: book.relatedPostSlug || null,
    relatedPostLabel: book.relatedPostLabel || null,
    finishedOn: book.finishedOn || null,
    score: book.score ?? null,
    sortOrder: collection.length - index - 1,
  }));
}

function assignSeedSlugs(entries) {
  const usedSlugs = new Set();

  return entries.map((entry) => {
    const baseSlug = slugifyReadingListValue(entry.slug || entry.title) || 'book';
    let candidateSlug = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(candidateSlug)) {
      candidateSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    usedSlugs.add(candidateSlug);

    return {
      ...entry,
      slug: candidateSlug,
    };
  });
}

const legacyReadingListEntries = assignSeedSlugs([
  ...createSeedEntries(2026, [
    {
      title: "🔥 An Astronaut's Guide to Life on Earth",
      author: 'Chris Hadfield',
      finishedOn: '2026-07-19',
      score: 5,
    },
    {
      title: 'Найбагатша людина у Вавилоні',
      author: 'Джордж Клейсон',
      finishedOn: '2026-07-15',
      score: 4,
    },
    {
      title: '21 лист про життя і його виклики',
      author: 'Чарльз Генді',
      finishedOn: '2026-07-15',
      score: 4,
    },
    {
      title: 'Снігова куля. Воррен Баффет і справа життя',
      author: 'Еліс Шредер',
      finishedOn: '2026-07-11',
      score: 4,
    },
    {
      title: 'Writing About Your Life',
      author: 'William Zinsser',
      finishedOn: '2026-04-04',
      score: 3.5,
    },
    { title: '🔥 House of Huawei', author: 'Eva Dou', finishedOn: '2026-02-13', score: 5 },
    { title: 'Outliers', author: 'Malcolm Gladwell', finishedOn: '2026-01-17', score: 3 },
    {
      title: '🔥 The Nvidia Way: Jensen Huang and the Making of a Tech Giant',
      author: 'Tae Kim',
      relatedPostSlug: 'about-nvidia-way',
      relatedPostLabel: 'blog post',
      finishedOn: '2026-01-11',
      score: 5,
    },
    {
      title: '🔥 The Art of Learning',
      author: 'Josh Waitzkin',
      slug: 'the-art-of-learning',
      summaryMarkdown: [
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
  ]),
  ...createSeedEntries(2025, [
    { title: 'From Zero to One', author: 'Peter Thiel', finishedOn: '2025-12-30', score: 4 },
    { title: 'MANIAC', author: 'Benjamín Labatut', finishedOn: '2025-12-08', score: 5 },
    {
      title: 'Man’s Search for Meaning',
      author: 'Viktor Frankl',
      finishedOn: '2025-12-03',
      score: 3,
      summaryMarkdown: [
        'maybe not the right time for me',
        'a bit complicated',
        'expected more',
      ].join('\n'),
    },
    { title: "П'ять четвертинок апельсина", author: 'Joanne Harris', finishedOn: '2025-10-30', score: 4, summaryMarkdown: 'just a nice story; nothing crazy' },
    {
      title: '🔥 How to Build a Billion Dollar Company',
      author: 'Guillaume Moubeche',
      finishedOn: '2025-10-09',
      score: 5,
      summaryMarkdown: [
        'read for 2 hours on the train',
        'easy to read',
        'read before it was published',
      ].join('\n'),
    },
    { title: 'Тренер на трильйон доларів', author: 'Eric Schmidt, Jonathan Rosenberg, Alan Eagle', finishedOn: '2025-09-20', score: 4 },
    { title: 'Довга хода', author: 'Stephen King', finishedOn: '2025-09-10', score: 5 },
    { title: 'Інноватори', author: 'Walter Isaacson', finishedOn: '2025-08-29', score: 3 },
    {
      title: 'Лють',
      author: 'Alex Michaelides',
      finishedOn: '2025-08-22',
      score: 4,
      summaryMarkdown: [
        '1) very easy to read and simply interesting',
        '2) not mind-blowing, but a good road book',
      ].join('\n'),
    },
    { title: '🔥 This Is Marketing', author: 'Seth Godin', finishedOn: '2025-07-15', score: 5 },
    { title: '🔥 Start with Why', author: 'Simon Sinek', finishedOn: '2025-07-15', score: 4 },
    { title: 'Білий попіл', author: 'Illarion Pavliuk', finishedOn: '2025-07-10', score: 4 },
    {
      title: '🔥 The Almanack of Naval Ravikant',
      author: 'Eric Jorgenson',
      slug: 'the-almanack-of-naval-ravikant-eng',
      finishedOn: '2025-05-31',
      score: 5,
      summaryMarkdown: [
        'score: 5/5',
        '',
        "the book i've read maybe 4 times this year 🤓",
        '',
        `hard to count, because this book has a weird "reading problem" (and a big advantage):`,
        '',
        'you don’t read it like a normal book',
        'you can start from any page',
        'just open it and go',
        '',
        'sometimes i even scroll through the chapter titles first',
        'pick what matches my mood and then dive in',
        '',
        'the almanack of naval ravikant, made by Eric Jorgenson',
        '',
        'this book is very valuable and you can learn about:',
        '',
        '- leverage (build once, earn many times)',
        '- clear thinking + decision making (taste, judgment, long-term games)',
        '- happiness as a skill (calm, desire, inner peace)',
        '',
        "but there is a little drawback (and maybe it's intentional)",
        '',
        'some parts feel like pure conclusions',
        'and i keep thinking',
        'wait, how did Naval get there',
        'what was the chain of thought, etc.',
        '',
        '(Yuriy Zaremba, now i finally understood what you meant)',
        '',
        'p.s. i first read the free online version on my tablet',
        'then i got the paperback from Bohdan Mykhailiv (thanks 🙌)',
      ].join('\n'),
    },
    { title: 'Стрілець (Темна вежа I)', author: 'Stephen King', finishedOn: '2025-05-20', score: 3 },
    { title: '🔥 Сліди на дорозі', author: 'Valerii Markus', finishedOn: '2025-04-28', score: 5 },
    { title: '🔥 Hell Yeah or No', author: 'Derek Sivers', finishedOn: '2025-04-15', score: 5 },
    { title: '🔥 Таємнича історія Біллі Міллігана', author: 'Daniel Keyes', finishedOn: '2025-03-20', score: 5 },
    { title: 'Fooled by Randomness (1/2)', author: 'Nassim Nicholas Taleb', finishedOn: '2025-03-13', score: 2 },
    { title: 'Освічена', author: 'Tara Westover', finishedOn: '2025-02-14', score: 3 },
    { title: 'The Five Temptations of a CEO', author: 'Patrick Lencioni', finishedOn: '2025-01-30', score: 3 },
    { title: 'Heart-Led Leadership', author: 'Tommy Spaulding', finishedOn: '2025-01-29', score: 3 },
  ]),
  ...createSeedEntries(2024, [
    { title: 'The Lean Startup', author: 'Eric Ries', finishedOn: '2024-12-29', score: 4, summaryMarkdown: '1. library' },
    { title: 'Я бачу, вас цікавить пітьма', author: 'Illarion Pavliuk', finishedOn: '2024-12-06', score: 4 },
    { title: '🔥 Стів Джобс', author: 'Walter Isaacson' },
    { title: 'Never Stop', author: 'Mari Karachina' },
    { title: 'The Path', author: 'Konosuke Matsushita' },
    { title: 'Монах, який продав свій Ferrari', author: 'Robin Sharma', score: 4 },
  ]),
  ...createSeedEntries(2023, [
    { title: 'Напролом', author: 'Раян Голідей' },
    { title: 'Розгадка геніальності', author: 'Рон Фрідман' },
    { title: 'Creative personal branding', author: 'Jürgen Salenbacher' },
    { title: '🔥 Нові Стоїки', author: 'Массімо Пільюччі та Ґреґорі Лопес' },
    { title: 'Дар', author: 'Едіт Еґер' },
    { title: 'Зелене світло', author: 'Метью Макконагі' },
    { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson' },
    { title: '🔥 Квіти для Елджернона', author: 'Деніел Кіз' },
    { title: 'Measure What Matters: How Google, Bono, and the Gates Foundation Rock the World with OKRs', author: 'John Doerr' },
    { title: 'Мізері', author: 'Стівен Кінг' },
    { title: '🔥 Аеропорт', author: 'Сергій Лойко' },
    { title: '🔥 Бог завжди подорожує інкогніто', author: 'Лоран Гунель' },
    { title: 'Син терориста', author: 'Зак Ебрагім' },
    { title: '🔥 Есенціалізм', author: 'Ґреґ Маккеон' },
    { title: 'Приховані малюнки', author: 'Джейсон Рекулак' },
    { title: 'Гвинтові сходи', author: 'Етель Ліна Вайт' },
  ]),
  ...createSeedEntries(2022, [
    { title: '🔥 Мовчазна пацієнтка', author: 'Алекс Майклідіс' },
    { title: '🔥 Справа про Гаррі Квеберта', author: 'Жоель Діккер' },
    { title: '🔥 Тривожні люди', author: 'Фредерік Бакман' },
    { title: 'One of us is lying', author: 'Karen M. McManus' },
    { title: 'Знайти час', author: 'Джейк Кнапп, Джон Зерацкі' },
    { title: 'Клуб убивств по четвергах', author: 'Річард Осман' },
    { title: 'Острів Дума', author: 'Стівен Кінг' },
  ]),
]);

module.exports = {
  legacyReadingListEntries,
};
