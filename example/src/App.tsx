import React from 'react'
import { HashRouter, Link, Route, useLocation } from 'react-router-dom'
import ThreeDimension from './demos/three-dimensional/ThreeDimension'
import TwoDimension from './demos/two-dimensional/TwoDimension'

function App() {
  return (
    <HashRouter basename="/">
      <Menu />
      <Route path="/2d">
        <TwoDimension />
      </Route>
      <Route exact path="/">
        <TwoDimension />
      </Route>
      <Route path="/3d">
        <ThreeDimension />
      </Route>
    </HashRouter>
  )
}

function Menu() {
  const location = useLocation()
  const pathname = location.pathname
  return (
    <div style={{ position: 'absolute', zIndex: 10 }}>
      <h1>Inverse kinematics examples</h1>
      <ul>
        <li className={pathname === '/2d' ? 'highlighted' : ''}>
          <Link to="/2d">2D example</Link>
        </li>
        <li className={pathname === '/3d' ? 'highlighted' : ''}>
          <Link to="/3d">3D example</Link>
        </li>
        <li>
          <a href="https://github.com/tmf-code/inverse-kinematics">Github page</a>
        </li>
      </ul>
    </div>
  )
}

export default App
