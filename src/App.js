import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import About from './components/about/About';
import Experience from './components/experience/Experience';
import Books from './components/books/Books';
import Projects from './components/projects/Projects';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import './App.css';
import Posts, { PostDetail } from './components/posts/Posts';
import Contact from './components/contact/Contact';
import Admin from './components/admin/Admin';

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';

  return (
    <div className='app-container'>
      {!isAdminRoute && <Header />}
      <main className='content'>
        <Routes>
          <Route path="/" element={<About />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/books" element={<Books />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/blog" element={<Posts />} />
          <Route path="/blog/:slug" element={<PostDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
