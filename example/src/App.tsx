import React, { Suspense } from 'react'
import { HashRouter, Link, Route, useLocation } from 'react-router-dom'
import SkinnedMeshExample from './demos/three-dimensional/skinned-mesh/SkinnedMesh'
import Basic from './demos/three-dimensional/basic/Basic'
import ThreeJS from './demos/three-dimensional/three-js/ThreeJS'
import TwoDimension from './demos/two-dimensional/TwoDimension'
import ConstrainedLocalRotation from './demos/two-dimensional/ConstrainedLocalRotation'
import ConstrainedGlobalRotation from './demos/two-dimensional/ConstrainedGlobalRotation'

function App() {
  return (
    <HashRouter basename="/">
      <Menu />
      <Route path="/2d">
        <TwoDimension />
      </Route>
      <Route path="/local">
        <ConstrainedLocalRotation />
      </Route>
      <Route path="/global">
        <ConstrainedGlobalRotation />
      </Route>
      <Route exact path="/">
        <TwoDimension />
      </Route>
      <Route path="/3d">
        <Basic />
      </Route>
      <Route path="/three-js">
        <ThreeJS />
      </Route>
      <Route path="/skinned-mesh">
        <Suspense fallback={null}>
          <SkinnedMeshExample />
        </Suspense>
      </Route>
    </HashRouter>
  )
}

function Menu() {
  const location = useLocation()
  const pathname = location.pathname
  return (
    <div style={{ position: 'absolute', zIndex: 10 }}>
      <h2>Inverse kinematics examples</h2>
      <ul>
        <li className={pathname === '/2d' ? 'highlighted' : ''}>
          <Link to="/2d">2D example</Link>
        </li>
        <li className={pathname === '/local' ? 'highlighted' : ''}>
          <Link to="/local">Constrained local rotation example</Link>
        </li>
        <li className={pathname === '/global' ? 'highlighted' : ''}>
          <Link to="/global">Constrained global rotation example</Link>
        </li>
        <li className={pathname === '/3d' ? 'highlighted' : ''}>
          <Link to="/3d">3D example</Link>
        </li>
        <li className={pathname === '/three-js' ? 'highlighted' : ''}>
          <Link to="/three-js">Three.js example</Link>
        </li>
        <li>
          <Link to="/skinned-mesh">Skinned Mesh Demo</Link>
        </li>
        <li>
          <a href="https://github.com/tmf-code/inverse-kinematics">Github page</a>
        </li>
      </ul>
    </div>
  )
}

export default App
