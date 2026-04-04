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
    { title: 'Outliers', author: 'Malcolm Gladwell' },
    { title: '🔥 House of Huawei', author: 'Eva Dou' },
    {
      title: '🔥 The Nvidia Way: Jensen Huang and the Making of a Tech Giant',
      author: 'Tae Kim',
      relatedPostSlug: 'about-nvidia-way',
      relatedPostLabel: 'blog post',
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
    { title: 'Heart-Led Leadership (eng)', author: 'Tommy Spaulding' },
    { title: 'The Five Temptations of a CEO (eng)', author: 'Patrick Lencioni' },
    { title: 'Educated (ukr)', author: 'Tara Westover' },
    { title: '🔥 The Minds of Billy Milligan (ukr)', author: 'Daniel Keyes' },
    { title: 'Fooled by Randomness (eng, 1/2)', author: 'Nassim Nicholas Taleb' },
    { title: '🔥 Hell Yeah or No (eng)', author: 'Derek Sivers' },
    { title: '🔥 Traces on the Road (ukr)', author: 'Valerii Markus' },
    { title: 'The Gunslinger (The Dark Tower I) (ukr)', author: 'Stephen King' },
    {
      title: '🔥 The Almanack of Naval Ravikant (eng)',
      author: 'Eric Jorgenson',
      slug: 'the-almanack-of-naval-ravikant-eng',
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
    { title: 'White Ash (ukr)', author: 'Illarion Pavliuk' },
    { title: '🔥 Start with Why (eng)', author: 'Simon Sinek' },
    { title: '🔥 This Is Marketing (eng)', author: 'Seth Godin' },
    { title: 'The Fury (ukr)', author: 'Alex Michaelides' },
    { title: 'The Innovators (ukr)', author: 'Walter Isaacson' },
    { title: 'The Long Walk (ukr)', author: 'Stephen King' },
    { title: 'Trillion Dollar Coach (ukr)', author: 'Eric Schmidt, Jonathan Rosenberg, Alan Eagle' },
    { title: '🔥 How to Build a Billion Dollar Company (eng)', author: 'Guillaume Moubeche' },
    { title: 'Five Quarters of the Orange (ukr)', author: 'Joanne Harris' },
  ]),
  ...createSeedEntries(2024, [
    { title: 'The Lean Startup (eng)', author: 'Eric Ries' },
    { title: 'I See You Are Interested in Darkness (ukr)', author: 'Illarion Pavliuk' },
    { title: '🔥 Steve Jobs (ukr)', author: 'Walter Isaacson' },
    { title: 'Never Stop (ukr)', author: 'Mari Karachina' },
    { title: 'The Path (eng)', author: 'Konosuke Matsushita' },
    { title: 'The Monk Who Sold His Ferrari (ukr)', author: 'Robin Sharma' },
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
