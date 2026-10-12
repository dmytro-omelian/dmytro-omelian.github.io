import React from 'react';
import './Header.css';
import { Link, NavLink } from 'react-router-dom';

function Header() {
    return (
        <header className="site-header">
            <div className="site-header-inner">
                <Link to="/" className="site-name">
                    Dmytro Omelian
                </Link>
                <nav aria-label="Main navigation">
                    <NavLink to="/experience">Experience</NavLink>
                    <NavLink to="/blog">Writing</NavLink>
                    <NavLink to="/books">Books</NavLink>
                    <NavLink to="/contact">Contact</NavLink>
                </nav>
            </div>
        </header>
    );
}

export default Header;
