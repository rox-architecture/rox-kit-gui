import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/adminlte.css';
import '../css/custom.css';
import '../App.css';

import { Outlet, NavLink } from 'react-router-dom';
import "@fortawesome/fontawesome-free";

import EDGE_CONNECTOR from '../config.js';


/* Sidebar section component */

const SidebarSection = ({ id, title, icon, openMenus, setOpenMenus, children }) => {

  const isOpen = openMenus[id];

  const toggleMenu = () => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <li className={`nav-item ${isOpen ? "menu-open" : ""}`}>

      <button
        type="button"
        className="nav-link w-100 border-0 bg-transparent d-flex justify-content-between align-items-center text-start"
        onClick={toggleMenu}
      >
        <span className="d-flex align-items-center gap-2">
          <i className={`nav-icon bi ${icon}`}></i>
          <p className="mb-0">{title}</p>
        </span>

        <i className={`bi ${isOpen ? "bi-chevron-down" : "bi-chevron-right"}`}></i>
      </button>

      <ul
        className="nav nav-treeview"
        style={{ display: isOpen ? "block" : "none" }}
      >
        {children}
      </ul>

    </li>
  );
};



const MyKitsPage = () => {

  const [color, setColor] = useState("#dc3545");
  const [checking, setChecking] = useState(false);

  const [openMenus, setOpenMenus] = useState({
    guide: false,
    provide: false,
    management: false
  });


  const checkStatus = async () => {

    setChecking(true);

    try {

      const STATUS_URL = `${EDGE_CONNECTOR.ADDRESS}:${EDGE_CONNECTOR.PORT}/livecheck`;

      const response = await fetch(STATUS_URL, { cache: "no-store" });

      const data = await response.json();

      setColor(data.online ? "#28a745" : "#dc3545");

    } catch (err) {

      console.error("API Error:", err);
      setColor("#dc3545");

    } finally {

      setChecking(false);

    }
  };


  return (

    <div className="app-wrapper">


      {/* NAVBAR */}

      <nav className="app-header navbar navbar-expand bg-body">

        <div className="container-fluid">

          <ul className="navbar-nav">

            <li className="nav-item">

              <button
                type="button"
                className="nav-link border-0 bg-transparent"
                data-lte-toggle="sidebar"
              >
                <i className="bi bi-list"></i>
              </button>

            </li>


            <li className="nav-item d-flex align-items-center me-3">

              <div className="d-flex align-items-center gap-2">

                <button
                  className="btn btn-sm btn-outline-secondary fw-semibold"
                  style={{ fontSize: '0.9rem' }}
                  onClick={checkStatus}
                  disabled={checking}
                >
                  {checking ? "Checking..." : "Edge Connector Status"}
                </button>

                <span
                  className="rounded-circle"
                  style={{
                    width: '14px',
                    height: '14px',
                    display: 'inline-block',
                    backgroundColor: color
                  }}
                />

              </div>

            </li>

          </ul>


          <ul className="navbar-nav ms-auto">

            <li className="nav-item">

              <button
                type="button"
                className="nav-link border-0 bg-transparent"
                data-lte-toggle="fullscreen"
              >
                <i className="bi bi-arrows-fullscreen"></i>
              </button>

            </li>

          </ul>

        </div>

      </nav>



      {/* SIDEBAR */}

      <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">

        <div className="sidebar-brand">

          <a
            href="https://vision-x-dataspace.base-x-ecosystem.org/"
            className="brand-link"
          >

            <img
              src="/static/images/dlr_logo.jpg"
              alt="DLR Logo"
              className="brand-image opacity-75 shadow"
              style={{
                height: '50px',
                backgroundColor: 'white',
                padding: '2px'
              }}
            />

          </a>

          <a
            href="https://www.project-rox.ai/en/"
            className="brand-link"
          >

            <img
              src="/static/images/ROX_Logo_RGB.png"
              alt="ROX Logo"
              className="brand-image opacity-75 shadow"
              style={{
                height: '33px',
                backgroundColor: 'white',
                padding: '2px'
              }}
            />

          </a>

          <span className="brand-text fw-light">KIT GUI</span>

        </div>



        <div className="sidebar-wrapper">

          <nav className="mt-2">

            <ul className="nav sidebar-menu flex-column">


              {/* GUIDE */}

              <SidebarSection
                id="guide"
                title="Guide"
                icon="bi-info-circle"
                openMenus={openMenus}
                setOpenMenus={setOpenMenus}
              >

                <li className="nav-item">

                  <NavLink to="/guides/setup" className="nav-link">

                    <i className="nav-icon bi bi-clipboard-check"></i>
                    <p>Getting Started</p>

                  </NavLink>

                </li>


                <li className="nav-item">

                  <NavLink to="/guides/providing-kit" className="nav-link">

                    <i className="nav-icon bi bi-clipboard-check"></i>
                    <p>Providing KITs</p>

                  </NavLink>

                </li>


                <li className="nav-item">

                  <NavLink to="/guides/consuming-kit" className="nav-link">

                    <i className="nav-icon bi bi-clipboard-check"></i>
                    <p>Consuming KITs</p>

                  </NavLink>

                </li>

              </SidebarSection>



              {/* PROVIDER MENU */}

              <li className="nav-header">Provider's Menu</li>


              <SidebarSection
                id="provide"
                title="Provide"
                icon="bi-cloud-upload"
                openMenus={openMenus}
                setOpenMenus={setOpenMenus}
              >

                <li className="nav-item">

                  <NavLink to="/provide/basic-kit" className="nav-link">

                    <i className="nav-icon bi bi-plus-square"></i>
                    <p>Basic KIT</p>

                  </NavLink>

                </li>


                <li className="nav-item">

                  <NavLink to="/provide/composite-kit" className="nav-link">

                    <i className="nav-icon bi bi-diagram-3"></i>
                    <p>Composite KIT</p>

                  </NavLink>

                </li>

              </SidebarSection>



              {/* MANAGEMENT */}

              <SidebarSection
                id="management"
                title="Management"
                icon="bi-box-seam-fill"
                openMenus={openMenus}
                setOpenMenus={setOpenMenus}
              >

                <li className="nav-item">

                  <NavLink to="/management/myKits" className="nav-link">

                    <i className="nav-icon bi bi-box"></i>
                    <p>My KITs (Assets)</p>

                  </NavLink>

                </li>


                <li className="nav-item">

                  <NavLink to="/management/contracts" className="nav-link">

                    <i className="nav-icon bi bi-people"></i>
                    <p>Contracts (Offers)</p>

                  </NavLink>

                </li>


                <li className="nav-item">

                  <NavLink to="/management/showPolicies" className="nav-link">

                    <i className="nav-icon bi bi-shield-lock"></i>
                    <p>Show Policies</p>

                  </NavLink>

                </li>

              </SidebarSection>



              {/* CONSUMER */}

              <li className="nav-header">Consumer's Menu</li>


              <li className="nav-item">

                <NavLink to="/consume/search-kits" className="nav-link">

                  <i className="nav-icon bi bi-search"></i>
                  <p>Search KITs</p>

                </NavLink>

              </li>


              <li className="nav-item">

                <NavLink to="/consume/canvas" className="nav-link">

                  <i className="nav-icon bi bi-boxes"></i>
                  <p>Canvas</p>

                </NavLink>

              </li>



              {/* DATASPACE */}

              <li className="nav-header">DLR Dataspace</li>


              <li className="nav-item">

                <NavLink to="/linkCertificates" className="nav-link">

                  <i className="nav-icon bi bi-key"></i>
                  <p>Link certificate files</p>

                </NavLink>

              </li>

            </ul>

          </nav>

        </div>

      </aside>


      <Outlet />


    </div>
  );
};

export default MyKitsPage;