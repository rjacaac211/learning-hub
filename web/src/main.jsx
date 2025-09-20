import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import Landing from './routes/Landing'
import Categories from './routes/Categories'
import Category from './routes/Category'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'categories', element: <Categories /> },
      { path: 'category/:slug', element: <Category /> }
    ]
  }
])

const root = createRoot(document.getElementById('root'))
root.render(<RouterProvider router={router} />)



