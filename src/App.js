// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Index from './Components/index';
import Home from './Components/home';
import Setup from './Components/guides/setup'
import ProvidingKit from './Components/guides/providing-kits'
import ConsumingKits from './Components/guides/consuming-kit'
import BasicKit from './Components/provide/basic-kit'
import CompositeKit from './Components/provide/composite-kit'
import Contracts from './Components/management/contracts'
import MyKits from './Components/management/myKits'
import ShowPolicies from './Components/management/showPolicies'
import RunCompositeKit from './Components/consume/run-composite-kit'
import Canvas from './Components/consume/canvas'
import SearchKits from './Components/consume/search-kits'
import LinkCertificates from './Components/linkCertificates';


function App() {
  return (
    <Router>
        <Routes>         
          <Route element={<Index />}>
            <Route index element={<Home />} />
            <Route path='/guides/setup' element={<Setup />} />
            <Route path='/guides/providing-kit' element={<ProvidingKit />} />
            <Route path='/guides/consuming-kit' element={<ConsumingKits />} />
            <Route path='/provide/basic-kit' element={<BasicKit />} />
            <Route path='/provide/composite-kit' element={<CompositeKit />} />
            <Route path='/management/contracts' element={<Contracts />} />
            <Route path='/management/myKits' element={<MyKits />} />
            <Route path='/management/showPolicies' element={<ShowPolicies />} />
            <Route path='/consume/run-composite-kit' element={<RunCompositeKit />} />
            <Route path='/consume/canvas' element={<Canvas />} />
            <Route path='/consume/search-kits' element={<SearchKits />} />
            <Route path='/linkCertificates' element={<LinkCertificates />} />



          </Route>
        </Routes>
    </Router>
  );
}

export default App;