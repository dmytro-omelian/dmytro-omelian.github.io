/**
 * Seed script for populating the bookshelf with books.
 * Run: node server/bookshelf-seed.js
 */
require('./loadEnv');

const {
  closePool,
  createBookshelfEntry,
  ensureDatabase,
  getBookshelfEntries,
  updateBookshelfEntry,
} = require('./db');

// ── Online books (from ebook files) ────────────────────────────────────────
const onlineBooks = [
  { title: '$100M Leads', author: 'Alex Hormozi', tags: ['business', 'marketing', 'sales'] },
  { title: 'The Talented Mr. Ripley', author: 'Patricia Highsmith', tags: ['fiction', 'thriller'] },
  { title: '507 Mechanical Movements', author: 'Henry T. Brown', tags: ['engineering', 'reference'] },
  { title: 'A Beautiful Mind', author: 'Sylvia Nasar', tags: ['biography', 'mathematics', 'science'] },
  { title: 'A Brief Guide to Stephen King', author: 'Paul Simpson', tags: ['literature', 'reference'] },
  { title: 'A Brief History of Intelligence', author: 'Max Bennett', tags: ['science', 'neuroscience', 'AI'] },
  { title: 'A Man for All Markets', author: 'Edward O. Thorp', tags: ['finance', 'memoir', 'mathematics'] },
  { title: "A Mathematician's Apology", author: 'G. H. Hardy', tags: ['mathematics', 'philosophy'] },
  { title: 'A Mind at Play', author: 'Jimmy Soni & Rob Goodman', tags: ['biography', 'science', 'mathematics'] },
  { title: 'A Random Walk Down Wall Street', author: 'Burton G. Malkiel', tags: ['finance', 'investing'] },
  { title: "A Supposedly Fun Thing I'll Never Do Again", author: 'David Foster Wallace', tags: ['essays', 'literature'] },
  { title: 'A Time of Gifts', author: 'Patrick Leigh Fermor', tags: ['travel', 'memoir'] },
  { title: 'A Course in Game Theory', author: 'Martin J. Osborne & Ariel Rubinstein', tags: ['mathematics', 'economics', 'game theory'] },
  { title: 'A Sense of Urgency', author: 'John P. Kotter', tags: ['business', 'leadership'] },
  { title: 'Adaptive Markets', author: 'Andrew W. Lo', tags: ['finance', 'economics', 'science'] },
  { title: 'Advanced Microservices', author: 'Thomas Hunter II', tags: ['software engineering', 'architecture'] },
  { title: 'Against the Gods', author: 'Peter L. Bernstein', tags: ['finance', 'history', 'risk'] },
  { title: 'AiSDR Series A Memo', author: 'AiSDR Team', tags: ['startups', 'AI', 'business'] },
  { title: 'Notes on the Synthesis of Form', author: 'Christopher Alexander', tags: ['design', 'architecture', 'systems'] },
  { title: 'Apple in China', author: 'Patrick McGee', tags: ['business', 'technology', 'geopolitics'] },
  { title: 'Foundation', author: 'Isaac Asimov', tags: ['fiction', 'science fiction'] },
  { title: 'Baddest Man', author: 'Shing Yin Khor', tags: ['fiction', 'graphic novel'] },
  { title: 'Basic Economics', author: 'Thomas Sowell', tags: ['economics', 'education'] },
  { title: 'Be Not Afraid of Life', author: 'William James', tags: ['philosophy', 'self-help'] },
  { title: 'Benjamin Franklin: An American Life', author: 'Walter Isaacson', tags: ['biography', 'history'] },
  { title: 'Berkshire Hathaway Letters to Shareholders', author: 'Warren Buffett', tags: ['investing', 'business', 'finance'] },
  { title: 'Beyond Thoughts', author: 'Joseph Nguyen', tags: ['philosophy', 'self-help', 'mindfulness'] },
  { title: 'Blitzscaling', author: 'Reid Hoffman & Chris Yeh', tags: ['startups', 'business', 'technology'] },
  { title: 'Beyond Order', author: 'Jordan B. Peterson', tags: ['psychology', 'self-help', 'philosophy'] },
  { title: 'Brave New World', author: 'Aldous Huxley', tags: ['fiction', 'dystopia', 'classic'] },
  { title: 'Breakneck', author: 'Catherine Coulter', tags: ['fiction', 'thriller'] },
  { title: 'Building Microservices', author: 'Sam Newman', tags: ['software engineering', 'architecture'] },
  { title: 'Business Adventures', author: 'John Brooks', tags: ['business', 'finance', 'history'] },
  { title: 'Capital, Volume I', author: 'Karl Marx', tags: ['economics', 'philosophy', 'politics'] },
  { title: 'Careless People', author: 'Sarah Churchwell', tags: ['literature', 'history'] },
  { title: 'Chess Story', author: 'Stefan Zweig', tags: ['fiction', 'classic', 'chess'] },
  { title: 'Chokepoints', author: 'Edward Geist', tags: ['geopolitics', 'technology', 'economics'] },
  { title: 'Coders at Work', author: 'Peter Seibel', tags: ['software engineering', 'interviews'] },
  { title: 'Good to Great', author: 'Jim Collins', tags: ['business', 'leadership', 'management'] },
  { title: 'Conversations with God, Volume 3', author: 'Neale Donald Walsch', tags: ['spirituality', 'philosophy'] },
  { title: 'Creativity, Inc.', author: 'Ed Catmull & Amy Wallace', tags: ['business', 'creativity', 'leadership'] },
  { title: 'Damn Right!', author: 'Janet Lowe', tags: ['biography', 'investing', 'business'] },
  { title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio & Aaron Courville', tags: ['AI', 'machine learning', 'computer science'] },
  { title: 'Deep Work', author: 'Cal Newport', tags: ['productivity', 'self-help'] },
  { title: 'Democracy in America', author: 'Alexis de Tocqueville', tags: ['politics', 'history', 'philosophy'] },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', tags: ['software engineering', 'architecture', 'databases'] },
  { title: 'Disciplined Entrepreneurship Workbook', author: 'Bill Aulet', tags: ['startups', 'business', 'entrepreneurship'] },
  { title: 'Dive into Deep Learning', author: 'Aston Zhang, Zachary C. Lipton, Mu Li & Alexander J. Smola', tags: ['AI', 'machine learning', 'computer science'] },
  { title: "Don't Believe Everything You Think", author: 'Joseph Nguyen', tags: ['self-help', 'mindfulness', 'psychology'] },
  { title: 'Draft No. 4', author: 'John McPhee', tags: ['writing', 'essays'] },
  { title: 'Eat and Run', author: 'Scott Jurek', tags: ['memoir', 'sports', 'health'] },
  { title: 'Economics 101', author: 'Alfred Mill', tags: ['economics', 'education'] },
  { title: 'Engineering in Plain Sight', author: 'Grady Hillhouse', tags: ['engineering', 'science', 'infrastructure'] },
  { title: 'The Almanack of Naval Ravikant', author: 'Eric Jorgenson', tags: ['philosophy', 'business', 'self-help'] },
  { title: 'The Essays of Warren Buffett', author: 'Warren Buffett & Lawrence A. Cunningham', tags: ['investing', 'business', 'finance'] },
  { title: 'Essays', author: 'Michel de Montaigne', tags: ['philosophy', 'essays', 'classic'] },
  { title: 'Everything You Want Is on the Other Side of Hard', author: 'Alex Hormozi', tags: ['business', 'self-help', 'motivation'] },
  { title: 'Excellent Advice for Living', author: 'Kevin Kelly', tags: ['self-help', 'philosophy', 'wisdom'] },
  { title: 'Extreme Ownership', author: 'Jocko Willink & Leif Babin', tags: ['leadership', 'military', 'business'] },
  { title: 'F. Scott Fitzgerald on Writing', author: 'F. Scott Fitzgerald', tags: ['writing', 'literature'] },
  { title: 'FCO: Fundamental Chess Openings', author: 'Paul van der Sterren', tags: ['chess', 'reference'] },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury', tags: ['fiction', 'dystopia', 'classic'] },
  { title: 'Fairy Tale', author: 'Stephen King', tags: ['fiction', 'fantasy'] },
  { title: "Fortune's Formula", author: 'William Poundstone', tags: ['finance', 'mathematics', 'history'] },
  { title: 'Games and Decisions', author: 'R. Duncan Luce & Howard Raiffa', tags: ['mathematics', 'game theory', 'economics'] },
  { title: 'Getting Things Done', author: 'David Allen', tags: ['productivity', 'self-help', 'business'] },
  { title: 'Good Strategy Bad Strategy', author: 'Richard Rumelt', tags: ['business', 'strategy'] },
  { title: 'Gödel, Escher, Bach: An Eternal Golden Braid', author: 'Douglas R. Hofstadter', tags: ['mathematics', 'philosophy', 'computer science'] },
  { title: 'Hackers & Painters', author: 'Paul Graham', tags: ['technology', 'essays', 'startups'] },
  { title: 'Hateship, Friendship, Courtship, Loveship, Marriage', author: 'Alice Munro', tags: ['fiction', 'short stories'] },
  { title: 'Hidden Systems', author: 'Dan Nott', tags: ['technology', 'infrastructure', 'graphic novel'] },
  { title: 'History Matters', author: 'Judith M. Bennett', tags: ['history', 'historiography'] },
  { title: 'House of Huawei', author: 'Eva Dou', tags: ['business', 'technology', 'geopolitics'] },
  { title: 'How I Won a Nobel Prize', author: 'Julius Taranto', tags: ['fiction', 'satire'] },
  { title: 'How I Read', author: 'Henrik Karlsson', tags: ['essays', 'reading', 'self-help'] },
  { title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', tags: ['self-help', 'communication', 'classic'] },
  { title: 'How to Avoid a Climate Disaster', author: 'Bill Gates', tags: ['science', 'climate', 'technology'] },
  { title: 'How to Build a Billion Dollar Company', author: 'Various', tags: ['startups', 'business'] },
  { title: 'How to Create a Mind', author: 'Ray Kurzweil', tags: ['AI', 'neuroscience', 'technology'] },
  { title: 'How to Solve It', author: 'George Pólya', tags: ['mathematics', 'problem solving', 'education'] },
  { title: 'How the World Really Works', author: 'Vaclav Smil', tags: ['science', 'energy', 'economics'] },
  { title: 'How to Prevent the Next Pandemic', author: 'Bill Gates', tags: ['science', 'health', 'policy'] },
  { title: 'How to Read a Book', author: 'Mortimer J. Adler & Charles Van Doren', tags: ['education', 'reading', 'self-help'] },
  { title: 'I Am That', author: 'Sri Nisargadatta Maharaj', tags: ['spirituality', 'philosophy'] },
  { title: 'I Am a Strange Loop', author: 'Douglas R. Hofstadter', tags: ['philosophy', 'consciousness', 'mathematics'] },
  { title: 'Proofs and Refutations', author: 'Imre Lakatos', tags: ['mathematics', 'philosophy of science'] },
  { title: "In the Buddha's Words", author: 'Bhikkhu Bodhi', tags: ['spirituality', 'Buddhism', 'philosophy'] },
  { title: 'Into the Wild', author: 'Jon Krakauer', tags: ['memoir', 'adventure', 'nature'] },
  { title: 'Invent and Wander', author: 'Jeff Bezos & Walter Isaacson', tags: ['business', 'technology', 'biography'] },
  { title: 'Jack Welch GE Annual Letters', author: 'Jack Welch', tags: ['business', 'leadership', 'management'] },
  { title: 'The Remains of the Day', author: 'Kazuo Ishiguro', tags: ['fiction', 'classic', 'literature'] },
  { title: 'Kissinger', author: 'Walter Isaacson', tags: ['biography', 'politics', 'history'] },
  { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', tags: ['fiction', 'AI', 'literature'] },
  { title: 'Kleptopia', author: 'Tom Burgis', tags: ['politics', 'finance', 'investigative'] },
  { title: 'Kubernetes: Up and Running', author: 'Brendan Burns, Joe Beda & Kelsey Hightower', tags: ['software engineering', 'DevOps', 'cloud'] },
  { title: 'Lab Girl', author: 'Hope Jahren', tags: ['memoir', 'science'] },
  { title: "Leaving Isn't the Hardest Thing", author: 'Lauren Hough', tags: ['memoir', 'essays'] },
  { title: 'Leonardo da Vinci', author: 'Walter Isaacson', tags: ['biography', 'art', 'history'] },
  { title: 'Lessons of History', author: 'Will Durant & Ariel Durant', tags: ['history', 'philosophy'] },
  { title: 'Letters from a Stoic', author: 'Seneca', tags: ['philosophy', 'Stoicism', 'classic'] },
  { title: 'Life Is a Miracle', author: 'Wendell Berry', tags: ['philosophy', 'nature', 'essays'] },
  { title: 'Market Wizards', author: 'Jack D. Schwager', tags: ['finance', 'investing', 'interviews'] },
  { title: 'Marketing Moonshots', author: 'Tom Orbach', tags: ['marketing', 'business'] },
  { title: 'Mathematics for Computer Science', author: 'Eric Lehman, F. Thomson Leighton & Albert R. Meyer', tags: ['mathematics', 'computer science'] },
  { title: 'Play Nice But Win', author: 'Michael Dell', tags: ['biography', 'business', 'technology'] },
  { title: 'Modern Chess Openings', author: 'Nick de Firmian', tags: ['chess', 'reference'] },
  { title: 'My 60 Memorable Games', author: 'Bobby Fischer', tags: ['chess', 'memoir'] },
  { title: 'Narrative Economics', author: 'Robert J. Shiller', tags: ['economics', 'finance', 'behavioral science'] },
  { title: 'Nicomachean Ethics', author: 'Aristotle', tags: ['philosophy', 'ethics', 'classic'] },
  { title: 'Nine Things I Learned in Ninety Years', author: 'Henry Kissinger', tags: ['memoir', 'politics', 'wisdom'] },
  { title: 'No Country for Old Men', author: 'Cormac McCarthy', tags: ['fiction', 'thriller', 'literature'] },
  { title: 'No Filter: The Inside Story of Instagram', author: 'Sarah Frier', tags: ['business', 'technology', 'social media'] },
  { title: "Nobody's Girl", author: 'Hector Malot', tags: ['fiction', 'classic'] },
  { title: 'On Writing Well', author: 'William Zinsser', tags: ['writing', 'education'] },
  { title: 'On the Measure of Intelligence', author: 'François Chollet', tags: ['AI', 'computer science', 'research'] },
  { title: 'On the Origin of Species', author: 'Charles Darwin', tags: ['science', 'biology', 'classic'] },
  { title: 'On the Road', author: 'Jack Kerouac', tags: ['fiction', 'classic', 'literature'] },
  { title: 'One Thousand Ways to Make $1000', author: 'F. C. Minaker', tags: ['business', 'finance', 'classic'] },
  { title: 'Only the Paranoid Survive', author: 'Andrew S. Grove', tags: ['business', 'technology', 'leadership'] },
  { title: 'Open: An Autobiography', author: 'Andre Agassi', tags: ['memoir', 'sports'] },
  { title: 'Operating Systems: Three Easy Pieces', author: 'Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau', tags: ['computer science', 'operating systems'] },
  { title: 'Outlive', author: 'Peter Attia', tags: ['health', 'science', 'longevity'] },
  { title: 'Outside the Box', author: 'Marc Levinson', tags: ['business', 'history', 'economics'] },
  { title: 'The Outsider', author: 'Albert Camus', tags: ['fiction', 'philosophy', 'classic'] },
  { title: 'Patriot', author: 'Alexei Navalny', tags: ['memoir', 'politics', 'history'] },
  { title: 'Permanent Record', author: 'Edward Snowden', tags: ['memoir', 'technology', 'politics'] },
  { title: 'Positioning', author: 'Al Ries & Jack Trout', tags: ['marketing', 'business'] },
  { title: 'Possession', author: 'A. S. Byatt', tags: ['fiction', 'literature'] },
  { title: 'Pre-Suasion', author: 'Robert Cialdini', tags: ['psychology', 'marketing', 'persuasion'] },
  { title: 'Principles', author: 'Ray Dalio', tags: ['business', 'philosophy', 'investing'] },
  { title: 'Project Hail Mary', author: 'Andy Weir', tags: ['fiction', 'science fiction'] },
  { title: 'Proof or Bluff: Evaluating LLMs on 2025 USA Math Olympiad', author: 'Various Researchers', tags: ['AI', 'mathematics', 'research'] },
  { title: 'Purpose and Profit', author: 'Dan Koe', tags: ['business', 'self-help', 'entrepreneurship'] },
  { title: 'Quantum Computation and Quantum Information', author: 'Michael A. Nielsen & Isaac L. Chuang', tags: ['physics', 'computer science', 'quantum'] },
  { title: 'Reality Is Not What It Seems', author: 'Carlo Rovelli', tags: ['physics', 'science', 'philosophy'] },
  { title: 'Reentry', author: 'Eric Berger', tags: ['biography', 'technology', 'space'] },
  { title: 'Reminiscences of a Stock Operator', author: 'Edwin Lefèvre', tags: ['finance', 'investing', 'classic'] },
  { title: 'The Path of Least Resistance', author: 'Robert Fritz', tags: ['creativity', 'self-help', 'philosophy'] },
  { title: 'Seeing Like a State', author: 'James C. Scott', tags: ['politics', 'history', 'economics'] },
  { title: 'Self-Reliance and Other Essays', author: 'Ralph Waldo Emerson', tags: ['philosophy', 'essays', 'classic'] },
  { title: 'Shoe Dog', author: 'Phil Knight', tags: ['memoir', 'business', 'entrepreneurship'] },
  { title: 'How to Live', author: 'Derek Sivers', tags: ['philosophy', 'self-help'] },
  { title: 'Hell Yeah or No', author: 'Derek Sivers', tags: ['self-help', 'philosophy', 'essays'] },
  { title: 'Six Stories', author: 'Matt Wesolowski', tags: ['fiction', 'thriller', 'mystery'] },
  { title: 'Softwar', author: 'Matthew Symonds', tags: ['biography', 'business', 'technology'] },
  { title: 'Software Architecture in Practice', author: 'Len Bass, Paul Clements & Rick Kazman', tags: ['software engineering', 'architecture'] },
  { title: 'Software Architecture Patterns', author: 'Mark Richards', tags: ['software engineering', 'architecture'] },
  { title: 'Spare', author: 'Prince Harry', tags: ['memoir', 'politics'] },
  { title: 'Staff Engineer', author: 'Will Larson', tags: ['software engineering', 'leadership', 'career'] },
  { title: 'State of AI SDR Industry 2026', author: 'AiSDR Team', tags: ['AI', 'business', 'research'] },
  { title: 'Streetwise', author: 'Elijah Anderson', tags: ['sociology', 'urban studies'] },
  { title: 'Superforecasting', author: 'Philip E. Tetlock & Dan Gardner', tags: ['psychology', 'decision making', 'science'] },
  { title: 'Superintelligence', author: 'Nick Bostrom', tags: ['AI', 'philosophy', 'technology'] },
  { title: 'Sybil', author: 'Flora Rheta Schreiber', tags: ['psychology', 'biography'] },
  { title: 'System Design and Architecture', author: 'Various', tags: ['software engineering', 'architecture'] },
  { title: 'System Design Interview', author: 'Alex Xu', tags: ['software engineering', 'interviews', 'architecture'] },
  { title: 'The Varieties of Religious Experience', author: 'William James', tags: ['philosophy', 'religion', 'psychology'] },
  { title: 'Talking to Strangers', author: 'Malcolm Gladwell', tags: ['psychology', 'sociology'] },
  { title: 'Tao Te Ching', author: 'Lao Tzu', tags: ['philosophy', 'spirituality', 'classic'] },
  { title: 'Ted Williams: The Story of My Life', author: 'Ted Williams & John Underwood', tags: ['memoir', 'sports'] },
  { title: 'The $150M Secrets', author: 'Guillaume Moubeche', tags: ['startups', 'business', 'entrepreneurship'] },
  { title: 'The 38 Letters from J.D. Rockefeller to His Son', author: 'J.D. Rockefeller', tags: ['business', 'wisdom', 'classic'] },
  { title: 'The AI Scientist', author: 'Various Researchers', tags: ['AI', 'research', 'science'] },
  { title: 'The Alchemy of Finance', author: 'George Soros', tags: ['finance', 'investing', 'economics'] },
  { title: 'The Art of Learning', author: 'Josh Waitzkin', tags: ['self-help', 'chess', 'learning'] },
  { title: 'The Art of the Deal', author: 'Donald Trump & Tony Schwartz', tags: ['business', 'memoir'] },
  { title: 'The Autobiography of Malcolm X', author: 'Malcolm X & Alex Haley', tags: ['biography', 'history', 'politics'] },
  { title: 'The Beginning of Infinity', author: 'David Deutsch', tags: ['philosophy', 'science', 'physics'] },
  { title: 'The Body', author: 'Bill Bryson', tags: ['science', 'health', 'biology'] },
  { title: 'The Book of Why', author: 'Judea Pearl & Dana Mackenzie', tags: ['science', 'statistics', 'AI'] },
  { title: 'The Burning Earth', author: 'Sumanth Ramaswamy', tags: ['history', 'science'] },
  { title: 'The Checklist Manifesto', author: 'Atul Gawande', tags: ['productivity', 'health', 'business'] },
  { title: 'The Code Book', author: 'Simon Singh', tags: ['mathematics', 'cryptography', 'history'] },
  { title: 'The Code Breaker', author: 'Walter Isaacson', tags: ['biography', 'science', 'genetics'] },
  { title: 'The Complete Essays', author: 'Michel de Montaigne', tags: ['philosophy', 'essays', 'classic'] },
  { title: 'The Computer and the Brain', author: 'John von Neumann', tags: ['computer science', 'neuroscience', 'classic'] },
  { title: 'The Culture Code', author: 'Daniel Coyle', tags: ['business', 'leadership', 'psychology'] },
  { title: 'The Denial of Death', author: 'Ernest Becker', tags: ['philosophy', 'psychology'] },
  { title: 'The Descent of Man', author: 'Grayson Perry', tags: ['sociology', 'masculinity', 'art'] },
  { title: 'The Design of Everyday Things', author: 'Don Norman', tags: ['design', 'psychology', 'technology'] },
  { title: 'The Double Helix', author: 'James D. Watson', tags: ['science', 'biography', 'genetics'] },
  { title: 'The Elephant in the Brain', author: 'Kevin Simler & Robin Hanson', tags: ['psychology', 'philosophy', 'behavioral science'] },
  { title: 'The Fabric of Reality', author: 'David Deutsch', tags: ['physics', 'philosophy', 'science'] },
  { title: 'The Future Is History', author: 'Masha Gessen', tags: ['history', 'politics', 'Russia'] },
  { title: 'The Great CEO Within', author: 'Matt Mochary', tags: ['business', 'leadership', 'startups'] },
  { title: 'The Greatest Sentence Ever Written', author: 'Brian Garfield', tags: ['writing', 'literature'] },
  { title: 'The HP Way', author: 'David Packard', tags: ['business', 'technology', 'memoir'] },
  { title: 'The Infinity Machine', author: 'Nitasha Tiku', tags: ['technology', 'AI'] },
  { title: 'The Institute', author: 'Stephen King', tags: ['fiction', 'thriller'] },
  { title: 'The Interpretation of Dreams', author: 'Sigmund Freud', tags: ['psychology', 'classic', 'philosophy'] },
  { title: 'The Invisible Man', author: 'H. G. Wells', tags: ['fiction', 'science fiction', 'classic'] },
  { title: 'The Kiss', author: 'Kathryn Harrison', tags: ['memoir', 'literature'] },
  { title: 'The Last Economy', author: 'Emad Mostaque', tags: ['AI', 'economics', 'technology'] },
  { title: 'The Man Who Knew Infinity', author: 'Robert Kanigel', tags: ['biography', 'mathematics'] },
  { title: 'The Memoirs of the Dean of Wall Street', author: 'Benjamin Graham', tags: ['finance', 'memoir', 'investing'] },
  { title: 'The Mormon Way of Doing Business', author: 'Jeff Benedict', tags: ['business', 'religion', 'leadership'] },
  { title: 'The Most Important Thing', author: 'Howard Marks', tags: ['investing', 'finance'] },
  { title: 'The New Tao of Warren Buffett', author: 'Mary Buffett & David Clark', tags: ['investing', 'wisdom', 'business'] },
  { title: 'The Optimist', author: 'David Coggins', tags: ['essays', 'culture'] },
  { title: 'The Parasitic Mind', author: 'Gad Saad', tags: ['psychology', 'politics', 'philosophy'] },
  { title: 'The Philosopher in the Valley', author: 'Various', tags: ['philosophy', 'technology', 'essays'] },
  { title: 'The Power Broker', author: 'Robert A. Caro', tags: ['biography', 'politics', 'history'] },
  { title: 'The Prince and Other Writings', author: 'Niccolò Machiavelli', tags: ['philosophy', 'politics', 'classic'] },
  { title: 'The Product-Minded Engineer', author: 'Various', tags: ['software engineering', 'product', 'career'] },
  { title: 'The Psychology of Money', author: 'Morgan Housel', tags: ['finance', 'psychology', 'investing'] },
  { title: 'The Rational Optimist', author: 'Matt Ridley', tags: ['economics', 'science', 'history'] },
  { title: 'The Republic', author: 'Plato', tags: ['philosophy', 'politics', 'classic'] },
  { title: 'The Righteous Mind', author: 'Jonathan Haidt', tags: ['psychology', 'politics', 'philosophy'] },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', tags: ['science', 'biology', 'evolution'] },
  { title: 'The Simple Path to Wealth', author: 'JL Collins', tags: ['finance', 'investing', 'self-help'] },
  { title: 'The Sleepwalkers', author: 'Christopher Clark', tags: ['history', 'war', 'politics'] },
  { title: 'The Toyota Way', author: 'Jeffrey K. Liker', tags: ['business', 'management', 'manufacturing'] },
  { title: 'The Writer Who Stayed', author: 'William Zinsser', tags: ['writing', 'essays'] },
  { title: 'The Anthology of Balaji', author: 'Balaji Srinivasan', tags: ['technology', 'startups', 'philosophy'] },
  { title: 'The Value of Everything', author: 'Mariana Mazzucato', tags: ['economics', 'politics', 'philosophy'] },
  { title: 'The Man Who Loved Only Numbers', author: 'Paul Hoffman', tags: ['biography', 'mathematics'] },
  { title: 'The Man from the Future', author: 'Ananyo Bhattacharya', tags: ['biography', 'mathematics', 'science'] },
  { title: 'Theory of Games and Economic Behavior', author: 'John von Neumann & Oskar Morgenstern', tags: ['mathematics', 'economics', 'game theory'] },
  { title: 'Theory of Self-Reproducing Automata', author: 'John von Neumann', tags: ['computer science', 'mathematics', 'classic'] },
  { title: 'Things in Nature Merely Grow', author: 'Various', tags: ['nature', 'philosophy', 'essays'] },
  { title: 'Think on These Things', author: 'Jiddu Krishnamurti', tags: ['philosophy', 'spirituality', 'education'] },
  { title: 'Thinking in Bets', author: 'Annie Duke', tags: ['psychology', 'decision making', 'business'] },
  { title: 'Titan', author: 'Ron Chernow', tags: ['biography', 'business', 'history'] },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', tags: ['fiction', 'classic', 'literature'] },
  { title: 'Tools of Titans', author: 'Tim Ferriss', tags: ['self-help', 'business', 'interviews'] },
  { title: 'Trust', author: 'Hernán Díaz', tags: ['fiction', 'literature'] },
  { title: 'Vehicles: Experiments in Synthetic Psychology', author: 'Valentino Braitenberg', tags: ['AI', 'psychology', 'science'] },
  { title: 'Walden', author: 'Henry David Thoreau', tags: ['philosophy', 'nature', 'classic'] },
  { title: 'War and Peace', author: 'Leo Tolstoy', tags: ['fiction', 'classic', 'literature'] },
  { title: 'Why I Write', author: 'George Orwell', tags: ['writing', 'essays', 'literature'] },
  { title: 'Why Nations Fail', author: 'Daron Acemoglu & James A. Robinson', tags: ['economics', 'politics', 'history'] },
  { title: 'Writing Places', author: 'William Zinsser', tags: ['writing', 'memoir'] },
  { title: 'Writing Tips', author: 'Scott Adams', tags: ['writing', 'self-help'] },
  { title: 'Writing to Learn', author: 'William Zinsser', tags: ['writing', 'education'] },
  { title: 'Your Life Is Manufactured', author: 'Tim Minshall', tags: ['engineering', 'manufacturing', 'education'] },
  { title: 'Writing About Your Life', author: 'William Zinsser', tags: ['writing', 'memoir'] },
  { title: "Clay's Operating Principles", author: 'Various', tags: ['business', 'startups'] },
  { title: 'Founders at Work', author: 'Jessica Livingston', tags: ['startups', 'interviews', 'technology'] },
  { title: 'The Diary of a Young Girl', author: 'Anne Frank', tags: ['memoir', 'history', 'classic'] },
  { title: 'How Fascism Works', author: 'Jason Stanley', tags: ['politics', 'history', 'philosophy'] },
  { title: 'Introduction to Classical and Quantum Computing', author: 'Thomas G. Wong', tags: ['computer science', 'quantum', 'physics'] },
  { title: 'Isaac Newton', author: 'James Gleick', tags: ['biography', 'science', 'history'] },
  { title: "I've Been Thinking...", author: 'Maria Shriver', tags: ['memoir', 'self-help'] },
  { title: 'Jack Welch Speaks', author: 'Janet Lowe', tags: ['business', 'leadership'] },
  { title: 'Laws of Economics', author: 'Various', tags: ['economics', 'education'] },
  { title: 'Intermediate Microeconomics', author: 'Hal R. Varian', tags: ['economics', 'education'] },
  { title: 'Neural Networks and Deep Learning', author: 'Michael Nielsen', tags: ['AI', 'machine learning', 'computer science'] },
  { title: 'On the Shortness of Life', author: 'Seneca', tags: ['philosophy', 'Stoicism', 'classic'] },
  { title: 'Capital in the Twenty-First Century', author: 'Thomas Piketty', tags: ['economics', 'politics', 'history'] },
  { title: 'Raw Thought', author: 'Aaron Swartz', tags: ['technology', 'essays', 'politics'] },
  { title: 'Situational Awareness', author: 'Leopold Aschenbrenner', tags: ['AI', 'technology', 'geopolitics'] },
  { title: 'The Architect of Berkshire Hathaway', author: 'Various', tags: ['investing', 'biography', 'business'] },
  { title: 'The Art of Profitability', author: 'Adrian Slywotzky', tags: ['business', 'strategy'] },
  { title: 'The Brain from Inside Out', author: 'György Buzsáki', tags: ['neuroscience', 'science'] },
  { title: 'The Story of My Life', author: 'Helen Keller', tags: ['memoir', 'biography', 'classic'] },
  { title: 'The Visual Display of Quantitative Information', author: 'Edward R. Tufte', tags: ['design', 'data visualization', 'statistics'] },
  { title: 'The Gifts of Imperfection', author: 'Brené Brown', tags: ['self-help', 'psychology'] },
  { title: 'The Stranger in the Woods', author: 'Michael Finkel', tags: ['memoir', 'nature'] },
  { title: 'The Wealth of Nations', author: 'Adam Smith', tags: ['economics', 'classic', 'philosophy'] },
  { title: 'War Memoirs, Volume 1', author: 'Charles de Gaulle', tags: ['memoir', 'history', 'war'] },
  { title: 'Гемінґвей нічого не знає', author: 'Сергій Жадан', tags: ['fiction', 'Ukrainian literature'] },
  { title: 'Jonathan Livingston Seagull', author: 'Richard Bach', tags: ['fiction', 'philosophy', 'fable'] },
  { title: 'LDL Sample', author: 'Various', tags: ['health', 'science'] },
];

// ── Physical books (not online) ────────────────────────────────────────────
// Deduplicated. Ukrainian authors keep Ukrainian titles.
const physicalBooks = [
  { title: 'On Writing: A Memoir of the Craft', author: 'Stephen King', tags: ['writing', 'memoir'] },
  { title: 'Doctor Sleep', author: 'Stephen King', tags: ['fiction', 'horror'] },
  { title: 'The Gunslinger', author: 'Stephen King', tags: ['fiction', 'fantasy', 'classic'] },
  { title: 'The Green Mile', author: 'Stephen King', tags: ['fiction', 'classic'] },
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', tags: ['history', 'science', 'philosophy'] },
  { title: 'This Is Marketing', author: 'Seth Godin', tags: ['marketing', 'business'] },
  { title: 'On Freedom', author: 'Timothy Snyder', tags: ['politics', 'philosophy', 'history'] },
  { title: 'Zero to One', author: 'Peter Thiel & Blake Masters', tags: ['startups', 'business', 'technology'] },
  { title: 'Hooked', author: 'Nir Eyal', tags: ['product', 'psychology', 'business'] },
  { title: 'iWoz', author: 'Steve Wozniak & Gina Smith', tags: ['biography', 'technology'] },
  { title: 'Brief Answers to the Big Questions', author: 'Stephen Hawking', tags: ['science', 'physics', 'philosophy'] },
  { title: 'Extremely Loud & Incredibly Close', author: 'Jonathan Safran Foer', tags: ['fiction', 'literature'] },
  { title: 'A Good Marriage', author: 'Kimberly McCreight', tags: ['fiction', 'thriller'] },
  { title: 'Caste', author: 'Isabel Wilkerson', tags: ['sociology', 'history', 'politics'] },
  { title: "A Killer's Mind", author: 'Mike Omer', tags: ['fiction', 'thriller'] },
  { title: 'Fried Green Tomatoes at the Whistle Stop Cafe', author: 'Fannie Flagg', tags: ['fiction', 'classic'] },
  { title: 'The Sanatorium', author: 'Sarah Pearse', tags: ['fiction', 'thriller'] },
  { title: 'Four Thousand Weeks', author: 'Oliver Burkeman', tags: ['productivity', 'philosophy', 'self-help'] },
  { title: 'On the Move', author: 'Oliver Sacks', tags: ['memoir', 'science', 'neuroscience'] },
  { title: 'Книга в камені', author: 'Юрій Даценко', tags: ['Ukrainian literature', 'history'] },
  { title: 'The Innovators', author: 'Walter Isaacson', tags: ['biography', 'technology', 'history'] },
  { title: 'Einstein: His Life and Universe', author: 'Walter Isaacson', tags: ['biography', 'science', 'physics'] },
  { title: 'Benjamin Franklin: An American Life', author: 'Walter Isaacson', tags: ['biography', 'history'] },
  { title: 'Elon Musk', author: 'Ashlee Vance', tags: ['biography', 'technology', 'business'] },
  { title: 'Bill Gates: Source Code', author: 'Various', tags: ['biography', 'technology'] },
  { title: 'Broken Code', author: 'Jeff Horwitz', tags: ['technology', 'social media', 'investigative'] },
  { title: 'My Life and Work', author: 'Henry Ford', tags: ['biography', 'business', 'classic'] },
  { title: 'The Everything Store', author: 'Brad Stone', tags: ['biography', 'business', 'technology'] },
  { title: 'The Pivot Year', author: 'Brianna Wiest', tags: ['self-help', 'philosophy'] },
  { title: 'Dreams from My Father', author: 'Barack Obama', tags: ['memoir', 'politics'] },
  { title: 'A Handbook for New Stoics', author: 'Massimo Pigliucci & Gregory Lopez', tags: ['philosophy', 'Stoicism', 'self-help'] },
  { title: 'No Rules Rules', author: 'Reed Hastings & Erin Meyer', tags: ['business', 'leadership', 'management'] },
  { title: 'The Man Who Died Twice', author: 'Richard Osman', tags: ['fiction', 'mystery'] },
  { title: 'Tesla', author: 'Richard Munson', tags: ['biography', 'science', 'technology'] },
  { title: 'Не озирайся і мовчи', author: 'Макс Кідрук', tags: ['fiction', 'Ukrainian literature', 'thriller'] },
  { title: 'Таємниця старого Лами', author: 'Дорж Бату', tags: ['fiction', 'spirituality'] },
  { title: 'Dialogues', author: 'Plato', tags: ['philosophy', 'classic'] },
  { title: 'The Minds of Billy Milligan', author: 'Daniel Keyes', tags: ['psychology', 'biography'] },
  { title: 'Testing with Humans', author: 'Giff Constable & Frank Rimalovski', tags: ['product', 'startups', 'design'] },
  { title: 'The War for Reality', author: 'Dmytro Kuleba', tags: ['politics', 'geopolitics', 'Ukraine'] },
  { title: 'The Sinner', author: 'Tess Gerritsen', tags: ['fiction', 'thriller'] },
  { title: 'Dunbar', author: 'Edward St Aubyn', tags: ['fiction', 'literature'] },
  { title: 'The Maidens', author: 'Alex Michaelides', tags: ['fiction', 'thriller', 'mystery'] },
  { title: 'How to Think Like Sigmund Freud', author: 'Daniel Smith', tags: ['psychology', 'philosophy'] },
  { title: 'Blockchain Revolution', author: 'Don Tapscott & Alex Tapscott', tags: ['technology', 'finance', 'business'] },
  { title: 'God Always Travels Incognito', author: 'Laurent Gounelle', tags: ['fiction', 'self-help'] },
  { title: 'Essentialism', author: 'Greg McKeown', tags: ['productivity', 'self-help', 'business'] },
  { title: 'Churchill and Orwell', author: 'Thomas E. Ricks', tags: ['biography', 'history', 'politics'] },
  { title: 'The Guest List', author: 'Lucy Foley', tags: ['fiction', 'thriller', 'mystery'] },
  { title: 'The 48 Laws of Power', author: 'Robert Greene', tags: ['psychology', 'politics', 'self-help'] },
  { title: 'Picasso and the Painting That Shocked the World', author: 'Miles J. Unger', tags: ['biography', 'art'] },
  { title: 'Tribe of Mentors', author: 'Tim Ferriss', tags: ['self-help', 'interviews', 'business'] },
  { title: 'Will', author: 'Will Smith & Mark Manson', tags: ['memoir', 'entertainment'] },
  { title: 'Nine Perfect Strangers', author: 'Liane Moriarty', tags: ['fiction', 'thriller'] },
  { title: 'The Game', author: 'Neil Strauss', tags: ['self-help', 'psychology'] },
  { title: '50 Philosophy Classics', author: 'Tom Butler-Bowdon', tags: ['philosophy', 'reference'] },
  { title: 'The Ultimate Finance Book', author: 'Roger Mason et al.', tags: ['finance', 'education'] },
  { title: '250 Things You Should Know About Writing', author: 'Chuck Wendig', tags: ['writing', 'reference'] },
  { title: 'The Club: Мистецтво об\'єднувати', author: 'Сергій Гайдай', tags: ['Ukrainian literature', 'business'] },
  { title: 'Autobiography of Andrew Carnegie', author: 'Andrew Carnegie', tags: ['biography', 'business', 'classic'] },
  { title: 'A Storm of Swords', author: 'George R. R. Martin', tags: ['fiction', 'fantasy'] },
  { title: 'The Monk Who Sold His Ferrari', author: 'Robin Sharma', tags: ['self-help', 'fiction', 'philosophy'] },
  { title: 'Справа Василя Стуса', author: 'Вахтанг Кіпіані', tags: ['Ukrainian literature', 'history', 'politics'] },
  { title: 'Steve Jobs', author: 'Walter Isaacson', tags: ['biography', 'technology', 'business'] },
  { title: '101 Essays That Will Change the Way You Think', author: 'Brianna Wiest', tags: ['self-help', 'essays', 'philosophy'] },
  { title: 'An Elegant Puzzle', author: 'Will Larson', tags: ['software engineering', 'management', 'leadership'] },
  { title: 'Never Split the Difference', author: 'Chris Voss & Tahl Raz', tags: ['negotiation', 'business', 'psychology'] },
  { title: "Poor Charlie's Almanack", author: 'Peter D. Kaufman (ed.)', tags: ['investing', 'wisdom', 'business'] },
  { title: 'Scaling People', author: 'Claire Hughes Johnson', tags: ['management', 'leadership', 'business'] },
  { title: 'Start With Why', author: 'Simon Sinek', tags: ['leadership', 'business', 'motivation'] },
  { title: 'The Art of Doing Science and Engineering', author: 'Richard W. Hamming', tags: ['science', 'engineering', 'education'] },
  { title: 'The Big Score', author: 'Michael S. Malone', tags: ['technology', 'history', 'business'] },
  { title: 'The Intelligent Investor', author: 'Benjamin Graham', tags: ['investing', 'finance', 'classic'] },
  { title: 'The Man Who Knew Infinity', author: 'Robert Kanigel', tags: ['biography', 'mathematics'] },
  { title: 'Deep Simplicity', author: 'John Gribbin', tags: ['science', 'complexity'] },
  { title: 'The Long Walk', author: 'Stephen King', tags: ['fiction', 'dystopia'] },
  { title: 'The Making of Prince of Persia', author: 'Jordan Mechner', tags: ['memoir', 'game design', 'technology'] },
  { title: 'Meeting Life', author: 'Jiddu Krishnamurti', tags: ['philosophy', 'spirituality'] },
  { title: 'Ostatni Naboj', author: 'Unknown Author', tags: ['Polish'] },
  { title: 'The Power of Now', author: 'Eckhart Tolle', tags: ['spirituality', 'self-help', 'mindfulness'] },
  { title: 'The Snowball', author: 'Alice Schroeder', tags: ['biography', 'investing', 'business'] },
  { title: 'Winston Churchill CEO', author: 'Alan Axelrod', tags: ['biography', 'leadership', 'history'] },
  { title: 'Білий попіл', author: 'Іларіон Павлюк', tags: ['fiction', 'Ukrainian literature'] },
  { title: 'All Quiet on the Western Front', author: 'Erich Maria Remarque', tags: ['fiction', 'war', 'classic'] },
  { title: 'Emotion by Design', author: 'Greg Hoffman', tags: ['design', 'business', 'marketing'] },
  { title: 'The Shining', author: 'Stephen King', tags: ['fiction', 'horror', 'classic'] },
  { title: 'Як перекласти життя на сценарій', author: 'Антоніо Лукіч', tags: ['Ukrainian literature', 'film', 'memoir'] },
];

const screenshotBooks = [
  { title: 'The Humane Interface', author: 'Jef Raskin', tags: ['design', 'technology', 'software'] },
  { title: 'Atomic Accidents', author: 'James Mahaffey', tags: ['history', 'science', 'nuclear'] },
  { title: 'The Overstory', author: 'Richard Powers', tags: ['fiction', 'nature', 'literature'] },
  { title: 'Turn the Ship Around!', author: 'L. David Marquet', tags: ['leadership', 'management'] },
  { title: 'Queen of Scots', author: 'John Guy', tags: ['history', 'biography'] },
  { title: 'Czarny kot', author: 'Edgar Allan Poe', tags: ['fiction', 'classic', 'Polish'] },
  { title: 'Mały Książę', author: 'Antoine de Saint-Exupéry', tags: ['fiction', 'classic', 'Polish'] },
  { title: 'Alicja w Krainie Czarów', author: 'Lewis Carroll', tags: ['fiction', 'classic', 'Polish'] },
  { title: 'Robinson Crusoe', author: 'Daniel Defoe', tags: ['fiction', 'classic'] },
  { title: 'Don Kichot z La Manchy', author: 'Miguel de Cervantes Saavedra', tags: ['fiction', 'classic', 'Polish'] },
  { title: 'Italy', author: 'Ross King', tags: ['history', 'travel'] },
  { title: 'The Struggle for Taiwan', author: 'Sulmaan Wasif Khan', tags: ['history', 'geopolitics'] },
  { title: 'The Journey of Leadership', author: 'Dana Maor, Hans-Werner Kaas, Kurt Strovink & Ramesh Srinivasan', tags: ['leadership', 'business'] },
  { title: 'Surrounded by Idiots', author: 'Thomas Erikson', tags: ['psychology', 'communication'] },
  { title: 'Extraordinary Popular Delusions and the Madness of Crowds', author: 'Charles Mackay', tags: ['psychology', 'history', 'finance'] },
  { title: 'Napoleon', author: 'Philip Dwyer', tags: ['history', 'biography'] },
  { title: 'The Path to Power', author: 'Robert A. Caro', tags: ['biography', 'politics'] },
  { title: 'The Dhandho Investor', author: 'Mohnish Pabrai', tags: ['investing', 'finance'] },
  { title: 'An Autobiography', author: 'M. K. Gandhi', tags: ['memoir', 'history'] },
  { title: 'Long Walk to Freedom', author: 'Nelson Mandela', tags: ['memoir', 'history', 'politics'] },
  { title: 'Margaret Thatcher: The Autobiography', author: 'Margaret Thatcher', tags: ['memoir', 'politics'] },
  { title: 'Myśli', author: 'Blaise Pascal', tags: ['philosophy', 'classic', 'Polish'] },
  { title: 'Crossing the Chasm', author: 'Geoffrey A. Moore', tags: ['business', 'marketing', 'startups'] },
  { title: 'Obviously Awesome', author: 'April Dunford', tags: ['marketing', 'product', 'business'] },
  { title: 'Product-Led Growth', author: 'Wes Bush', tags: ['product', 'business', 'growth'] },
  { title: 'University of Berkshire Hathaway', author: 'Daniel Pecaut & Corey Wrenn', tags: ['investing', 'business'] },
  { title: 'The Work of Art in the Age of Mechanical Reproduction', author: 'Walter Benjamin', tags: ['philosophy', 'art', 'essays'] },
  { title: 'Atomic Habits', author: 'James Clear', tags: ['self-help', 'productivity'] },
  { title: 'Quo Vadis', author: 'Henryk Sienkiewicz', tags: ['fiction', 'classic', 'Polish'] },
  { title: 'Crucible Moments', author: 'Sequoia Capital', tags: ['startups', 'business'] },
  { title: 'The Power Law', author: 'Sebastian Mallaby', tags: ['venture capital', 'business', 'technology'] },
  { title: 'Venture Capitalists at Work', author: 'Tarang Shah', tags: ['venture capital', 'interviews', 'business'] },
  { title: "Sid Meier's Memoir!", author: 'Sid Meier', tags: ['memoir', 'game design', 'technology'] },
  { title: "Liar's Poker", author: 'Michael Lewis', tags: ['finance', 'memoir'] },
  { title: 'How to Become a Straight-A Student', author: 'Cal Newport', tags: ['education', 'productivity'] },
  { title: 'Creative Selection', author: 'Ken Kocienda', tags: ['technology', 'design', 'memoir'] },
  { title: 'Working', author: 'Robert A. Caro', tags: ['writing', 'memoir'] },
  { title: 'Algorithms to Live By', author: 'Brian Christian & Tom Griffiths', tags: ['computer science', 'psychology', 'decision making'] },
  { title: 'The Systems Bible', author: 'John Gall', tags: ['systems', 'science', 'management'] },
  { title: 'The Art of Statistics', author: 'David Spiegelhalter', tags: ['statistics', 'science'] },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', tags: ['psychology', 'decision making', 'economics'] },
  { title: 'The Stranger', author: 'Albert Camus', tags: ['fiction', 'philosophy', 'classic'] },
  { title: 'Meditations', author: 'Marcus Aurelius', tags: ['philosophy', 'Stoicism', 'classic'] },
  { title: "Dead Man's Walk", author: 'Larry McMurtry', tags: ['fiction', 'western'] },
  { title: 'City', author: 'David Macaulay', tags: ['architecture', 'history', 'design'] },
  { title: 'The New Way Things Work', author: 'David Macaulay', tags: ['engineering', 'science', 'design'] },
  { title: 'Born of This Land: My Life Story', author: 'Chung Ju-yung', tags: ['memoir', 'business'] },
  { title: '100 Books That Changed the World', author: 'Scott Christianson & Colin Salter', tags: ['history', 'books'] },
  { title: 'Sam Altman', author: 'Various', tags: ['technology', 'startups', 'AI'] },
  { title: 'M Train', author: 'Patti Smith', tags: ['memoir', 'art'] },
  { title: 'Adventures of Huckleberry Finn', author: 'Mark Twain', tags: ['fiction', 'classic'] },
  { title: 'Pride In Performance Keep It Going!', author: 'Les Schwab', tags: ['business', 'memoir'] },
  { title: 'Influence', author: 'Robert B. Cialdini', tags: ['psychology', 'business', 'persuasion'] },
  { title: 'Richest Man in Babylon', author: 'George S. Clason', tags: ['finance', 'self-help', 'classic'] },
  { title: 'The Wealth and Poverty of Nations', author: 'David S. Landes', tags: ['history', 'economics'] },
  { title: 'Master of the Game', author: 'Connie Bruck', tags: ['biography', 'business'] },
  { title: 'Models of My Life', author: 'Herbert A. Simon', tags: ['memoir', 'science', 'decision making'] },
  { title: 'Judgment in Managerial Decision Making', author: 'Max H. Bazerman & Don A. Moore', tags: ['business', 'decision making', 'psychology'] },
  { title: 'In the Plex', author: 'Steven Levy', tags: ['technology', 'business'] },
  { title: 'Ice Age', author: 'Unknown Author', tags: ['science', 'history'] },
  { title: 'How the Scots Invented the Modern World', author: 'Arthur Herman', tags: ['history'] },
  { title: 'Genome', author: 'Matt Ridley', tags: ['science', 'biology'] },
  { title: 'The Blind Watchmaker', author: 'Richard Dawkins', tags: ['science', 'biology', 'evolution'] },
  { title: 'A World Appears', author: 'Michael Pollan', tags: ['science', 'consciousness'] },
  { title: 'Right Thing, Right Now', author: 'Ryan Holiday', tags: ['philosophy', 'Stoicism'] },
  { title: 'Naked Statistics', author: 'Charles Wheelan', tags: ['statistics', 'economics'] },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', tags: ['history', 'science'] },
  { title: 'Know Yourself', author: 'The School of Life', tags: ['philosophy', 'psychology'] },
  { title: 'The Heart of the Photograph', author: 'David duChemin', tags: ['photography', 'art'] },
  { title: '13.8', author: 'John Gribbin', tags: ['science', 'physics'] },
  { title: 'The Fellowship', author: 'John Gribbin', tags: ['science', 'history'] },
  { title: 'Seven Pillars of Science', author: 'John Gribbin', tags: ['science'] },
  { title: "In Search of Schrodinger's Cat", author: 'John Gribbin', tags: ['science', 'physics'] },
  { title: 'Six Impossible Things', author: 'John Gribbin', tags: ['science', 'physics'] },
  { title: 'In Search of the Multiverse', author: 'John Gribbin', tags: ['science', 'physics'] },
  { title: 'The Reason Why', author: 'John Gribbin', tags: ['science', 'history'] },
  { title: 'Richard Feynman: A Life in Science', author: 'John Gribbin & Mary Gribbin', tags: ['biography', 'science'] },
  { title: 'Stephen Hawking: A Life in Science', author: 'Michael White & John Gribbin', tags: ['biography', 'science'] },
  { title: 'In Search of the Big Bang', author: 'John Gribbin', tags: ['science', 'physics'] },
  { title: "Einstein's Masterwork", author: 'John Gribbin', tags: ['science', 'physics'] },
  { title: 'Deep Simplicity', author: 'John Gribbin', tags: ['science', 'complexity'] },
  { title: 'Science: A History', author: 'John Gribbin', tags: ['science', 'history'] },
  { title: 'Richard Wagner: Volume One', author: 'Richard Wagner', tags: ['music', 'biography'] },
  { title: "Twenty Years of Hus'ling", author: 'J. P. Johnston', tags: ['memoir', 'business'] },
  { title: 'The Works of Mr. George Gillespie (Vol. 1 of 2)', author: 'George Gillespie', tags: ['religion', 'classic'] },
  { title: 'The Life of Charles Dickens, Vol. III', author: 'John Forster', tags: ['biography', 'literature'] },
  { title: 'Concrete Construction: Methods and Costs', author: 'Halbert Powers Gillette & Charles Shattuck Hill', tags: ['engineering', 'construction'] },
  { title: 'Moby Dick', author: 'Herman Melville', tags: ['fiction', 'classic'] },
  { title: 'Psychology of the Unconscious', author: 'C. G. Jung', tags: ['psychology', 'classic'] },
  { title: 'Limping on Water', author: 'Phil Beuth', tags: ['business', 'memoir'] },
  { title: 'Happy City', author: 'Charles Montgomery', tags: ['urban studies', 'design'] },
  { title: 'The Seven Habits of Highly Effective People', author: 'Stephen R. Covey', tags: ['self-help', 'business'] },
  { title: 'Start Small, Stay Small', author: 'Rob Walling', tags: ['startups', 'business'] },
  { title: 'Chaos Monkeys', author: 'Antonio Garcia Martinez', tags: ['technology', 'startups', 'memoir'] },
  { title: 'Martyr!', author: 'Kaveh Akbar', tags: ['fiction', 'literature'] },
  { title: 'Theo of Golden', author: 'Allen Levi', tags: ['fiction'] },
  { title: 'The Correspondent', author: 'Virginia Evans', tags: ['fiction'] },
  { title: "Structures: Or Why Things Don't Fall Down", author: 'J. E. Gordon', tags: ['engineering', 'design'] },
  { title: 'Days at the Morisaki Bookshop', author: 'Satoshi Yagisawa', tags: ['fiction', 'Japanese literature'] },
  { title: 'Idealna żona', author: 'Blake Pierce', tags: ['fiction', 'thriller', 'Polish'] },
  { title: 'Agee', author: 'James Agee', tags: ['literature'] },
  { title: 'Team of Teams', author: 'General Stanley McChrystal', tags: ['leadership', 'management'] },
  { title: 'Once Upon Atari', author: 'Howard Scott Warshaw', tags: ['technology', 'game design', 'memoir'] },
  { title: 'The Soul of a New Machine', author: 'Tracy Kidder', tags: ['technology', 'history'] },
  { title: 'A Year with Swollen Appendices', author: 'Brian Eno', tags: ['memoir', 'music', 'art'] },
  { title: 'Revolution in The Valley', author: 'Andy Hertzfeld', tags: ['technology', 'history'] },
  { title: 'The Making of Karateka Journals', author: 'Jordan Mechner', tags: ['game design', 'technology', 'memoir'] },
  { title: 'The Little Book of Common Sense Investing', author: 'John C. Bogle', tags: ['investing', 'finance'] },
  { title: 'John Maynard Keynes: Essays in Persuasion', author: 'John Maynard Keynes', tags: ['economics', 'essays'] },
  { title: 'The Clash of the Cultures', author: 'John C. Bogle', tags: ['investing', 'finance'] },
  { title: 'Stress Test', author: 'Timothy F. Geithner', tags: ['finance', 'memoir'] },
  { title: 'Jack: Straight from the Gut', author: 'Jack Welch', tags: ['memoir', 'business'] },
  { title: 'Security Analysis', author: 'Benjamin Graham & David L. Dodd', tags: ['investing', 'finance'] },
  { title: 'Common Stocks and Uncommon Profits', author: 'Philip A. Fisher', tags: ['investing', 'finance'] },
  { title: 'Dream Big', author: 'Cristiane Correa', tags: ['business', 'biography'] },
  { title: 'The Anatomy of Story', author: 'John Truby', tags: ['writing', 'storytelling'] },
  { title: 'What I Learned About Investing from Darwin', author: 'Pulak Prasad', tags: ['investing', 'finance'] },
  { title: 'Warren Buffett and the Interpretation of Financial Statements', author: 'Mary Buffett & David Clark', tags: ['investing', 'finance'] },
  { title: 'Economics in One Lesson', author: 'Henry Hazlitt', tags: ['economics', 'classic'] },
  { title: 'Great Thinkers', author: 'The School of Life', tags: ['philosophy', 'history'] },
  { title: 'Company of One', author: 'Paul Jarvis', tags: ['business', 'entrepreneurship'] },
  { title: 'You Can Be a Stock Market Genius', author: 'Joel Greenblatt', tags: ['investing', 'finance'] },
  { title: 'The Little Book That Still Beats the Market', author: 'Joel Greenblatt', tags: ['investing', 'finance'] },
  { title: "Nick and Zak's Adventures in Capitalism", author: 'The Rational Clown', tags: ['investing', 'finance'] },
  { title: 'Mastering the Market Cycle', author: 'Howard Marks', tags: ['investing', 'finance'] },
  { title: '100 Baggers', author: 'Christopher W. Mayer', tags: ['investing', 'finance'] },
  { title: 'Same as Ever', author: 'Morgan Housel', tags: ['finance', 'psychology', 'history'] },
  { title: 'Founding Sales', author: 'Peter Kazanjy', tags: ['sales', 'startups', 'business'] },
  { title: 'Stop Asking Questions', author: 'Unknown', tags: ['self-help'] },
  { title: 'The Abolition of Man', author: 'C. S. Lewis', tags: ['philosophy', 'classic'] },
  { title: 'Self-Editing for Fiction Writers', author: 'Renni Browne & Dave King', tags: ['writing', 'fiction'] },
  { title: "The Writer's Journey", author: 'Christopher Vogler', tags: ['writing', 'storytelling'] },
  { title: 'Bird by Bird', author: 'Anne Lamott', tags: ['writing', 'memoir'] },
  { title: 'Story Genius', author: 'Lisa Cron', tags: ['writing', 'storytelling'] },
  { title: 'Outstanding Investor Digest', author: 'Various', tags: ['investing', 'finance'] },
  { title: 'Warren Buffett Partnership Letters: The Complete Collection 1943-1978', author: 'Warren Buffett', tags: ['investing', 'finance'] },
  { title: 'The Autobiography of Charles Darwin', author: 'Charles Darwin', tags: ['memoir', 'science'] },
  { title: '150 Great Articles & Essays', author: 'Various', tags: ['essays', 'literature'] },
  { title: 'Super Thinking', author: 'Gabriel Weinberg & Lauren McCann', tags: ['mental models', 'decision making'] },
];

const titleCorrections = [
  { fromTitle: 'Талановитий містер Ріплі', fromAuthor: 'Патриція Гайсміт', title: 'The Talented Mr. Ripley', author: 'Patricia Highsmith' },
  { fromTitle: 'Воєнні мемуари, Том 1', fromAuthor: 'Шарль де Голль', title: 'War Memoirs, Volume 1', author: 'Charles de Gaulle' },
  { fromTitle: 'Чайка Джонатан Лівінгстон', fromAuthor: 'Річард Бах', title: 'Jonathan Livingston Seagull', author: 'Richard Bach' },
  { fromTitle: 'Стрілець', fromAuthor: 'Стівен Кінг', title: 'The Gunslinger', author: 'Stephen King' },
  { fromTitle: 'Зелена миля', fromAuthor: 'Стівен Кінг', title: 'The Green Mile', author: 'Stephen King' },
  { fromTitle: 'Страшенно голосно і неймовірно близько', fromAuthor: 'Джонатан Сафран Фоер', title: 'Extremely Loud & Incredibly Close', author: 'Jonathan Safran Foer' },
  { fromTitle: 'Чудове подружжя', fromAuthor: 'Кімберлі Маккрейт', title: 'A Good Marriage', author: 'Kimberly McCreight' },
  { fromTitle: 'Каста', fromAuthor: 'Ізабель Вілкерсон', title: 'Caste', author: 'Isabel Wilkerson' },
  { fromTitle: 'Розум. Убивці', fromAuthor: 'Майк Омер', title: "A Killer's Mind", author: 'Mike Omer' },
  { fromTitle: 'Смажені зелені помідори в кафе «Зупинка»', fromAuthor: 'Фенні Флегг', title: 'Fried Green Tomatoes at the Whistle Stop Cafe', author: 'Fannie Flagg' },
  { fromTitle: 'Санаторій', fromAuthor: 'Сара Пірс', title: 'The Sanatorium', author: 'Sarah Pearse' },
  { fromTitle: '4000 тижнів', fromAuthor: 'Олівер Беркеман', title: 'Four Thousand Weeks', author: 'Oliver Burkeman' },
  { fromTitle: 'Стрімголов: історія одного життя', fromAuthor: 'Олівер Сакс', title: 'On the Move', author: 'Oliver Sacks' },
  { fromTitle: 'Моє життя та робота', fromAuthor: 'Генрі Форд', title: 'My Life and Work', author: 'Henry Ford' },
  { fromTitle: 'Переломний рік', fromAuthor: 'Бріанна Вієст', title: 'The Pivot Year', author: 'Brianna Wiest' },
  { fromTitle: 'Мрії мого батька', fromAuthor: 'Барак Обама', title: 'Dreams from My Father', author: 'Barack Obama' },
  { fromTitle: 'Нові стоїки', fromAuthor: 'Массімо Пільюччі & Ґреґорі Лопез', title: 'A Handbook for New Stoics', author: 'Massimo Pigliucci & Gregory Lopez' },
  { fromTitle: 'Netflix і культура інновацій', fromAuthor: 'Рід Гастінгс & Ерін Меєр', title: 'No Rules Rules', author: 'Reed Hastings & Erin Meyer' },
  { fromTitle: 'Людина, яка померла двічі', fromAuthor: 'Річард Осман', title: 'The Man Who Died Twice', author: 'Richard Osman' },
  { fromTitle: 'Tesla: Винахідник сучасності', fromAuthor: 'Річард Мансон', title: 'Tesla', author: 'Richard Munson' },
  { fromTitle: 'Діалоги', fromAuthor: 'Платон', title: 'Dialogues', author: 'Plato' },
  { fromTitle: 'Таємнича історія Біллі Міллігана', fromAuthor: 'Деніел Кіз', title: 'The Minds of Billy Milligan', author: 'Daniel Keyes' },
  { fromTitle: 'Грішна', fromAuthor: 'Тесс Ґеррітсен', title: 'The Sinner', author: 'Tess Gerritsen' },
  { fromTitle: 'Діви', fromAuthor: 'Алекс Міхаелідес', title: 'The Maidens', author: 'Alex Michaelides' },
  { fromTitle: 'Думати, як Зигмунд Фрейд', fromAuthor: 'Деніел Сміт', title: 'How to Think Like Sigmund Freud', author: 'Daniel Smith' },
  { fromTitle: 'Блокчейн-революція', fromAuthor: 'Дон Тапскотт & Алекс Тапскотт', title: 'Blockchain Revolution', author: 'Don Tapscott & Alex Tapscott' },
  { fromTitle: 'Бог завжди подорожує інкогніто', fromAuthor: 'Лоран Ґунель', title: 'God Always Travels Incognito', author: 'Laurent Gounelle' },
  { fromTitle: 'Есенціалізм', fromAuthor: 'Ґреґ МакКіон', title: 'Essentialism', author: 'Greg McKeown' },
  { fromTitle: 'Черчилль і Орвелл', fromAuthor: 'Томас Рікс', title: 'Churchill and Orwell', author: 'Thomas E. Ricks' },
  { fromTitle: 'Список запрошених', fromAuthor: 'Люсі Фолі', title: 'The Guest List', author: 'Lucy Foley' },
  { fromTitle: '48 законів влади', fromAuthor: 'Роберт Ґрін', title: 'The 48 Laws of Power', author: 'Robert Greene' },
  { fromTitle: 'Пікассо: живопис, що шокував світ', fromAuthor: 'Майлз Дж. Ангер', title: 'Picasso and the Painting That Shocked the World', author: 'Miles J. Unger' },
  { fromTitle: 'Правила гри', fromAuthor: 'Ніл Стросс', title: 'The Game', author: 'Neil Strauss' },
  { fromTitle: 'Філософія: 50 видатних творів', fromAuthor: 'Том Батлер-Боудон', title: '50 Philosophy Classics', author: 'Tom Butler-Bowdon' },
  { fromTitle: '250 фішок для письменників', fromAuthor: 'Чак Вендіг', title: '250 Things You Should Know About Writing', author: 'Chuck Wendig' },
  { fromTitle: 'Автобіографія', fromAuthor: 'Ендрю Карнегі', title: 'Autobiography of Andrew Carnegie', author: 'Andrew Carnegie' },
  { fromTitle: 'Монах, який продав свій «Ferrari»', fromAuthor: 'Робін Шарма', title: 'The Monk Who Sold His Ferrari', author: 'Robin Sharma' },
  { fromTitle: '101 есеїв, які змінять ваше мислення', fromAuthor: 'Бріанна Вієст', title: '101 Essays That Will Change the Way You Think', author: 'Brianna Wiest' },
  { fromTitle: 'На Західному фронті без змін', fromAuthor: 'Еріх Марія Ремарк', title: 'All Quiet on the Western Front', author: 'Erich Maria Remarque' },
  { fromTitle: 'Емоція за дизайном', fromAuthor: 'Ґреґ Гоффман', title: 'Emotion by Design', author: 'Greg Hoffman' },
  { fromTitle: 'Сяйво', fromAuthor: 'Стівен Кінг', title: 'The Shining', author: 'Stephen King' },
];

function normalizeKeyPart(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getBookKey(book) {
  return `${normalizeKeyPart(book.title)}::${normalizeKeyPart(book.author)}`;
}

function mergeTags(...tagSets) {
  const seenTags = new Set();
  const mergedTags = [];

  for (const tagSet of tagSets) {
    for (const tag of tagSet || []) {
      const normalizedTag = String(tag).trim();
      const tagKey = normalizedTag.toLowerCase();

      if (!normalizedTag || seenTags.has(tagKey)) {
        continue;
      }

      seenTags.add(tagKey);
      mergedTags.push(normalizedTag);
    }
  }

  return mergedTags;
}

function normalizeTagsForCompare(tags) {
  return (tags || [])
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('\n');
}

function applyTitleCorrection(book) {
  const correction = titleCorrections.find((candidate) => (
    normalizeKeyPart(candidate.fromTitle) === normalizeKeyPart(book.title)
    && normalizeKeyPart(candidate.fromAuthor) === normalizeKeyPart(book.author)
  ));

  if (!correction) {
    return book;
  }

  return {
    ...book,
    title: correction.title,
    author: correction.author,
    tags: mergeTags(book.tags, correction.tags),
  };
}

async function seed() {
  await ensureDatabase();

  const allBooks = [
    ...onlineBooks.map((b) => ({ ...b, isOnline: true })),
    ...physicalBooks.map((b) => ({ ...b, isOnline: false })),
    ...screenshotBooks.map((b) => ({ ...b, isOnline: false })),
  ].map(applyTitleCorrection);
  const booksByKey = new Map();

  for (const book of allBooks) {
    const bookKey = getBookKey(book);
    const existingBook = booksByKey.get(bookKey);

    booksByKey.set(bookKey, existingBook
      ? { ...book, tags: mergeTags(existingBook.tags, book.tags) }
      : book);
  }

  const desiredBooks = Array.from(booksByKey.values());

  console.log(`Seeding ${desiredBooks.length} unique books from ${allBooks.length} records (${onlineBooks.length} online, ${physicalBooks.length} physical, ${screenshotBooks.length} screenshots)...`);
  const existingEntries = await getBookshelfEntries({ includeInternalNotes: true });
  let corrected = 0;

  for (const entry of existingEntries) {
    const correctedEntry = applyTitleCorrection(entry);

    if (getBookKey(correctedEntry) === getBookKey(entry)) {
      continue;
    }

    const existingTarget = existingEntries.find((candidate) => (
      candidate.id !== entry.id && getBookKey(candidate) === getBookKey(correctedEntry)
    ));

    if (existingTarget) {
      continue;
    }

    await updateBookshelfEntry(entry.id, {
      title: correctedEntry.title,
      author: correctedEntry.author,
      tags: mergeTags(entry.tags, correctedEntry.tags),
      internalNotes: entry.internalNotes || '',
    });
    corrected++;
  }

  const entriesAfterCorrections = corrected > 0
    ? await getBookshelfEntries({ includeInternalNotes: true })
    : existingEntries;
  const existingByKey = new Map(entriesAfterCorrections.map((entry) => [getBookKey(entry), entry]));
  let created = 0;
  let skipped = 0;
  let updated = 0;
  let errors = 0;

  for (const book of desiredBooks) {
    const bookKey = getBookKey(book);
    const existingEntry = existingByKey.get(bookKey);

    if (existingEntry) {
      const mergedTags = mergeTags(existingEntry.tags, book.tags);
      const shouldUpdate = existingEntry.isOnline !== book.isOnline
        || normalizeTagsForCompare(existingEntry.tags) !== normalizeTagsForCompare(mergedTags);

      if (shouldUpdate) {
        const updatedEntry = await updateBookshelfEntry(existingEntry.id, {
          isOnline: book.isOnline,
          tags: mergedTags,
          internalNotes: existingEntry.internalNotes || '',
        });
        existingByKey.set(bookKey, updatedEntry || {
          ...existingEntry,
          isOnline: book.isOnline,
          tags: mergedTags,
        });
        updated++;
      }

      skipped++;
      continue;
    }

    try {
      const createdEntry = await createBookshelfEntry({
        title: book.title,
        author: book.author,
        status: 'backlog',
        isOnline: book.isOnline,
        url: null,
        sortOrder: 0,
        tags: book.tags,
      });
      existingByKey.set(bookKey, createdEntry);
      created++;
      if (created % 25 === 0) {
        console.log(`  ...created ${created} books`);
      }
    } catch (err) {
      errors++;
      console.error(`  FAILED: "${book.title}" — ${err.message}`);
    }
  }

  console.log(`\nDone. Corrected: ${corrected}, Updated: ${updated}, Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
  await closePool();
  process.exit(errors > 0 ? 1 : 0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  closePool().finally(() => process.exit(1));
});
