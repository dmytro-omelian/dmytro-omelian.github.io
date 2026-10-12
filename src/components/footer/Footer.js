import React from 'react';
import './Footer.css'; // Make sure to create a corresponding CSS file

function Footer() {
    const year = new Date().getFullYear(); // Gets the current year

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <span>&copy; {year} Dmytro Omelian</span>
                <a href="mailto:dm.omelian@gmail.com">dm.omelian@gmail.com</a>
            </div>
        </footer>
    );
}

export default Footer;
