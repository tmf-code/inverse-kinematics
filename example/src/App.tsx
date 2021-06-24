import React from 'react'
import { HashRouter, Link, Route } from 'react-router-dom'
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
  return (
    <div style={{ position: 'absolute', zIndex: 10 }}>
      <ul>
        <li>
          <a href="https://github.com/tmf-code/inverse-kinematics">Github page</a>
        </li>
        <li>
          <Link to="/2d">2D Demo</Link>
        </li>

        <li>
          <Link to="/3d">3D Demo</Link>
        </li>
      </ul>
    </div>
  )
}

export default App
