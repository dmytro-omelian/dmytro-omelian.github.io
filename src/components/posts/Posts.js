import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './Posts.css';

const posts = [
    {
        id: 1,
        title: "First one",
        date: "December 20, 2025",
        preview: "Before I've already been writing for the last 400 days, mostly on LinkedIn. A few months ago, I started using X. For now, I'm not sure about my goals...",
        content: [
            "Trying to experiment with different concepts of writing.",
            "Before I've already been writing for the last 400 days, mostly on LinkedIn. A few months ago, I started using X. For now, I'm not sure about my goals or what I want to achieve with it, but my motivation is pretty simple: it helps me think more clearly.",
            "Why do I think it would not work out?",
            "1. It makes writing a little bit complicated as the process\n2. I can make no difference and be useless because the newsletter format doesn't work on LinkedIn\n3. I'm bad at writing in such a format (but would be happy if I learn something along the way)\n4. Will not be able to do it consistently (without it, it doesn't really make sense)",
            "But still, it is a weekly thing, and I'm curious to try.",
            "Today, I would also like to share an experiment I've tried: flexible studying hours. I've started reading what I like, listening to podcasts I have been interested in for a long time, and taking a deep dive into different topics, all while asking myself various questions.",
            "It is interesting how this process brings different ideas. You find intersections with what you are working on and possible futures. Allow your curiosity to explore a variety of interesting topics.",
            "I will try to have more of those experiences, but sometimes it is hard to find an extra 6 hours. So maybe it makes sense to have them as 1-2 hour sections."
        ]
    }
];

function Posts() {
    return (
        <div className='posts-container'>
            <h1>Blog</h1>

            <div className="items-list">
                {posts.map(post => (
                    <Link
                        key={post.id}
                        to={`/blog/post/${post.id}`}
                        className="post-item"
                    >
                        <h3>{post.title}</h3>
                        <p className="post-date">{post.date}</p>
                        <p className="post-preview">{post.preview}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function PostDetail() {
    const { id } = useParams();
    const numericId = parseInt(id, 10);

    const item = posts.find(entry => entry.id === numericId);

    if (!item) {
        return (
            <div className='posts-container'>
                <Link to="/blog" className="go-back">Go back to blog</Link>
                <p>Post not found.</p>
            </div>
        );
    }

    return (
        <div className='posts-container'>
            <div className="selected-item">
                <Link to="/blog" className="go-back">Go back to blog</Link>
                <h2>{item.title}</h2>
                {item.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
        </div>
    );
}

export default Posts;