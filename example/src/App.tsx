import React from 'react'
import TwoDimension from './demos/two-dimensional/TwoDimension'
import { HashRouter, Link, Route } from 'react-router-dom'

function App() {
  return (
    <HashRouter basename="/">
      <Menu />
      <Route path="/2d">
        <TwoDimension />
      </Route>
      <Route path="/3d">Three D Demo yet to be implemented</Route>
    </HashRouter>
  )
}

function Menu() {
  return (
    <div style={{ position: 'absolute', zIndex: 10 }}>
      <ul>
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
