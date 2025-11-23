import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import Landing from './routes/Landing'
import Signin from './routes/Signin'
import Library from './routes/Library'
import Pdf from './routes/Pdf'
import Video from './routes/Video'
import Image from './routes/Image'
import Pptx from './routes/Pptx'
import Doc from './routes/Doc'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="signin" replace /> },
      { path: 'signin', element: <Signin /> },
      { path: 'library/*', element: <Library /> },
      { path: 'pdf/*', element: <Pdf /> },
      { path: 'video/*', element: <Video /> },
      { path: 'image/*', element: <Image /> },
      { path: 'pptx/*', element: <Pptx /> },
      { path: 'doc/*', element: <Doc /> }
    ]
  }
])

const root = createRoot(document.getElementById('root'))
root.render(<RouterProvider router={router} />)



