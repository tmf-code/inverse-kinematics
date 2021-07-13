import React, { Suspense } from 'react'
import { HashRouter, Link, Route, useLocation } from 'react-router-dom'
import SkinnedMeshExample from './demos/three-dimensional/skinned-mesh/SkinnedMesh'
import Basic from './demos/three-dimensional/basic/Basic'
import ThreeJS from './demos/three-dimensional/three-js/ThreeJS'
import TwoDimension from './demos/two-dimensional/TwoDimension'
import ConstrainedLocalRotation2D from './demos/two-dimensional/ConstrainedLocalRotation2D'
import ConstrainedLocalRotation3D from './demos/three-dimensional/ConstrainedLocalRotation3D'
import ConstrainedGlobalRotation2D from './demos/two-dimensional/ConstrainedGlobalRotation2D'
import ConstrainedGlobalRotation3D from './demos/three-dimensional/ConstrainedGlobalRotation3D'
import WebXRExample from './demos/three-dimensional/web-xr/WebXR'
import MovingBaseExample from './demos/three-dimensional/moving-base/MovingBase'
import MovingEndsExample from './demos/three-dimensional/moving-ends/MovingEnds'

function App() {
  return (
    <HashRouter basename="/">
      <Menu />
      <Route path="/2d">
        <TwoDimension />
      </Route>
      <Route path="/2d-local">
        <ConstrainedLocalRotation2D />
      </Route>
      <Route path="/2d-global">
        <ConstrainedGlobalRotation2D />
      </Route>
      <Route exact path="/">
        <TwoDimension />
      </Route>
      <Route path="/3d">
        <Basic />
      </Route>
      <Route path="/3d-local">
        <ConstrainedLocalRotation3D />
      </Route>
      <Route path="/3d-global">
        <ConstrainedGlobalRotation3D />
      </Route>
      <Route path="/three-js">
        <ThreeJS />
      </Route>
      <Route path="/skinned-mesh">
        <Suspense fallback={null}>
          <SkinnedMeshExample />
        </Suspense>
      </Route>
      <Route path="/web-xr">
        <Suspense fallback={null}>
          <WebXRExample />
        </Suspense>
      </Route>
      <Route path="/moving-base">
        <MovingBaseExample />
      </Route>
      <Route path="/moving-ends">
        <MovingEndsExample />
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
      <a href="https://github.com/tmf-code/inverse-kinematics">Github page</a>
      <h3>2d</h3>
      <ul>
        <li className={pathname === '/2d' ? 'highlighted' : ''}>
          <Link to="/2d">2D basic</Link>
        </li>
        <li className={pathname === '/2d-local' ? 'highlighted' : ''}>
          <Link to="/2d-local">Constrained local rotation</Link>
        </li>
        <li className={pathname === '/2d-global' ? 'highlighted' : ''}>
          <Link to="/2d-global">Constrained global rotation</Link>
        </li>
      </ul>
      <h3>3d</h3>
      <ul>
        <li className={pathname === '/3d' ? 'highlighted' : ''}>
          <Link to="/3d">3D basic</Link>
        </li>
        <li className={pathname === '/three-js' ? 'highlighted' : ''}>
          <Link to="/three-js">Three.js</Link>
        </li>
        <li>
          <Link to="/skinned-mesh">Three js Skinned Mesh</Link>
        </li>
        <li className={pathname === '/web-xr' ? 'highlighted' : ''}>
          <Link to="/web-xr">Web XR</Link>
        </li>
        <li className={pathname === '/moving-base' ? 'highlighted' : ''}>
          <Link to="/moving-base">Moving base</Link>
        </li>
        <li className={pathname === '/moving-ends' ? 'highlighted' : ''}>
          <Link to="/moving-ends">Moving ends</Link>
        </li>
        <li className={pathname === '/3d-local' ? 'highlighted' : ''}>
          <Link to="/3d-local">Constrained local rotation</Link>
        </li>
        <li className={pathname === '/3d-global' ? 'highlighted' : ''}>
          <Link to="/3d-global">Constrained global rotation</Link>
        </li>
      </ul>
    </div>
  )
}

export default App
