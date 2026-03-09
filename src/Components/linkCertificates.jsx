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

const LinkCertificates = () => {
  return (
    <div>
<div className="app-content-header">
  <div className="container-fluid">
    <div className="row">
      <div className="col-sm-6">
        <h3 className="mb-0">Register Certificates to Edge Connector </h3>
      </div>
    </div>
  </div>
</div>

<div className="app-content">
  <div className="container-fluid">

    <div className="row g-4">
      <div className="col-12">
        <div className="callout callout-info">
          Edge Connector needs your DLR dataspace certificate files to access the dataspace API endpoints.
          Obtain the certificates from 
          <a
            href="https://vision-x-dataspace.base-x-ecosystem.org/#/home"
            target="_blank"
            rel="noopener noreferrer"
            className="callout-link"
          >
            DLR Dataspace
          </a>
        </div>
      </div>
      <div className="col-12">
          <div className="card card-primary card-outline mb-4">
            <div className="card-header">
              <div className="card-title">Upload DLR dataspace certificates to Edge Connector</div>
            </div>
        
            <form className="needs-validation" id="certForm" method="post" enctype="multipart/form-data" novalidate>
              <div className="card-body">

                <div className="mb-3">
                  <label htmlFor="connectorName" className="form-label">Connector Name</label>
                  <input type="text" className="form-control" id="connectorName" name="connectorName" required> </input>
                </div>

                <div className="mb-3">
                  <label htmlFor="file1" className="form-label">Certificate File (.crt)</label>
                  <input type="file" className="form-control" id="file1" name="file1" required> </input>
                </div>
            
                <div className="mb-3">
                  <label htmlFor="file2" className="form-label">Certificate File (.key)</label>
                  <input type="file" className="form-control" id="file2" name="file2" required> </input>
                </div>
              </div>
            
              <div className="card-footer">
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
      </div>
    </div>
  </div>
</div>
</div>
);
};

export default LinkCertificates;