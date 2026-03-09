// src/Test2.js
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/adminlte.css'
import '../../css/custom.css'
import '../../App.css'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const ProvidingKits = () => {
    const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    fetch('/content/providing-kits.md')
      .then(response => response.text())
      .then(markdown => {
        setMarkdownContent(markdown);
      })
      .catch(error => console.error('Error fetching markdown:', error));
}, []);
    

  return (
    <div>
        <div className="app-content-header">
  <div className="container-fluid">
    <div className="row">
      <div className="col-sm-12">
        <h3 className="mb-0">Guide / Setup</h3>
        <p>Initial Setup Guide </p>
      </div>
    </div>
  </div>
</div>


<div className="app-content">
  <div className="container-fluid">
    <div id="markdown-container" 
    style={{ maxWidth: '120ch', margin: '0 auto', padding: '1.5rem', lineHeight: '1.6' }}>
        
    </div>
    <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}>
                      {markdownContent}</ReactMarkdown>
  </div>
</div>
    </div>
);
};

export default ProvidingKits;