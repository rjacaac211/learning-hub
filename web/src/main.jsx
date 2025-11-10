import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import Landing from './routes/Landing'
import Signin from './routes/Signin'
import Library from './routes/Library'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'signin', element: <Signin /> },
      { path: 'library/*', element: <Library /> }
    ]
  }
])

const root = createRoot(document.getElementById('root'))
root.render(<RouterProvider router={router} />)



