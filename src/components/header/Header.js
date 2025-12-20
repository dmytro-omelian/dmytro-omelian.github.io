import React from 'react';
import './Header.css';
import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="site-header">
            <div className="container">
                <Link to="/" className="site-name">
                    <h2>Dmytro Omelian</h2>
                </Link>
                <nav>
                    <Link to="/experience">Experience</Link> /
                    <Link to="/blog">Blog</Link> /
                    <Link to="/books">Books</Link> /
                    <Link to="/contact">Contact</Link>
                </nav>
            </div>
        </header>
    );
}

export default Header;
