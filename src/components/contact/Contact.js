import React from 'react';
import './Contact.css';

function Contact() {
    return (
        <div className="contact-page">
            <h2>Contact</h2>
            <p>If you want to say hi or work together, you can find me here:</p>

            <ul className="contact-list">
                <li>
                    <span className="contact-icon contact-icon-email" aria-hidden="true">@</span>
                    <a href="mailto:dm.omelian@gmail.com">dm.omelian@gmail.com</a>
                </li>
                <li>
                    <span className="contact-icon contact-icon-linkedin" aria-hidden="true">in</span>
                    <a href="https://www.linkedin.com/in/dmytro-omelian/" target="_blank" rel="noreferrer">linkedin.com/in/dmytro-omelian</a>
                </li>
                <li>
                    <span className="contact-icon contact-icon-x" aria-hidden="true">X</span>
                    <a href="https://x.com/dmytroomelian" target="_blank" rel="noreferrer">@dmytroomelian</a>
                </li>
            </ul>
        </div>
    );
}

export default Contact;