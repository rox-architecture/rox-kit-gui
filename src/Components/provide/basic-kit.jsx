import React, { useState, useEffect, useMemo, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/adminlte.css'
import '../../css/custom.css'
import '../../App.css'
import ModelTreeView from './modelTreeView';
import "@fortawesome/fontawesome-free"
import EDGE_CONNECTOR from "../../config.js"

export default function BasicKit() {
  const fileInputRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [Tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [businessValue, setBusinessValue] = useState('');
  const [vision, setVision] = useState('');
  const [license, setLicense] = useState('');
  const [contactPoint, setContactPoint] = useState('');
  const [httpUrl, setHttpUrl] = useState('');
  const [httpRequestType, setHttpRequestType] = useState('');
  const [httpRequestBody, setHttpRequestBody] = useState('');
  const [offerType, setOfferType] = useState('');
  const [imageEncoded, setImageEncoded] = useState('');
  const [postProcessing, setPostProcessing] = useState('');
  const [fileName, setFileName] = useState('');
  const [httpMetod, setHttpMethod] = useState('');

  // schema related objects
  const [mandatoryObj, setMandatoryObj] = useState({});
  const [optionalObj, setOptionalObj] = useState({});
  const [mandatoryArea, setMandatoryArea] = useState('');
  const [optionalArea, setOptionalArea] = useState('');
  

  const treeData = useMemo(
    () => [
      {
        id: 'root', parent: '#', label: 'RoX Semantic Models', icon: 'fas fa-folder',
        children: [
          { id: 'dataset', parent: 'root', label: 'Dataset', icon: 'bi bi-database' },
          { id: 'service', parent: 'root', label: 'Service', icon: 'bi bi-globe' },
          {id:'software', parent:'root', label:'Software', icon: 'bi bi-database', children: [
          { parent:'software',label: "Robot operation", id: "software/robot_operation", icon: "bi bi-code-slash" },
          { parent:'software',label: "Motion control", id: "software/motion_control", icon: "bi bi-code-slash" },
          { parent:'software',label: "Perception vision", id: "software/perception_vision", icon: "bi bi-code-slash" },
          { parent:'software',label: "Simulation digital twin", id: "software/simulation", icon: "bi bi-code-slash" },
          { parent:'software',label: "AI analysis", id: "software/ai_analysis", icon: "bi bi-code-slash" },
          {parent:'software',label: "Integration orchestration", id: "software/integration_orchestration", icon: "bi bi-code-slash" }
        ]},
          {id: 'hardware', parent: 'root', label: 'Hardware', icon: 'fas fa-folder', children: [
              {
                id: 'robot', parent: 'hardware', label: 'Robot', icon: 'fas fa-folder',
                children: [

                  { id: 'hardware/robot/mobile_robot', parent: 'robot', label: 'Mobile robot', icon: 'bi bi-robot' },
                  { id: 'hardware/robot/stationary_serial_robot', parent: 'robot', label: 'Stationary Serial robot', icon: 'bi bi-robot' },
                  { id: 'hardware/robot/stationary_parallel_robot', parent: 'robot', label: 'Stationary Parallel robot', icon: 'bi bi-robot' },
                ]
              },

               { 
              id: "tooling", parent: 'hardware', label: 'Tooling', icon: 'fas fa-folder' , children:[
              {  id: "hardware/tooling/welding",  parent: 'tooling', label: 'Welding', icon: "bi bi-tools" },
              {  parent: 'tooling', label: "Gripper", id: "hardware/tooling/gripper", icon: "bi bi-tools" },
              { parent: 'tooling',label: "Cutting separation", id: "hardware/tooling/cutting", icon: "bi bi-tools" },
              { parent: 'tooling',label: "Screwing assembly", id: "hardware/tooling/screwing", icon: "bi bi-tools" },
              { parent: 'tooling',label: "Griding Polishing", id: "hardware/tooling/grinding", icon: "bi bi-tools" },
              { parent: 'tooling',label: "Dispensing additive", id: "hardware/tooling/dispensing", icon: "bi bi-tools" },
              { parent: 'tooling',label: "Measuring inspection", id: "hardware/tooling/measuring", icon: "bi bi-tools" },
              { parent: 'tooling',label: "Special", id: "hardware/tooling/special", icon: "bi bi-tools" }
            ]
          },
            { 
            id: "controller", parent: 'hardware', label: 'Controller', icon: 'fas fa-folder' ,
            children:[
              {  parent: 'controller',label: "Robot controller", id: "hardware/controller/robot_controller", icon: "bi bi-gear-wide-connected" },
              { parent: 'controller',label: "PLC", id: "hardware/controller/plc", icon: "bi bi-gear-wide-connected" },
              { parent: 'controller',label: "IPC", id: "hardware/controller/ipc", icon: "bi bi-gear-wide-connected" }
            ]
          },
          { 
            id: "sensor", parent: 'hardware', label: 'Sensor', icon: 'fas fa-folder' , 
            children:[
              { parent: 'sensor',label: "Vision", id: "hardware/sensor/vision", icon: "bi bi-speedometer" },
              { parent: 'sensor',label: "Lidar", id: "hardware/sensor/lidar", icon: "bi bi-speedometer" },
              { parent: 'sensor',label: "Force torque", id: "hardware/sensor/force", icon: "bi bi-speedometer" },
              { parent: 'sensor',label: "Tactile proximity", id: "hardware/sensor/tactile", icon: "bi bi-speedometer" },
              { parent: 'sensor',label: "Inertial", id: "hardware/sensor/inertial", icon: "bi bi-speedometer" },
              { parent: 'sensor',label: "Encoder", id: "hardware/sensor/encoder", icon: "bi bi-speedometer" }
            ]
          }
            ]
          },

        ]
      },


    ], []
  );

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          alert("Could not process image.");
          return;
        }

        ctx.clearRect(0, 0, 48, 48);
        ctx.drawImage(img, 0, 0, 48, 48);

        const base64 = canvas.toDataURL(file.type || 'image/png');
        setImageEncoded(base64);
      };

      img.onerror = () => {
        alert("Invalid image file.");
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      alert("Failed to read file.");
    };

    reader.readAsDataURL(file);
  };

  const getSchema = async () => {
    const schemaPath = `/schemas/${selectedNode.id}.json`;

    if (!selectedNode?.id) {
      alert("Please select a semantic model node first.");
      return;
    }

    console.log(selectedNode);

    const response = await fetch(schemaPath);
    if (!response.ok) throw new Error(`Schema not found at ${schemaPath}`);

    const schema = await response.json();

    setMandatoryObj(schema.mandatory ?? {});
    setOptionalObj(schema.optional ?? {});

    setMandatoryArea(JSON.stringify(schema.mandatory ?? {}, null, 2));
    setOptionalArea(JSON.stringify(schema.optional ?? {}, null, 2));
  };


  const createKit = async (e) => {
    e.preventDefault();

    let mandatoryParsed = {};
    let optionalParsed = {};

    try {
      mandatoryParsed = mandatoryArea ? JSON.parse(mandatoryArea) : {};
    } catch (e) {
      alert("Mandatory fields JSON is invalid.");
      return;
    }

    try {
      optionalParsed = optionalArea ? JSON.parse(optionalArea) : {};
    } catch (e) {
      alert("Optional fields JSON is invalid.");
      return;
    }

    const semantic_model = {
      ...(mandatoryArea ? JSON.parse(mandatoryArea) : {}),
      ...(optionalArea ? JSON.parse(optionalArea) : {})
    };
    const general_info = {
      // General Information
      kit_name: name,
      kit_type: "basic",
      name: name,
      version: version,
      description: description,
      tag: Tag || null,
      business: businessValue || null,
      vision: vision || null,
      license: license || null,
      contact: contactPoint || null,
      offerType: offerType,
      };

      const additional_info = {
      icon: imageEncoded || null,
      execution_commands: postProcessing || null,
      default_file_name: fileName || null
    }


    const data = {    
      // general information about KIT
      general_info: general_info,

      // Semantic Model
      semantic_model: semantic_model,

      // additional information
      additional_info: additional_info,
    };
      // asset representative image
      //icon: document.getElementById('imageEncoded').value || null,
      
    console.log(data)

    const selectedAssetType = document.querySelector('input[name="gridRadiosAsset"]:checked')?.value;

    let STATUS_URL;
    if (selectedAssetType === 'httpOption') {
      STATUS_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/create/basickit`;
      Object.assign(data, {
        access_info:{
          url: httpUrl,
          asset_type: "http",
          method: httpMetod,
          request_type: httpRequestType,
          request_body: httpRequestBody ? JSON.parse(httpRequestBody) : null
        }
      });
    } 
    else if (selectedAssetType === 'amazonOption'){
      STATUS_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/kit/basic/create/aws`;
      Object.assign(data, {
        asset_type: "aws",
        storage_url: document.getElementById('bucketURL').value,
        bucket_name: document.getElementById('bucketName').value,
        storage_region: document.getElementById('bucketRegion').value,
        object_path: document.getElementById('objectPath').value,
        storage_username: document.getElementById('userName').value,
        storage_password: document.getElementById('userPassword').value
      });
    }

    try {
      // Use EDGE_CONNECTOR from config.js
      console.log("STATUS_URL", STATUS_URL);
      console.log(JSON.stringify(data, null, 2));
      const response = await fetch(STATUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      alert('Asset created successfully!');
      } catch (error) {
        alert(`Error sending HTTP request: ${error.message}`);
        console.error(error);
      }
};


/*
  text: "RoX Semantic Models!!",
    state: { opened: true },
    children: [
      {
        text: "Service",
        id: "service",
        icon: "bi bi-globe"
      },
      {
        text: "Docker",
        id: "docker",
        icon: "bi bi-globe"
      },
      {
        text: "Hardware",
        children: [
          { 
            text: "Robot", 
            children:[
              { text: "Mobile robot", id: "hardware/robot/mobile_robot", icon: "bi bi-robot" },
              { text: "Stationary Serial robot", id: "hardware/robot/stationary_serial_robot", icon: "bi bi-robot" },
              { text: "Stationary Parallel robot", id: "hardware/robot/stationary_parallel_robot", icon: "bi bi-robot" }
            ]
          },
          { 
            text: "Tooling", 
            children:[
              { text: "Welding", id: "hardware/tooling/welding", icon: "bi bi-tools" },
              { text: "Gripper", id: "hardware/tooling/gripper", icon: "bi bi-tools" },
              { text: "Cutting separation", id: "hardware/tooling/cutting", icon: "bi bi-tools" },
              { text: "Screwing assembly", id: "hardware/tooling/screwing", icon: "bi bi-tools" },
              { text: "Griding Polishing", id: "hardware/tooling/grinding", icon: "bi bi-tools" },
              { text: "Dispensing additive", id: "hardware/tooling/dispensing", icon: "bi bi-tools" },
              { text: "Measuring inspection", id: "hardware/tooling/measuring", icon: "bi bi-tools" },
              { text: "Special", id: "hardware/tooling/special", icon: "bi bi-tools" }
            ]
          },
          { 
            text: "Controller", 
            children:[
              { text: "Robot controller", id: "hardware/controller/robot_controller", icon: "bi bi-gear-wide-connected" },
              { text: "PLC", id: "hardware/controller/plc", icon: "bi bi-gear-wide-connected" },
              { text: "IPC", id: "hardware/controller/ipc", icon: "bi bi-gear-wide-connected" }
            ]
          },
          { 
            text: "Sensor", 
            children:[
              { text: "Vision", id: "hardware/sensor/vision", icon: "bi bi-speedometer" },
              { text: "Lidar", id: "hardware/sensor/lidar", icon: "bi bi-speedometer" },
              { text: "Force torque", id: "hardware/sensor/force", icon: "bi bi-speedometer" },
              { text: "Tactile proximity", id: "hardware/sensor/tactile", icon: "bi bi-speedometer" },
              { text: "Inertial", id: "hardware/sensor/inertial", icon: "bi bi-speedometer" },
              { text: "Encoder", id: "hardware/sensor/encoder", icon: "bi bi-speedometer" }
            ]
          }
        ]
      },
      {
        text: "Software",
        children: [
          { text: "Robot operation", id: "software/robot_operation", icon: "bi bi-code-slash" },
          { text: "Motion control", id: "software/motion_control", icon: "bi bi-code-slash" },
          { text: "Perception vision", id: "software/perception_vision", icon: "bi bi-code-slash" },
          { text: "Simulation digital twin", id: "software/simulation", icon: "bi bi-code-slash" },
          { text: "AI analysis", id: "software/ai_analysis", icon: "bi bi-code-slash" },
          { text: "Integration orchestration", id: "software/integration_orchestration", icon: "bi bi-code-slash" }
        ]
      }
    ]
*/


return (
  <div>
    <div className="app-content-header">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-6">
            <h3 className="mb-0">Provide / Basic KIT</h3>
          </div>
          <div className="col-sm-6 d-flex justify-content-end">
            <button id="toggleInputBtn" type="butoon" className="btn btn-primary">Toggle Input: Form &#8596; JSON</button>
          </div>
        </div>
      </div>
    </div>

    <div className="app-content">
      <div className="container-fluid">
        <div id="formContainer">
          <form id="guiForm">
            <div className="row g-4">
              <div className="col-md-6">

                <div className="card card-success card-outline mb-4">
                  <div className="card-header">
                    <div className="card-title">General Information</div>
                  </div>
                  <div className="card-body">
                    <div className="row mb-3">
                      <label htmlFor="kitName" className="col-sm-3 col-form-label" >KIT Name*</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="kitName" value={name} onChange={(e) => setName(e.target.value)}/>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="version" className="col-sm-3 col-form-label" >Version*</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="version" value={version} onChange={(e) => setVersion(e.target.value)}/>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="tag" className="col-sm-3 col-form-label" >Tag (keyword)</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="tag" value={Tag} onChange={(e) => setTag(e.target.value)}/>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="description" className="col-sm-3 col-form-label" >Short Description*</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="description" value={description} onChange={(e) => setDescription(e.target.value)}/>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="businessValue" className="col-sm-3 col-form-label" >Business Value</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="businessValue" value={businessValue} onChange={(e) => setBusinessValue(e.target.value)}/>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="vision" className="col-sm-3 col-form-label" >Vision / Mission</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="vision" value={vision} onChange={(e) => setVision(e.target.value)}/>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="license" className="col-sm-3 col-form-label" >License</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="license" value={license} onChange={(e) => setLicense(e.target.value)}/>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="contact" className="col-sm-3 col-form-label" >Contact Point</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="contact" value={contactPoint} onChange={(e) => setContactPoint(e.target.value)}/>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-info card-outline mb-4">
                  <div className="card-header">
                    <div className="card-title">Asset Location</div>
                  </div>
                  <div className="card-body">
                    <fieldset className="row mb-3">
                      <legend className="col-form-label col-sm-3 pt-0">Location Type</legend>
                      <div className="col-sm-9">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="gridRadiosAsset"
                            id="httpAssetType"
                            value="httpOption"
                          />
                          <label className="form-check-label" htmlFor="httpAssetType"> HTTP </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="gridRadiosAsset"
                            id="amazonAssetType"
                            value="amazonOption"
                            disabled
                          />
                          <label className="form-check-label" htmlFor="amazonAssetType"> Amazon S3 Bucket (MinIO) </label>
                        </div>
                        <div className="form-check disabled">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="gridRadiosAsset"
                            id="azureAssetType"
                            value="azureOption"
                            disabled
                          />
                          <label className="form-check-label" htmlFor="azureAssetType">
                            Azure Bucket
                          </label>
                        </div>
                      </div>
                    </fieldset>

                    <div id="httpFields">
                      <div className="row mb-3">
                        <label className="form-label">URL*</label>
                        <div className="input-group">
                          <select id="httpMethod" className="form-select" style={{ maxWidth: '120px' }}  value={httpMetod} onChange={(e) => setHttpMethod(e.target.value)}>
                            <option value="">---</option>
                            <option value="GET" >GET</option>
                            <option value="POST" >POST</option>
                            <option value="PUT" >PUT</option>
                            <option value="PATCH" >PATCH</option>
                            <option value="DELETE" >DELETE</option>
                          </select>
                          <input
                            id="httpUrl"
                            type="url"
                            className="form-control"
                            placeholder="https://api.example.com/resource"
                            value={httpUrl}
                            onChange={(e) => setHttpUrl(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label htmlFor="httpRequestHeader" className="col-sm-12 col-form-label"> Request Header </label>
                        <div className="col-sm-12">
                          <textarea
                            id="httpRequestHeader"
                            name="httpRequestBody"
                            className="form-control"
                            rows="1"
                            style={{ width: '100%', resize: 'vertical' }}
                            placeholder='key:value, key:value, ...'
                            value={httpRequestBody}
                            onChange={(e) => setHttpRequestBody(e.target.value)}
                          ></textarea>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label htmlFor="httpRequestType" className="col-sm-5 col-form-label">Request content-type*</label>
                        <div className="col-sm-7">
                          <select id="httpRequestType" className="form-select" name="httpRequestType" value={httpRequestType} onChange={(e) => setHttpRequestType(e.target.value)}>
                            <option value="none" >None (no request body)</option>
                            <option value="application/json" >JSON (application/json)</option>
                            <option value="multipart/form-data">File upload (multipart/form-data)</option>
                            <option value="application/octet-stream">Binary / Raw Data (application/octet-stream) </option>
                          </select>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label htmlFor="httpRequestBody" className="col-sm-12 col-form-label"> Request body JSON schema </label>
                        <div className="col-sm-12">
                          <textarea
                            id="httpRequestBody"
                            name="httpRequestBody"
                            className="form-control"
                            rows="6"
                            style={{ width: '100%', resize: 'vertical' }}
                            placeholder='If no response JSON schema, leave here empty'
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <div id="s3Fields" style={{ display: 'none' }}>

                      <div className="row mb-3">
                        <label htmlFor="bucketURL" className="col-sm-3 col-form-label">Storage URL*</label>
                        <div className="col-sm-9">
                          <input type="text" className="form-control" id="bucketURL" />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label htmlFor="bucketName" className="col-sm-3 col-form-label">Bucket name*</label>
                        <div className="col-sm-9">
                          <input type="text" className="form-control" id="bucketName" />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label htmlFor="bucketRegion" className="col-sm-3 col-form-label">Storage region*</label>
                        <div className="col-sm-9">
                          <input type="text" className="form-control" id="bucketRegion" />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label htmlFor="objectPath" className="col-sm-12 col-form-label">Object path (relative path based on the bucket as the root)*</label>
                        <div className="col-sm-12">
                          <input type="text" className="form-control" id="objectPath" />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="userName" className="form-label">Storage username</label>
                          <input
                            type="text"
                            className="form-control"
                            id="userName"
                            name="userName"

                          />
                          <div className="valid-feedback">Looks good!</div>
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="userPassword" className="form-label">Storage user password</label>
                          <input
                            type="password"
                            className="form-control"
                            id="userPassword"
                            name="userPassword"

                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">

                <div className="card card-primary card-outline mb-4">
                  <div className="card-header">
                    <div className="card-title">Semantic Model Description</div>
                  </div>
                  <div className="card-body">
                    <ModelTreeView data={treeData} selectedID={selectedNode?.id} onSelect={setSelectedNode} />

                    <input type="hidden" name="asset_type" id="asset_type">
                    </input>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <button id="generateSchema" type="button" className="btn btn-primary w-100" onClick={getSchema}>Generate Schema</button>
                      </div>
                      <div className="col-md-6">
                        <button id="generateSchemaRODEOS" type="button" className="btn btn-secondary w-100">AI Generated Schema (RODEOS)</button>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <p>Mandatory fields:</p>
                      <textarea id="semanticSchema" className="form-control" rows="4" placeholder="Generated schema will appear here..." value= {mandatoryArea} onChange={(e) => setMandatoryArea(e.target.value)}></textarea>
                    </div>
                    <div className="row mb-3">
                      <p>Optional fields:</p>
                      <textarea id="semanticSchema2" className="form-control" rows="4" placeholder="Generated schema will appear here..." value={optionalArea} onChange={(e) => setOptionalArea(e.target.value)}></textarea>
                    </div>
                  </div>
                </div>

                <div className="card card-secondary card-outline mb-4">
                  <div className="card-header">
                    <div className="card-title mb-0">Thumbnail Image (Optional)</div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select Picture
                      </button>

                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small">Preview:</span>

                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            backgroundColor: '#fff'
                          }}
                        >
                          {imageEncoded ? (
                            <img
                              src={imageEncoded}
                              alt="thumbnail preview"
                              width="48"
                              height="48"
                              style={{ objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <span style={{ fontSize: '11px', color: '#999' }}>No image</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />

                    <textarea
                      id="imageEncoded"
                      className="form-control"
                      rows="4"
                      value={imageEncoded}
                      placeholder="Image encoded into text will appear here..."
                      readOnly
                    ></textarea>
                  </div>
                </div>

                <div className="card card-warning card-outline mb-4">
                  <div className="card-header">
                    <div className="card-title">Submission</div>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label me-3">Select Type:</label>
                      <div className="form-check form-check-inline" >
                        <input className="form-check-input" type="radio" name="submissionType" id="typeData" value="data" checked={offerType === "data"} onChange={(e) => setOfferType(e.target.value)}>
                        </input>
                        <label className="form-check-label" htmlFor="typeData">Data</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="submissionType" id="typeService" value="service" onChange={(e) => setOfferType(e.target.value)}>
                        </input>
                        <label className="form-check-label" htmlFor="typeService">Service</label>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="filename" className="col-sm-3 col-form-label">Default File Name</label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          className="form-control"
                          id="filename"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <label htmlFor="postProcessingCmd" className="col-sm-12 col-form-label">Post Processing</label>
                      <div className="col-sm-12">
                        <textarea
                          className="form-control"
                          rows="4"
                          id="postProcessingCmd"
                          placeholder="This command will be executed immediately after saving the Basic KIT in the memory. Use it for, e.g., unzipping files. Provide the default file name so that this command can assume the file name"
                          value={postProcessing}
                          onChange={(e) => setPostProcessing(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                    <div className="card-footer">
                      <button id="submit1" type="submit" className="btn btn-success" onClick={createKit}>Submit</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </form>
        </div>
        <div id="jsonContainer" style={{ display: 'none' }}>
          <textarea className="form-control" rows="8" placeholder="Paste JSON here..."></textarea>
          <div className="card-footer">
            <button id="submit2" type="submit" className="btn btn-success" onClick={createKit}>Submit</button>
          </div>
        </div>
      </div>
    </div>
  </div>);
};
