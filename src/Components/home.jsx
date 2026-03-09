 // src/Test2.js
 import React, { useState, useEffect } from 'react';
 import { marked } from 'marked';
 import DOMPurify from 'dompurify';
 import 'bootstrap/dist/css/bootstrap.min.css';
 import '../css/adminlte.css'
 import '../css/custom.css'
 import '../App.css'
 import ReactMarkdown from 'react-markdown'
 import rehypeRaw from 'rehype-raw'
 
 const Home = () => {
     const [markdownContent, setMarkdownContent] = useState('');

    
      useEffect(() => {
        fetch('/content/home.md')
          .then(response => response.text())
          .then(markdown => {
            setMarkdownContent(markdown);
          })
          .catch(error => console.error('Error fetching markdown:', error));
    
      }, []);
    
   return (
  <div>
 <main className="app-main" id="main-content" style={{paddingLeft:20}}>
           <div id="markdown-container" 
            style={{
          maxWidth: '120ch',
          margin: '0 auto',
          padding: '1.5rem',
          paddingLeft: '20px',
          lineHeight: '1.6'
            }}>
            </div>
            <ReactMarkdown
            rehypePlugins={[rehypeRaw]}>
              {markdownContent}</ReactMarkdown>
          
          </main>
  </div>
 );
 };
 
 export default Home;
 